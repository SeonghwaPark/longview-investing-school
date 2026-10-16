// 지표 계산 모듈 · 입력은 history.js의 rows([date, open, high, low, close, adjClose, volume])
// 모든 함수는 순수 계산이며 화면을 건드리지 않습니다. 값이 아직 정의되지 않는 구간은 null입니다.
const IND = (() => {
  const F = { date: 0, open: 1, high: 2, low: 3, close: 4, adj: 5, vol: 6 };
  const col = (rows, k) => rows.map(r => r[F[k]]);
  function sma(a, n) { const out = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) out[i] = s / n; } return out; }
  function ema(a, n) { const out = new Array(a.length).fill(null); const k = 2 / (n + 1); let prev = null, seed = 0; for (let i = 0; i < a.length; i++) { if (i < n - 1) { seed += a[i]; continue; } if (i === n - 1) { seed += a[i]; prev = seed / n; } else prev = a[i] * k + prev * (1 - k); out[i] = prev; } return out; }
  // Wilder 평활 RSI
  function rsi(a, n = 14) { const out = new Array(a.length).fill(null); let g = 0, l = 0; for (let i = 1; i < a.length; i++) { const d = a[i] - a[i - 1]; const up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= n) { g += up; l += dn; if (i === n) { g /= n; l /= n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } return out; }
  function macd(a, fast = 12, slow = 26, sig = 9) { const ef = ema(a, fast), es = ema(a, slow); const line = a.map((_, i) => ef[i] == null || es[i] == null ? null : ef[i] - es[i]); const first = line.findIndex(v => v != null); const valid = line.slice(first); const sg = ema(valid, sig); const signal = new Array(a.length).fill(null); sg.forEach((v, i) => { signal[first + i] = v; }); const hist = line.map((v, i) => v == null || signal[i] == null ? null : v - signal[i]); return { line, signal, hist }; }
  function stdev(a, n) { const out = new Array(a.length).fill(null); for (let i = n - 1; i < a.length; i++) { const w = a.slice(i - n + 1, i + 1); const m = w.reduce((x, y) => x + y, 0) / n; out[i] = Math.sqrt(w.reduce((x, y) => x + (y - m) ** 2, 0) / n); } return out; }
  function bollinger(a, n = 20, k = 2) { const mid = sma(a, n), sd = stdev(a, n); return { mid, upper: mid.map((m, i) => m == null ? null : m + k * sd[i]), lower: mid.map((m, i) => m == null ? null : m - k * sd[i]) }; }
  function atr(rows, n = 14) { const tr = rows.map((r, i) => i === 0 ? r[F.high] - r[F.low] : Math.max(r[F.high] - r[F.low], Math.abs(r[F.high] - rows[i - 1][F.close]), Math.abs(r[F.low] - rows[i - 1][F.close]))); const out = new Array(rows.length).fill(null); let prev = null; for (let i = 0; i < tr.length; i++) { if (i < n - 1) continue; if (i === n - 1) prev = tr.slice(0, n).reduce((x, y) => x + y, 0) / n; else prev = (prev * (n - 1) + tr[i]) / n; out[i] = prev; } return out; }
  // 주봉·월봉 집계 · 날짜는 그 기간의 마지막 거래일, 조정종가·종가는 마지막 값, 거래량은 합계
  function aggregate(rows, unit) { if (unit === 'D') return rows; const key = d => unit === 'M' ? d.slice(0, 7) : isoWeek(d); const out = []; let cur = null, k = null; for (const r of rows) { const kk = key(r[F.date]); if (kk !== k) { if (cur) out.push(cur); cur = r.slice(); k = kk; } else { cur[F.date] = r[F.date]; cur[F.high] = Math.max(cur[F.high], r[F.high]); cur[F.low] = Math.min(cur[F.low], r[F.low]); cur[F.close] = r[F.close]; cur[F.adj] = r[F.adj]; cur[F.vol] += r[F.vol]; } } if (cur) out.push(cur); return out; }
  function isoWeek(d) { const t = new Date(d + 'T00:00:00Z'); const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day + 3); const y = t.getUTCFullYear(); const jan4 = new Date(Date.UTC(y, 0, 4)); const w = 1 + Math.round(((t - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7); return `${y}-W${String(w).padStart(2, '0')}`; }
  function maxDrawdown(a) { let peak = -Infinity, dd = 0; for (const v of a) { peak = Math.max(peak, v); dd = Math.max(dd, (peak - v) / peak); } return dd; }
  function cagr(p0, p1, years) { return years > 0 && p0 > 0 ? (p1 / p0) ** (1 / years) - 1 : null; }
  function idxOnOrBefore(rows, date) { let lo = 0, hi = rows.length - 1, ans = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (rows[m][F.date] <= date) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; }
  function shiftDate(date, { days = 0, months = 0, years = 0 }) { const t = new Date(date + 'T00:00:00Z'); t.setUTCFullYear(t.getUTCFullYear() + years, t.getUTCMonth() + months, t.getUTCDate() + days); return t.toISOString().slice(0, 10); }
  // 종목 하나의 '지금 어디쯤' 요약 · 모두 조정종가 기준(배당 포함 총수익에 가까움)
  function snapshot(rows, benchRows) {
    const n = rows.length; if (n < 30) return null;
    const adj = col(rows, 'adj'), last = rows[n - 1], date = last[F.date], price = last[F.close], a = adj[n - 1];
    const ma = k => { if (n < k) return null; let s = 0; for (let i = n - k; i < n; i++) s += adj[i]; return s / k; };
    const m20 = ma(20), m50 = ma(50), m200 = ma(200);
    const slope200 = n >= 220 ? (m200 - adj.slice(n - 220, n - 20).reduce((x, y) => x + y, 0) / 200) / m200 : null; // 20거래일 전 200일선 대비 기울기
    const yearAgoIdx = Math.max(0, idxOnOrBefore(rows, shiftDate(date, { years: -1 })));
    const hi52 = Math.max(...adj.slice(yearAgoIdx)), lo52 = Math.min(...adj.slice(yearAgoIdx));
    const r = rsi(adj.slice(-200), 14).at(-1);
    const at = atr(rows.slice(-60), 14).at(-1);
    const ret = (back) => { const i = idxOnOrBefore(rows, shiftDate(date, back)); return i >= 0 && i < n - 1 ? a / adj[i] - 1 : null; };
    const cg = (y) => { const i = idxOnOrBefore(rows, shiftDate(date, { years: -y })); return i >= 0 && rows[i][F.date] <= shiftDate(date, { years: -y, days: 7 }) ? cagr(adj[i], a, y) : null; };
    const bench = (back) => { if (!benchRows) return null; const bi = idxOnOrBefore(benchRows, date); const bj = idxOnOrBefore(benchRows, shiftDate(date, back)); return bi > bj && bj >= 0 ? benchRows[bi][F.adj] / benchRows[bj][F.adj] - 1 : null; };
    const r1y = ret({ years: -1 }), b1y = bench({ years: -1 });
    return { date, price, adj: a, m20, m50, m200, vsM50: m50 ? a / m50 - 1 : null, vsM200: m200 ? a / m200 - 1 : null, slope200, hi52, lo52, fromHigh: a / hi52 - 1, fromLow: a / lo52 - 1, rsi: r, atrPct: at ? at / price : null, r1w: ret({ days: -7 }), r1m: ret({ months: -1 }), r3m: ret({ months: -3 }), r1y, cagr3: cg(3), cagr5: cg(5), rel1y: r1y != null && b1y != null ? r1y - b1y : null, mdd1y: maxDrawdown(adj.slice(yearAgoIdx)) };
  }
  return { F, col, sma, ema, rsi, macd, bollinger, atr, aggregate, maxDrawdown, cagr, idxOnOrBefore, shiftDate, snapshot };
})();
