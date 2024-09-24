@echo off
:: Nome do programa executável
set programName=app.exe

:: Verifica se o programa já está em execução
tasklist /FI "IMAGENAME eq %programName%" 2>NUL | find /I "%programName%" >NUL

:: Se o programa já estiver em execução, exibe uma mensagem e fecha a nova instância
if not errorlevel 1 (
    echo O programa já está em execução. Fechando a nova instância...
    start chrome "http://127.0.0.1:5000"
    exit /b
)

:: Se o programa não estiver em execução, inicia o programa
start chrome "http://127.0.0.1:5000"
start "" "%programName%"
