# LONGVIEW · 장기투자 스쿨

미국주식 장기투자를 위한 개인 학습 웹앱. 수업·퀴즈, 실제 종목 차트, 판단 도구와 일지, 과거 시점 훈련·백테스트, 공식 자료 안내를 한국어로 제공합니다.

**앱 열기 → https://seonghwapark.github.io/longview-investing-school/**

자세한 안내(화면 설명, 기록 백업, 자료 갱신 방식, 폴더 구성, 판 이력)는 **[읽어보세요.md](읽어보세요.md)** 에 있습니다.

- 빌드 도구 없는 HTML/CSS/JS. `dist/`가 그대로 GitHub Pages에 배포됩니다.
- 가격(Yahoo Finance)·금리(FRED) 자료는 GitHub Actions가 매주 토요일 갱신해 커밋합니다. 수동 갱신: Actions → `pages` → Run workflow.
- 진도·노트·일지는 브라우저에만 저장됩니다. 대시보드에서 백업 파일로 내려받으세요.

```bash
# 로컬 미리보기
python -m http.server 5173 --bind 127.0.0.1 --directory dist
# 자료 갱신
python scripts/fetch_history.py
# 검증
node scripts/verify-training.cjs && node scripts/verify-cases.cjs && node scripts/verify-reading.cjs
```

투자 학습용 콘텐츠이며 수익을 보장하거나 특정 종목의 매매를 권유하지 않습니다.
