@echo off
echo ================================
echo TEST VNPAY CALLBACK SETUP
echo ================================
echo.
echo Testing ngrok connection...
echo.

curl https://reminiscent-madie-unequable.ngrok-free.dev/api/payment/status?bookingId=1

echo.
echo.
echo ================================
echo If you see JSON response above, ngrok is working!
echo If you see HTML error, check:
echo   1. Backend is running
echo   2. Ngrok is pointing to port 8080
echo ================================
pause
