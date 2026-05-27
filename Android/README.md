# API Test Guide

Tai lieu nay huong dan test cac API hien co trong project.

## 1) API hien co

Hien tai project co 2 endpoint trong `AuthController`:

- `POST /api/auth/register`
- `GET /api/auth/login`

Base URL mac dinh:

- `http://localhost:8080`

## 2) Chuan bi truoc khi test

1. Dam bao MySQL dang chay va tao DB `movie_booking_db`.
2. Kiem tra thong tin ket noi trong `src/main/resources/application.yaml`:
   - datasource url/user/password
   - JWT secret
   - server port (mac dinh `8080`)
3. Chay ung dung:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## 3) Test API dang ky

### Endpoint

- Method: `POST`
- URL: `http://localhost:8080/api/auth/register`
- Header: `Content-Type: application/json`

### Request body mau

```json
{
  "fullName": "Nguyen Van A",
  "email": "vana@example.com",
  "password": "12345",
  "phoneNumber": "0901234567"
}
```

### curl

```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "email": "vana@example.com",
    "password": "12345",
    "phoneNumber": "0901234567"
  }'
```

### Ket qua mong doi

- Dang ky thanh cong:

```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "accessToken": "<jwt_token>"
}
```

- Neu email da ton tai: throw `RuntimeException` va global handler tra ve HTTP `500` voi body text.

## 4) Test API dang nhap

### Endpoint

- Method: `GET`
- URL: `http://localhost:8080/api/auth/login`
- Header: `Content-Type: application/json`
- Body: JSON (luu y: day la GET co body theo code hien tai)

### Request body mau

```json
{
  "email": "vana@example.com",
  "password": "12345"
}
```

### curl

```bash
curl -X GET "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vana@example.com",
    "password": "12345"
  }'
```

### Ket qua mong doi

- Dang nhap thanh cong:

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "accessToken": "<jwt_token>"
}
```

- Sai mat khau:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "accessToken": null
}
```

Luu y: truong hop sai mat khau hien dang tra ve body co `statusCode = 401` nhung HTTP status thuc te van la `200` vi controller tra object truc tiep.

- Neu email khong ton tai: throw `RuntimeException` va global handler tra HTTP `500` voi body text `User not found`.

## 5) Validation can test

### Register

- `fullName` toi thieu 4 ky tu.
- `email` dung dinh dang email va khong duoc de trong.
- `password` toi thieu 5 ky tu.
- `phoneNumber` dung theo custom annotation `@PhoneNumber`.

### Login

- `email` dung dinh dang email va khong de trong.
- `password` toi thieu 5 ky tu.

Khi validation fail, Spring se tra ve loi `400 Bad Request`.

## 6) Test bang Postman (goi y)

1. Tao Collection: `Android Auth API`.
2. Tao bien `baseUrl = http://localhost:8080`.
3. Request 1: `POST {{baseUrl}}/api/auth/register` voi body JSON mau.
4. Request 2: `GET {{baseUrl}}/api/auth/login` voi body JSON dang nhap.
5. Copy `accessToken` de su dung cho cac API protected trong tuong lai.

## 7) Ghi chu

- Theo `SecurityConfig`, tat ca route `/api/auth/**` la public (`permitAll`).
- Cac route khac (neu them moi) se yeu cau JWT Bearer token.


Booking Main Flow (Reserve-then-pay + Async Post-payment)

Tai lieu nay mo ta luong booking chinh cho app dat ve xem phim.

## 1) Muc tieu

- Dat cho theo mo hinh reserve-then-pay: giu ghe tam truoc, thanh toan sau.
- Neu thanh toan thanh cong: xac nhan booking, chot ghe BOOKED.
- Neu thanh toan that bai: rollback booking va tra ghe ve AVAILABLE.
- RabbitMQ chi dung cho hau xu ly sau thanh toan thanh cong, khong chan response cua user.

## 2) Cac endpoint lien quan

Base path booking/payment:

- `POST /api/bookings`
  - Tao booking o trang thai `PENDING_PAYMENT`.
  - Lock ghe tam voi trang thai `HELD`.
  - Tra ve `bookingId`, `totalAmount`, `paymentEndpoint`.

- `GET /api/payment/pay?bookingId=...`
  - Tao payment URL VNPAY dua tren `booking.totalAmount`.
  - Tao/cap nhat payment o trang thai `INIT`.

- `GET /api/payment/vnpReturn`
  - Nhan callback tu VNPAY.
  - Xu ly idempotency theo `vnp_TxnRef` (bookingId).
  - Thanh cong: booking `CONFIRMED`, seat `BOOKED`, payment `SUCCESS`, publish RabbitMQ event.
  - That bai: booking `FAILED`, seat `AVAILABLE`, payment `FAILED`.

## 8) Movie Recommendation Flow (hien tai)

Chuc nang recommend hien tai uu tien theo du lieu hanh vi user va fallback theo thu tu:

1. `INTERACTION_BASED` (neu co du lieu trong `user_movie_interactions`)
2. `CONTENT_BASED_HISTORY` (neu khong co interactions nhung co `watch_history`)
3. `GENRE_FALLBACK` (neu khong co interactions/history)

### 8.1 Nguon du lieu

- `user_movie_interactions`:
  - `MOVIE_SELECTED`, score = 2 (khi user mo chi tiet phim qua `POST /api/movies/select`)
  - `BOOKING_CONFIRMED`, score = 5 (khi booking thanh toan thanh cong)
- `watch_history`
- `user_genre_preferences`
- `movie_genres`
- `movies`
- `movie_recommendations` (cache snapshot async, khong phai nguon tinh truc tiep cho API sync)

### 8.2 Cong thuc tinh score

#### A) Interaction-Based (`INTERACTION_BASED`)

Voi moi genre `g`:

`weight(g) = sum(score_interaction(m))` voi moi phim tuong tac `m` co chua genre `g`.

Voi phim ung vien `c`:

`score(c) = sum(weight(g))` voi moi genre `g` cua phim `c`.

Loai bo cac phim da co trong tap phim user da tuong tac.

#### B) Content-Based tu Watch History (`CONTENT_BASED_HISTORY`)

Voi moi genre `g`:

`weight(g) = so lan g xuat hien trong cac phim da co trong watch_history`.

Voi phim ung vien `c`:

`score(c) = sum(weight(g))` voi moi genre `g` cua phim `c`.

Loai bo cac phim da xuat hien trong `watch_history`.

#### C) Genre Fallback (`GENRE_FALLBACK`)

`score(c) = so genre cua phim c trung voi user_genre_preferences`.

Moi genre trung tinh +1 diem.

### 8.3 Luong API sync cho client

1. App goi `GET /api/recommendations/genres` de lay danh sach genre.
2. App goi `POST /api/recommendations/select/genres` de luu preference.
3. Khi user mo chi tiet phim, app goi `POST /api/movies/select`:
   - luu `watch_history` (neu chua ton tai),
   - luu interaction `MOVIE_SELECTED`.
4. Khi booking thanh cong:
   - luu interaction `BOOKING_CONFIRMED`.
5. App goi `GET /api/recommendations/movies?limit=...`:
   - backend tu dong chon strategy theo thu tu uu tien o tren,
   - tra ve `movieId`, `title`, `posterUrl`, `status`, `score`, `strategy`.

### 8.4 Luong async qua RabbitMQ

- Producer gui event recommend khi:
  - user chon genre (`GENRES_SELECTED`)
  - user chon phim (`MOVIE_SELECTED`)
- Consumer (`RecommendationConsumer`) nhan event:
  - goi `processRecommendationEvent(userId, limit)`,
  - xoa recommendation cache cu cua user trong `movie_recommendations`,
  - luu snapshot recommendation moi.
