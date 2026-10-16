@echo off
chcp 65001 >nul
rem LONGVIEW 로컬 미리보기 · 이 파일이 있는 폴더 기준으로 dist/ 를 127.0.0.1:5173 에 띄웁니다.
rem 필요한 것: Python 3 (https://www.python.org/downloads/ · 설치 때 "Add python.exe to PATH" 체크)
cd /d "%~dp0"
where python >nul 2>nul || (echo Python 3 가 필요합니다. python.org 에서 설치한 뒤 다시 실행하세요. & pause & exit /b 1)
echo LONGVIEW 미리보기: http://127.0.0.1:5173/  (끝내려면 이 창에서 Ctrl+C)
start "" http://127.0.0.1:5173/
python -m http.server 5173 --bind 127.0.0.1 --directory dist
