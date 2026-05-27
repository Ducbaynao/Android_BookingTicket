# HƯỚNG DẪN KHỞI ĐỘNG NGROK CHO VNPAY

## BƯỚC 1: Chạy Ngrok
```bash
# Mở terminal/CMD mới
ngrok http 8080
```

## BƯỚC 2: Copy URL mới
Ngrok sẽ hiển thị URL như:
```
Forwarding   https://abc-xyz-123.ngrok-free.app -> http://localhost:8080
```

Copy URL: `https://abc-xyz-123.ngrok-free.app`

## BƯỚC 3: Update application.yaml
Mở file: `D:\Android\Android\src\main\resources\application.yaml`

Sửa dòng 29-30:
```yaml
VNP_RETURN_URL: https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/payment/vnpReturn
VNP_IPN_URL: https://YOUR-NEW-NGROK-URL.ngrok-free.app/api/payment/vnpIpn
```

Thay `YOUR-NEW-NGROK-URL` bằng URL vừa copy.

## BƯỚC 4: Restart Backend
```bash
cd D:\Android\Android
# Ctrl+C để dừng backend đang chạy
mvn spring-boot:run
```

## BƯỚC 5: Test lại thanh toán
- Chọn ghế → Thanh toán
- Nhập OTP và confirm
- Booking sẽ tự động confirm!

---

## LƯU Ý:
- Mỗi khi restart ngrok, URL sẽ THAY ĐỔI
- Phải update lại application.yaml với URL mới
- Ngrok free chỉ duy trì 2 giờ, sau đó phải restart

## DEBUG:
Check ngrok có hoạt động:
```bash
curl https://YOUR-NGROK-URL.ngrok-free.app/api/payment/status?bookingId=1
```

Nếu trả về JSON → Ngrok OK ✅
Nếu ERR_NGROK_3200 → Ngrok offline ❌
