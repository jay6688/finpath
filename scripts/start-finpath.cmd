@echo off
setlocal

rem This wrapper lets a Windows user double-click the file or run it from CMD.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-finpath.ps1" %*
set "FINPATH_EXIT_CODE=%errorlevel%"
if not "%FINPATH_EXIT_CODE%"=="0" (
    echo.
    echo Press any key to close this window.
    pause >nul
)
exit /b %FINPATH_EXIT_CODE%
