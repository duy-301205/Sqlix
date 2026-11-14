# SQLix — Danh sách luồng kiểm thử hệ thống

Tài liệu này được tổng hợp bằng cách đối chiếu route/service frontend với controller/service backend. Dùng mỗi mục như một task kiểm thử độc lập; đánh dấu kết quả, môi trường/dữ liệu test và lỗi phát hiện được. Với API-only hoặc chỗ UI chưa nối backend, kiểm thử qua API và ghi rõ trạng thái đó.

## Hướng dẫn chung cho agent kiểm thử

- Với mọi API cần đăng nhập, kiểm tra cả: chưa đăng nhập (401), tài khoản USER, tài khoản ADMIN và dữ liệu thuộc về user khác (không được đọc/sửa/xóa trái quyền).
- Kiểm tra trạng thái tải, dữ liệu rỗng, lỗi API, dữ liệu không hợp lệ, tải lại trang và tính nhất quán sau khi thay đổi.
- Khi kiểm thử thao tác ghi, xác nhận kết quả sau khi tải lại hoặc đọc lại API, không chỉ dựa vào toast/state trên màn hình.
- Luồng frontend nằm ở `app/`; lớp gọi API nằm ở `services/`; backend Spring Boot nằm trong repo `sqlix-be`.

## A. Tài khoản, đăng nhập và phiên

### A1. Trang chủ và điều hướng — `/`

- Kiểm tra trang chủ hiển thị và nút đăng nhập/đăng ký dẫn đúng route.
- Kiểm tra các liên kết điều hướng trong phần giới thiệu; một số liên kết hiện dùng `#`, xác nhận đó có phải hành vi dự kiến.
- Trang chủ là trang tĩnh, không có API nghiệp vụ.

### A2. Đăng ký — `/register`

- Nhập họ tên, username, email, mật khẩu, xác nhận mật khẩu, nghề nghiệp và chấp nhận điều khoản.
- Kiểm tra dữ liệu thiếu/sai, mật khẩu xác nhận không khớp, chưa chấp nhận điều khoản, username/email trùng.
- API: `POST /api/auth/register`.
- Backend tạo role `USER`, tài khoản active và phát OTP xác minh email; client không được tự chọn role.
- Thành công chuyển sang `/login?registered=true`.

### A3. Đăng nhập bằng username/email — `/login`

- Đăng nhập lần lượt bằng username và email.
- Kiểm tra sai mật khẩu, tài khoản không tồn tại, tài khoản bị khóa, email chưa xác minh.
- API: `POST /api/auth/login` (body `identifier`, `password`).
- Thành công phải lưu access/refresh token; ADMIN tới `/admin/dashboard`, user thường tới `/dashboard`.
- Gọi một API được bảo vệ sau đăng nhập để xác nhận token dùng được.

### A4. Gắn access token và tự refresh

- Xác nhận request cần đăng nhập tự gắn `Authorization: Bearer ...`.
- Khi access token hết hạn, frontend gọi refresh, cập nhật token và thử lại request gốc.
- Kiểm tra nhiều request cùng lúc khi refresh đang chạy; refresh token sai/hết hạn; thiếu refresh token phải xóa token và chuyển `/login`.
- API: `POST /api/auth/refresh`.
- Đây là interceptor trong `services/apiClient.ts`, không có trang riêng.

### A5. Đăng xuất — Header/sidebar

- Kiểm tra gọi logout, xóa token ở localStorage và điều hướng khỏi vùng bảo vệ.
- API: `POST /api/auth/logout`; backend nhận refresh token từ body hoặc cookie và thu hồi token.
- Thử dùng refresh token đã logout để refresh lại; phải bị từ chối.

### A6. Đăng xuất mọi thiết bị — API-only

- API: `POST /api/auth/logout-all`.
- Xác nhận mọi refresh token của tài khoản đều bị thu hồi.
- Frontend hiện chưa có luồng gọi API này; ghi nhận API-only.

### A7. Xác minh email và gửi lại OTP — API/service

- API xác minh: `POST /api/auth/verify-email` với `email`, `otp`.
- Thử OTP đúng/sai/hết hạn; user không tồn tại; xác minh lặp; vượt giới hạn lần thử.
- OTP hết hạn sau 5 phút, tối đa 5 lần thử.
- API gửi lại: `POST /api/auth/resend-verification` (yêu cầu đăng nhập); thử cooldown 60 giây.
- FE có service `verifyEmail`, nhưng không thấy trang xác minh hoặc service gửi lại OTP; kiểm thử API trực tiếp và ghi nhận thiếu UI.

### A8. Quên/đặt lại mật khẩu — API/service

- Yêu cầu reset: `POST /api/auth/forgot-password`; email tồn tại và không tồn tại phải có phản hồi không làm lộ tài khoản.
- Đặt mật khẩu: `POST /api/auth/reset-password`; thử token hợp lệ, sai, đã dùng, hết hạn.
- Token reset hết hạn sau 15 phút; đặt lại thành công thu hồi refresh token đang có.
- FE có service nhưng không thấy route `/forgot-password` hoặc trang đặt lại mật khẩu. Link quên mật khẩu tại `/login` đang dẫn đến `/forgot-password`; kiểm tra route và ghi nhận.

### A9. OAuth — API-only

- API: `POST /api/auth/oauth`; kiểm tra provider/token hợp lệ và các trường hợp tài khoản mới/đã liên kết.
- Không thấy nút hoặc luồng OAuth trên frontend; kiểm thử API riêng.

## B. Hồ sơ, học tập và luyện SQL

### B1. Xem hồ sơ — `/profile`

- Kiểm tra tên, username, email, avatar, nghề nghiệp, bio, streak và mục tiêu học hàng ngày.
- API: `GET /api/users/me`.
- Thử user chưa đăng nhập, dữ liệu hồ sơ thiếu và lỗi tải.

### B2. Cập nhật hồ sơ — `/profile`

- Sửa tên, avatar, bio, nghề nghiệp, mục tiêu phút/ngày; lưu rồi tải lại để xác nhận bền vững.
- Kiểm tra hủy chỉnh sửa và dữ liệu không hợp lệ.
- API: `PUT /api/users/me`.

### B3. Hồ sơ quản trị — `/admin/profile`

- Kiểm tra tải và cập nhật hồ sơ bằng cùng API `GET/PUT /api/users/me`.
- Xác nhận chỉ ADMIN vào được; USER bị chuyển về `/dashboard`.

### B4. Curriculum — `/learning`

- Tải danh mục, thứ tự bài, tiến độ; chọn bài và chuyển bài trước/sau.
- API: `GET /api/learning/curriculum`.
- Thử curriculum rỗng, bài không tồn tại và chọn lesson bằng query `?lesson=...`.

### B5. Chi tiết bài học — `/learning?lesson={slug}`

- Kiểm tra nội dung/sections, mục lục, markdown, SQL mẫu, ghi chú và điều hướng trước/sau.
- API: `GET /api/learning/lessons/{slug}`.
- Thử slug sai và nội dung dài/có code block.

### B6. Sao chép SQL mẫu — `/learning`

- Kiểm tra copy thành công và trạng thái hiển thị; thử khi clipboard không khả dụng.
- Thao tác frontend, không thấy API riêng.

### B7. Bookmark bài học — `/learning`

- Bật/tắt bookmark; tải lại để xác nhận trạng thái đồng bộ theo user.
- API: `POST /api/learning/lessons/{lessonId}/bookmark`.

### B8. Hoàn thành bài học — `/learning`

- Đánh dấu hoàn thành; xác nhận tiến độ trên curriculum/dashboard được cập nhật.
- API: `POST /api/learning/lessons/{lessonId}/complete`.

### B9. Danh sách database luyện tập — `/practice`

- Tải danh sách, tìm kiếm, lọc độ khó, sắp xếp, mở database.
- API: `GET /api/practice/databases`.
- Thử danh sách rỗng và dữ liệu không khớp bộ lọc.

### B10. Chi tiết database — `/practice/{id}`

- Kiểm tra các tab câu hỏi/tổng quan/ERD; tìm và lọc exercise; trạng thái đã vượt qua.
- API: `GET /api/practice/databases/{slug}`.
- Thử slug sai, database không có bài, ERD/schema rỗng hoặc lỗi định dạng.

### B11. Workspace bài tập — `/practice/{id}/solve/{exerciseId}`

- Tải đề, yêu cầu, schema, database và query đã nộp gần nhất.
- API: `GET /api/practice/exercises/{exerciseId}`.
- Thử exercise không tồn tại và query cũ của user khác không bị lộ.

### B12. Chạy thử query bài tập

- Chạy query hợp lệ; hiển thị cột/dòng kết quả; thử query lỗi, query rỗng và câu lệnh ghi/xóa dữ liệu.
- API: `POST /api/practice/exercises/{exerciseId}/run`.
- Backend có validator chỉ đọc và giới hạn số dòng; xác nhận giới hạn được áp dụng.

### B13. Nộp bài tập SQL

- Nộp query; xác nhận chấm đúng/sai, điểm/feedback, trạng thái tiến độ và hoạt động dashboard.
- API: `POST /api/practice/exercises/{exerciseId}/submit`.
- Thử query lỗi, kết quả sai thứ tự/giá trị, nộp lại và đáp án chuẩn lỗi.

## C. Thi thử và lịch sử

### C1. Danh sách đề — `/mock-tests`

- Tải danh sách/phân trang; tìm kiếm, lọc độ khó/danh mục, sắp xếp.
- API: `GET /api/mock-tests?search=&difficulty=&page=&size=`.
- Backend hỗ trợ search, difficulty, page, size; kiểm tra filter category/sort của UI (có xử lý phía frontend) có nhất quán qua phân trang.
- Chỉ đề đã publish được trả trong catalog; thử không có kết quả.

### C2. Chi tiết đề — `/mock-tests/{slug}`

- Kiểm tra mô tả, thời lượng, số câu và nút bắt đầu.
- API: `GET /api/mock-tests/{slug}`.
- Thử slug sai và đề chưa publish; xác nhận truy cập trực tiếp có tuân theo trạng thái publish.

### C3. Bắt đầu phiên thi

- Bắt đầu từ trang chi tiết, xác nhận tạo session và điều hướng workspace; thời lượng/trạng thái đúng.
- API: `POST /api/mock-tests/{testId}/start`.
- Thử đề không tồn tại và request chưa đăng nhập.

### C4. Workspace thi — `/test-sessions/{sessionId}/workspace`

- Tải câu hỏi; chuyển câu; gắn/bỏ cờ; nhập và lưu đáp án; trạng thái lưu đúng.
- API tải: `GET /api/test-sessions/{sessionId}/workspace`.
- API lưu: `POST /api/test-sessions/{sessionId}/answers/{questionId}`.
- Thử session/câu hỏi không tồn tại, session thuộc user khác và session đã đóng.

### C5. Chạy query trong câu SQL của đề

- Chạy SQL và xem kết quả trong workspace; thử query lỗi/bị chặn/nhiều dòng; chuyển câu khi đang chạy.
- Đối chiếu API run mà frontend gọi với endpoint backend, đặc biệt cách truyền exercise/session/question ID.

### C6. Nộp bài thi thủ công

- Mở xác nhận, nộp bài, xác nhận chấm điểm/lưu session và điều hướng sang kết quả.
- API: `POST /api/test-sessions/{sessionId}/submit`.
- Thử phiên rỗng, nộp lặp và session của user khác.

### C7. Tự nộp khi hết giờ

- Đưa timer về 0; xác nhận tự nộp đúng một lần, session được lưu và điều hướng đúng.
- API: `POST /api/test-sessions/{sessionId}/submit`.
- Kiểm tra timer và thao tác nộp thủ công không gây submit trùng.

### C8. Kết quả — `/test-sessions/{sessionId}/result`

- Lưu ý: trang hiện hiển thị nội dung tĩnh (ví dụ 100%, “Đã nộp”), chưa tải điểm theo session.
- Backend có `GET /api/test-sessions/{sessionId}/result`, nhưng frontend chưa thấy service gọi endpoint này.
- Kiểm thử và ghi nhận chênh lệch; không xem số tĩnh trên UI là kết quả thật.

### C9. Lịch sử thi cá nhân — `/history`

- Kiểm tra thống kê, danh sách, tìm kiếm, lọc trạng thái/độ khó, sắp xếp điểm/ngày và phân trang.
- APIs: `GET /api/mock-tests/history/summary`, `GET /api/mock-tests/history`, `GET /api/mock-tests/history/trends?limit=...`.
- Thử tài khoản chưa có phiên thi và tổ hợp nhiều filter.

### C10. Chi tiết/lời giải lịch sử

- Mở một session cũ; kiểm tra câu hỏi, đáp án user, đáp án đúng, giải thích, điểm và thời gian.
- API: `GET /api/mock-tests/history/{sessionId}`.
- Thử session không tồn tại và session của user khác.

### C11. Xóa lịch sử cá nhân

- Xác nhận dialog, xóa session; kiểm tra danh sách và thống kê sau xóa/tải lại.
- API: `DELETE /api/mock-tests/history/{sessionId}`.
- User không thể xóa session của người khác.

### C12. Route legacy `/mock-test*`

- `/mock-test` có trang chuyển hướng sang `/mock-tests`; xác nhận redirect.
- Các route `/mock-test/{id}` và `/mock-test/history` còn trong frontend; mở trực tiếp để xác định redirect, trang cũ hay UI tĩnh và phân loại test tương ứng.

## D. Dashboard

### D1. Dashboard người học — `/dashboard`

- Kiểm tra số bài học/bài tập, điểm, thời gian học, gợi ý bài tiếp theo, đề gần đây.
- Kiểm tra mastery, biểu đồ hoạt động 30 ngày và hoạt động gần đây.
- APIs: `GET /api/dashboard/overview`, `GET /api/dashboard/mastery`, `GET /api/dashboard/chart/30-days`, `GET /api/dashboard/recent-activities`.
- Thử tài khoản mới không có dữ liệu; xác nhận link tới học tập, luyện tập và thi thử.

## E. Quản trị

### E1. Bảo vệ route `/admin/*`

- Chưa đăng nhập: chuyển `/login`.
- USER thường: chuyển `/dashboard`.
- ADMIN: truy cập được.
- Kiểm tra cả bảo vệ frontend và backend; toàn bộ `/api/admin/**` yêu cầu role ADMIN.

### E2. Dashboard quản trị — `/admin/dashboard`

- Tải số liệu hệ thống, refresh, xử lý lỗi.
- API: `GET /api/admin/dashboard/stats`.
- Thử USER/không token bị từ chối.

### E3. Danh sách/tìm/lọc user — `/admin/users`

- Tìm kiếm, lọc role/trạng thái, phân trang; kiểm tra tổng số và filter kết hợp.
- API: `GET /api/admin/users?search=&role=&active=&page=&size=`.

### E4. Role và trạng thái user — `/admin/users`

- Đổi role; khóa tài khoản rồi thử đăng nhập; mở khóa và xác nhận đăng nhập lại.
- APIs: `PUT /api/admin/users/{userId}/role`, `PUT /api/admin/users/{userId}/status`.
- Thử user ID không tồn tại và request từ non-admin.

### E5. Tạo/sửa/xóa user trong UI — `/admin/users`

- UI có form tạo/sửa/xóa nhưng backend hiện chỉ có API list, đổi role và trạng thái; không thấy API tạo user admin, sửa thông tin cơ bản hoặc xóa user.
- Tạo/xóa đang chỉ đổi state frontend; sửa tên/email cũng chỉ cập nhật state cục bộ. Tải lại trang để xác nhận và ghi nhận là chưa lưu backend.

### E6. Quản lý curriculum — `/admin/learning`

- Tải curriculum; tạo/sửa/xóa danh mục, bài học và section.
- Kiểm tra slug, thứ tự, nội dung markdown, SQL mẫu, note box và liên kết cha/con.
- Đọc dùng `GET /api/learning/curriculum`.
- Ghi dùng `POST/PUT/DELETE /api/admin/learning/categories`, `/lessons`, `/lessons/{lessonId}/sections`, `/sections/{sectionId}`.
- Xác nhận thay đổi xuất hiện ở `/learning`; kiểm tra quyền ADMIN.

### E7. Quản lý database luyện tập — `/admin/practice`

- List/detail/create/update/delete database; kiểm tra slug, độ khó, schema JSON, init SQL, số bảng và dữ liệu lỗi.
- APIs: `GET /api/admin/practice/databases`, `GET /api/admin/practice/databases/{id}`, `POST/PUT/DELETE /api/admin/practice/databases`.
- Kiểm tra dữ liệu xuất hiện ở `/practice`; thử xóa database còn bài tập.

### E8. Quản lý exercise — `/admin/practice`

- List/create/update/delete bài; kiểm tra nội dung, chủ đề, độ khó, cột mong đợi, đáp án chuẩn và điểm.
- APIs: `GET /api/admin/practice/databases/{dbId}/exercises`, `POST /api/admin/practice/databases/{dbId}/exercises`, `PUT/DELETE /api/admin/practice/exercises/{exerciseId}`.
- Xác nhận user mở và nộp được bài mới ở khu vực luyện tập.

### E9. Quản lý đề thi — `/admin/mock-tests`

- List/create/update/delete; kiểm tra tiêu đề, slug, độ khó, thời lượng, passing score, publish.
- APIs: `GET/POST /api/admin/mock-tests`, `PUT/DELETE /api/admin/mock-tests/{id}`.
- Publish/unpublish phải ảnh hưởng catalog học viên `/mock-tests`.
- Một số metadata có thể lưu localStorage; kiểm tra tải lại/trình duyệt khác để biết dữ liệu nào thực sự được backend lưu.

### E10. Quản lý câu hỏi đề — `/admin/mock-tests`

- List/create/update/delete câu trắc nghiệm và SQL; kiểm tra option, đáp án đúng, điểm và nội dung.
- APIs: `GET/POST /api/admin/mock-tests/{testId}/questions`, `PUT/DELETE /api/admin/mock-test-questions/{questionId}`.
- Làm đề phía học viên sau khi chỉnh sửa để xác nhận workspace/chấm điểm dùng dữ liệu mới.

### E11. Lịch sử thi toàn hệ thống — `/admin/history`

- Tải lịch sử; lọc user/đề/ngày/khoảng điểm; phân trang và xóa session.
- APIs: `GET /api/admin/mock-tests/history`, `DELETE /api/admin/test-sessions/{sessionId}`.
- Xác nhận non-admin không truy cập được; filter kết hợp và xóa cập nhật danh sách.

## Các điểm cần kiểm thử/ghi nhận như chênh lệch FE–BE

1. Link `/login` tới `/forgot-password` nhưng không thấy route frontend cho luồng quên/đặt lại mật khẩu.
2. Backend có xác minh/resend email, OAuth và logout-all; frontend chưa có đủ UI/service để đi hết các luồng.
3. Trang kết quả thi đang tĩnh; backend có API lấy kết quả nhưng FE không gọi.
4. Tạo/xóa user trong admin chỉ đổi state cục bộ; backend không có API tương ứng. Sửa một số trường user cũng chưa lưu server.
5. Các route legacy `/mock-test*` cần mở trực tiếp để xác nhận hành vi hiện tại.
6. Bộ lọc danh mục/sắp xếp đề có xử lý phía frontend trong khi API catalog chỉ nhận search, difficulty, page, size; kiểm tra kết quả và phân trang có khớp kỳ vọng.

