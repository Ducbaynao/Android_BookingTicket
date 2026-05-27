@echo off
echo ================================
echo MANUALLY CONFIRM BOOKING
echo ================================
echo.

set /p BOOKING_ID="Enter Booking ID (default: 58): "
if "%BOOKING_ID%"=="" set BOOKING_ID=58

echo.
echo Confirming booking %BOOKING_ID%...
echo.

curl -X POST http://localhost:8080/api/payment/admin/confirm/%BOOKING_ID%

echo.
echo.
echo ================================
echo DONE! Check booking status in DB
echo ================================
pause
