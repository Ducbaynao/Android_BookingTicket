@echo off
echo ========================================
echo FIXING AND RUNNING BACKEND
echo ========================================

echo.
echo [1/3] Cleaning build...
call mvn clean

echo.
echo [2/3] Compiling with Lombok...
call mvn compile -DskipTests

echo.
echo [3/3] Running Spring Boot...
call mvn spring-boot:run

pause
