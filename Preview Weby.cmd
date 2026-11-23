@echo off
cd /d "%~dp0"
python preview_local.py
if errorlevel 1 (
  echo Local preview needs Python 3 installed and available as python.
  pause
)
