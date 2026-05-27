## Plan: Frontend React Native 1 Tuần

Xây dựng app mobile React Native dạng bare cho iOS và Android, bám sát bộ màn Figma trong workspace làm chuẩn UI/UX, tích hợp backend Spring Boot theo lộ trình auth -> movie/showtime -> booking/payment -> account/tickets -> search. Phạm vi tuần 1 bao gồm cả user app và cụm màn admin mobile theo thiết kế Figma, với mục tiêu có luồng end-to-end chạy được trong 7 ngày.

**Steps**
1. Phase 1 (Ngày 1): Audit toàn bộ màn Figma, trích xuất design system đầy đủ (token màu, typography, spacing, radius, elevation, motion, component variants), khởi tạo dự án bare React Native, cài thư viện lõi, dựng điều hướng user + admin skeleton, cấu hình base URL môi trường, chạy thử Android emulator và iOS simulator.
2. Phase 2 (Ngày 1-2, depends on 1): Tích hợp register/login, tạo auth state bằng Redux Toolkit, lưu JWT vào AsyncStorage, bootstrap phiên đăng nhập khi app mở lại, thêm Axios interceptor gắn Bearer token.
3. Phase 3 (Ngày 2-3, depends on 1, parallel with late step 2): Tích hợp danh sách phim và chi tiết phim, tạo movies state, dựng Home + Movie Details + component dùng lại (MovieCard, carousel, genre filter).
4. Phase 4 (Ngày 3-4, depends on 3): Tích hợp suất chiếu theo movieId/date và danh sách ghế, tạo booking state cho showtime/seat selection, dựng Showtimes Selection + Seat Selection với tính tiền realtime.
5. Phase 5 (Ngày 4-5, depends on 4): Tích hợp tạo booking, dựng confirmation/payment flow, dùng payment mock nếu API thật chưa sẵn sàng, hoàn tất màn thành công.
6. Phase 6 (Ngày 5, depends on 2, parallel with 5): Tích hợp profile và danh sách vé của tôi, hoàn thiện logout và refresh dữ liệu.
7. Phase 7 (Ngày 6-7, depends on 3): Hoàn thiện tìm kiếm phim, loading/error/retry states, tối ưu hiệu năng UI, test trên máy thật, build APK và IPA.
8. Cutline triển khai: Chỉ đi tiếp phase sau khi phase trước đạt tiêu chí xác minh tối thiểu.


**Day 1 Checklist (Thực thi chi tiết)**
1. Chuẩn bị môi trường phát triển
- Cài Node LTS, JDK 17+, Android Studio, Android SDK, Xcode (nếu có macOS), CocoaPods.
- Kiểm tra công cụ: node -v, npm -v, java -version, adb --version.
- Thiết lập biến môi trường Android (ANDROID_HOME, platform-tools) để react-native CLI nhận emulator.
2. Khởi tạo dự án bare React Native
- Tạo thư mục mobile riêng cùng cấp backend để tách vòng đời build.
- Khởi tạo app mới bằng React Native CLI.
- Chạy app mẫu lần đầu trên Android; nếu có macOS thì chạy thêm iOS để xác nhận native toolchain ổn.
3. Cài thư viện lõi của kiến trúc app
- Navigation: @react-navigation/native, native-stack, bottom-tabs.
- State: @reduxjs/toolkit, react-redux.
- Networking: axios.
- Lưu phiên: @react-native-async-storage/async-storage.
- Native dependencies: react-native-screens, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated.
- iOS: pod install sau khi cài package.
4. Audit Figma và thiết kế cấu trúc thư mục nền
- Rà toàn bộ ảnh trong thư mục figma để chốt map màn hình và luồng điều hướng user/admin.
- Trích xuất design tokens: color palette, typography scale, spacing scale, border radius, elevation, motion duration/easing.
- Tạo các nhóm: app/navigation, app/screens/user, app/screens/admin, app/store, app/services, app/components, app/theme, app/utils.
- Tạo skeleton screen cho user: Login, SignUp, ForgotPassword, Home, Search, Booking, MyTickets, Account.
- Tạo skeleton screen cho admin: AdminOverviewDashboard, ManageMoviesList, ManageUsersList.
5. Dựng điều hướng gốc
- Tạo AuthStack: Login, SignUp, ForgotPassword.
- Tạo UserTabNavigator: Home, Search, Booking, MyTickets, Account.
- Tạo AdminStack: AdminOverviewDashboard, ManageMoviesList, ManageUsersList.
- Tạo RootNavigator chuyển giữa AuthStack và app flow theo trạng thái đăng nhập và role giả lập (USER/ADMIN).
6. Cấu hình API base URL cho mobile
- Tạo lớp config môi trường cho API_URL theo dev/staging/prod.
- Với dev, dùng IP LAN máy chạy backend (ví dụ 192.168.x.x:8080), không dùng localhost khi test trên máy thật.
- Kiểm tra backend có thể truy cập từ emulator/simulator qua endpoint health hoặc auth đơn giản.
7. Chạy smoke test cuối ngày
- Android emulator mở app thành công, chuyển màn trong AuthStack và App tabs không crash.
- iOS simulator (nếu có): mở app và điều hướng tương tự không crash.
- Build debug chạy ổn định ít nhất 2 lần liên tiếp để xác nhận cache/toolchain không lỗi ngẫu nhiên.
8. Tiêu chí Done Ngày 1
- App bare React Native chạy được trên Android và iOS (nếu có macOS).
- Root navigation đi qua được cả flow user và admin ở mức skeleton.
- Design tokens cơ bản + nâng cao đã được định nghĩa trong theme để tái sử dụng.
- API_URL dev đã cấu hình theo IP LAN, sẵn sàng cho Phase 2 tích hợp auth.
- Không còn lỗi đỏ runtime khi chuyển stack/tab.

**Relevant files**
- frontend mobile app (chưa tạo trong workspace hiện tại) — sẽ chứa toàn bộ mã React Native.
- src/main/java/com/example/Android/user/controller/AuthController.java — contract auth để frontend gọi register/login.
- src/main/java/com/example/Android/user/controller/UserController.java — endpoint profile dùng cho tab Account.
- src/main/java/com/example/Android/catalog/controller/CatalogController.java — endpoint danh sách và chi tiết phim.
- src/main/java/com/example/Android/showtime/controller/ShowtimeController.java — endpoint suất chiếu và ghế.
- src/main/java/com/example/Android/booking/controller/BookingController.java — endpoint tạo booking và danh sách booking.

**Verification**
1. Phase 1: app chạy được Android + iOS, chuyển stack/tab không crash.
2. Phase 2: register/login thành công, token giữ được sau relaunch, request authenticated có header Bearer đúng.
3. Phase 3: Home tải dữ liệu đúng, filter genre hoạt động, chi tiết phim đầy đủ.
4. Phase 4: đổi ngày lọc đúng suất chiếu, chọn ghế hợp lệ, ghế đã đặt không chọn được, tổng tiền cập nhật realtime.
5. Phase 5: tạo booking thành công, thanh toán mock đi hết flow đến success.
6. Phase 6: profile đúng user hiện tại, danh sách vé đúng, logout xóa phiên và quay lại login.
7. Phase 7: tìm kiếm chính xác, xử lý timeout/network errors tốt, build phát hành thành công.
8. E2E tổng thể: đăng ký -> đăng nhập -> chọn phim -> chọn suất -> chọn ghế -> đặt vé -> xem vé.

**Decisions**
- Stack: Bare React Native theo yêu cầu (Android Studio + Xcode).
- State management: Redux Toolkit cho auth/movies/booking.
- Session: JWT lưu AsyncStorage và gắn tự động qua interceptor.
- Payment: hybrid tuần 1 (booking thật + payment giả lập), cắm cổng thật sau.
- Social login: placeholder UI trong tuần 1, chưa tích hợp backend.
- Admin scope: bao gồm cụm màn Admin Dashboard, Manage Movies, Manage Users theo Figma trong tuần 1.
- UI implementation strategy: Figma-first (ưu tiên dựng đúng layout toàn bộ màn chính trước khi nối sâu API).
- Design system: triển khai mức đầy đủ ngay từ Ngày 1 (tokens + component variants + animation rules).
- Base URL dev: dùng IP LAN của máy chạy backend; vẫn tách biến môi trường cho dev/staging/prod.

**Further Considerations**
1. Base URL mobile nên chốt ngay trước coding: localhost emulator, IP LAN nội bộ, hay domain deploy.
2. Chốt chiến lược payment tuần 1: mock hoàn toàn hay hybrid (booking thật + payment giả lập).
3. Chốt phạm vi tuần 1 cho social login: placeholder UI hay tích hợp thật.
