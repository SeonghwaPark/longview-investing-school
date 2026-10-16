"""Yahoo Finance에서 일별 OHLCV + 배당·분할 조정 종가를 받아 dist/history.js를 다시 씁니다.

사용: python scripts/fetch_history.py            (저장소 루트에서)
     python scripts/fetch_history.py --since 2016-01-01

- 종목 목록: data/tickers.json  (symbol, name)
- 출력:      dist/history.js   (const MARKET_HISTORY = {...})
- 한 종목이 실패하면 기존 history.js의 그 종목 데이터를 그대로 유지합니다.
- 모든 종목이 실패하면 파일을 건드리지 않고 종료 코드 1을 냅니다.
"""
import argparse, concurrent.futures, datetime as dt, json, pathlib, re, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TICKERS = ROOT / "data" / "tickers.json"
OUT = ROOT / "dist" / "history.js"
MACRO_OUT = ROOT / "dist" / "macro.js"
# FRED는 브라우저 흉내 UA를 끊으므로 정직한 UA를 씁니다.
FRED_UA = {"User-Agent": "LONGVIEW-data-refresh/1.0 (+https://github.com/SeonghwaPark/longview-investing-school)", "Accept": "text/csv,*/*"}
# FRED 공개 CSV(키 불필요) · 금리·달러·VIX. 실패해도 가격 갱신은 계속합니다.
MACRO = [("DGS2", "미국 2년물 국채금리", "%"), ("DGS10", "미국 10년물 국채금리", "%"), ("DGS30", "미국 30년물 국채금리", "%"), ("VIXCLS", "VIX 변동성 지수", "pt"), ("DTWEXBGS", "달러 인덱스 (광의, 명목)", "idx")]
FIELDS = ["date", "open", "high", "low", "close", "adjClose", "volume"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      "Accept": "application/json"}


def fetch(symbol, since, retries=3):
    p1 = int(dt.datetime.combine(since, dt.time(), dt.timezone.utc).timestamp())
    p2 = int(time.time()) + 86400
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={p1}&period2={p2}&interval=1d&events=div%2Csplit"
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                obj = json.load(r)
            res = obj["chart"]["result"][0]
            q = res["indicators"]["quote"][0]
            adj = res["indicators"]["adjclose"][0]["adjclose"]
            rows = []
            for i, ts in enumerate(res["timestamp"]):
                o, h, l, c, v, a = q["open"][i], q["high"][i], q["low"][i], q["close"][i], q["volume"][i], adj[i]
                if a is None and c is not None:
                    a = c  # 최신 봉은 조정 전 값이 아직 없을 수 있음
                if None in (o, h, l, c, a) or c <= 0 or a <= 0:
                    continue
                d = dt.datetime.fromtimestamp(ts, dt.timezone.utc).date().isoformat()
                rows.append([d, round(o, 4), round(h, 4), round(l, 4), round(c, 4), round(a, 4), int(v or 0)])
            # 같은 날짜 중복 제거(장중 봉이 섞이는 경우) 후 정렬 확인
            dedup = {}
            for row in rows:
                dedup[row[0]] = row
            rows = [dedup[k] for k in sorted(dedup)]
            if len(rows) < 100:
                raise ValueError(f"{symbol}: rows={len(rows)} too few")
            return rows
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 + attempt * 3)
    raise RuntimeError(f"{symbol}: {last}")


def fetch_macro(since):
    out = {}
    for sid, name, unit in MACRO:
        try:
            url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"
            with urllib.request.urlopen(urllib.request.Request(url, headers=FRED_UA), timeout=40) as r:
                text = r.read().decode("utf-8")
            rows = []
            for line in text.splitlines()[1:]:
                d, v = line.split(",")[:2]
                if d >= since.isoformat() and v not in ("", "."):
                    rows.append([d, float(v)])
            if len(rows) > 50:
                out[sid] = {"name": name, "unit": unit, "source": f"https://fred.stlouisfed.org/series/{sid}", "rows": rows}
        except Exception as e:  # noqa: BLE001
            print(f"MACRO FAIL {sid}: {e}", file=sys.stderr)
    if out:
        as_of = max(v["rows"][-1][0] for v in out.values())
        bundle = {"asOf": as_of, "retrieved": dt.date.today().isoformat(), "provider": "FRED (Federal Reserve Bank of St. Louis)", "series": out}
        MACRO_OUT.write_text("const MACRO_HISTORY = " + json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
        print("macro asOf " + as_of + ": " + ", ".join(out) + " -> " + str(MACRO_OUT))
    elif not MACRO_OUT.exists():
        MACRO_OUT.write_text('const MACRO_HISTORY = {"asOf":null,"series":{}};\n', encoding="utf-8")
        print("macro: all failed, wrote empty macro.js", file=sys.stderr)


def load_existing():
    if not OUT.exists():
        return {}
    text = OUT.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(1)).get("symbols", {})
    except Exception:  # noqa: BLE001
        return {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default="2016-01-01")
    args = ap.parse_args()
    since = dt.date.fromisoformat(args.since)
    tickers = json.loads(TICKERS.read_text(encoding="utf-8"))
    existing = load_existing()
    symbols, failed = {}, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futs = {pool.submit(fetch, t["symbol"], since): t for t in tickers}
        for f in concurrent.futures.as_completed(futs):
            t = futs[f]
            try:
                rows = f.result()
                symbols[t["symbol"]] = {"name": t["name"], "source": f"https://finance.yahoo.com/quote/{t['symbol']}/history/", "rows": rows}
            except Exception as e:  # noqa: BLE001
                failed.append(t["symbol"])
                print(f"FAIL {e}", file=sys.stderr)
                old = existing.get(t["symbol"])
                if old and len(old.get("rows", [])) and len(old["rows"][0]) == len(FIELDS):
                    symbols[t["symbol"]] = old
                    print(f"KEEP previous data for {t['symbol']}", file=sys.stderr)
    if not symbols or len(failed) == len(tickers):
        print("all symbols failed; history.js untouched", file=sys.stderr)
        return 1
    fetch_macro(dt.date(max(since.year, dt.date.today().year - 6), 1, 1))
    ordered = {t["symbol"]: symbols[t["symbol"]] for t in tickers if t["symbol"] in symbols}
    as_of = max(v["rows"][-1][0] for v in ordered.values())
    bundle = {"asOf": as_of, "retrieved": dt.date.today().isoformat(), "provider": "Yahoo Finance",
              "priceType": "Daily OHLC, volume, and dividend/split-adjusted close", "fields": FIELDS, "symbols": ordered}
    OUT.write_text("const MARKET_HISTORY = " + json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    for k, v in ordered.items():
        print(f"{k:6} {v['rows'][0][0]} ~ {v['rows'][-1][0]}  {len(v['rows'])} rows" + ("  (kept old)" if k in failed else ""))
    print(f"asOf {as_of} -> {OUT} ({OUT.stat().st_size//1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
