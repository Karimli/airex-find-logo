@echo off
rem AIREX Find AIREX Logo — kioskda Google Chrome-u tam ekran (kiosk rejimi) açır.
rem Windows açılanda avtomatik işə düşsün deyə: Win+R -> shell:startup -> bu faylı ora kopyalayın.
rem Chrome öz ayrıca profil qovluğunda işləyir (heç bir Google hesabı lazım deyil):
rem ən yaxşı nəticə brauzer bağlansa, kompüter yenidən başlasa da silinmir.

set "URL=https://karimli.github.io/airex-find-logo/"
set "PROFILE=%LocalAppData%\AirexFindLogo\ChromeProfile"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Google Chrome tapilmadi. Zehmet olmasa Chrome-u qurun.
  pause
  exit /b 1
)

rem Windows açılan kimi şəbəkə hələ hazır olmaya bilər — bir az gözlə
timeout /t 10 /nobreak >nul

start "" "%CHROME%" --user-data-dir="%PROFILE%" --kiosk --no-first-run --no-default-browser-check --disable-pinch --overscroll-history-navigation=0 --disable-session-crashed-bubble --disable-features=Translate "%URL%"
