@echo off
echo ================================
echo CONFIRM BOOKING 62
echo ================================
echo.
echo Confirming booking 62...
echo.

curl -X POST http://localhost:8080/api/payment/admin/confirm/62

echo.
echo.
echo ================================
echo DONE! Booking 62 confirmed
echo ================================
echo.
echo Check trong app MyTickets de xem ve!
echo.
pause
