export interface MockQuestion {
    id: string;
    type: 'multiple_choice' | 'sql_query';
    question: string;
    description?: string;
    points: number;
    options?: { id: string; text: string }[];
    correctOptionId?: string;
    sampleQuery?: string;
    solutionQuery?: string;
    schema?: { tableName: string; columns: string[] }[];
    mockTableResult?: Record<string, any>[];
    explanation: string;
}

export interface MockTestItem {
    id: string;
    title: string;
    category: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Nâng cao';
    difficultyColor: string;
    description: string;
    questionsCount: number;
    durationMinutes: number;
    participantsCount: number;
    icon: 'shopping_cart' | 'school' | 'medical_services' | 'bar_chart' | 'account_balance';
    iconBg: string;
    iconColor: string;
    questions?: MockQuestion[];
}

export const MOCK_TESTS: MockTestItem[] = [
    {
        id: 'mock-1',
        title: 'E-commerce Database - Cơ bản',
        category: 'E-commerce',
        difficulty: 'Dễ',
        difficultyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Kiểm tra kiến thức cơ bản về thiết kế CSDL, câu lệnh SELECT và các phép lọc WHERE đơn giản trong hệ thống bán hàng.',
        questionsCount: 5,
        durationMinutes: 20,
        participantsCount: 1245,
        icon: 'shopping_cart',
        iconBg: 'bg-indigo-50 border-indigo-100',
        iconColor: 'text-indigo-600',
        questions: [
            {
                id: 'q1',
                type: 'multiple_choice',
                points: 20,
                question: 'Mệnh đề nào trong SQL được sử dụng để lọc các bản ghi theo điều kiện cụ thể?',
                options: [
                    { id: 'A', text: 'GROUP BY' },
                    { id: 'B', text: 'WHERE' },
                    { id: 'C', text: 'ORDER BY' },
                    { id: 'D', text: 'HAVING' },
                ],
                correctOptionId: 'B',
                explanation: 'Mệnh đề WHERE được dùng để lọc dữ liệu ở mức từng dòng (row level) trước khi thực hiện nhóm hoặc sắp xếp.',
            },
            {
                id: 'q2',
                type: 'sql_query',
                points: 20,
                question: 'Lấy danh sách tất cả khách hàng (tên, email) sống tại thành phố "Hà Nội" và đã kích hoạt tài khoản (status = "active").',
                description: 'Bảng customers gồm các cột: customer_id, full_name, email, city, status, created_at.',
                sampleQuery: 'SELECT full_name, email\nFROM customers\nWHERE city = \'Hà Nội\' AND status = \'active\';',
                solutionQuery: 'SELECT full_name, email FROM customers WHERE city = \'Hà Nội\' AND status = \'active\';',
                schema: [
                    {
                        tableName: 'customers',
                        columns: ['customer_id (INT, PK)', 'full_name (VARCHAR)', 'email (VARCHAR)', 'city (VARCHAR)', 'status (VARCHAR)'],
                    },
                ],
                mockTableResult: [
                    { full_name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', city: 'Hà Nội', status: 'active' },
                    { full_name: 'Trần Thị Bích', email: 'bich.tran@example.com', city: 'Hà Nội', status: 'active' },
                    { full_name: 'Phạm Minh Tuấn', email: 'tuan.pm@example.com', city: 'Hà Nội', status: 'active' },
                ],
                explanation: 'Sử dụng SELECT full_name, email FROM customers WHERE city = \'Hà Nội\' AND status = \'active\'.',
            },
            {
                id: 'q3',
                type: 'multiple_choice',
                points: 20,
                question: 'Từ khóa nào được sử dụng để loại bỏ các giá trị trùng lặp trong tập kết quả trả về của câu lệnh SELECT?',
                options: [
                    { id: 'A', text: 'UNIQUE' },
                    { id: 'B', text: 'DISTINCT' },
                    { id: 'C', text: 'GROUP BY' },
                    { id: 'D', text: 'DIFFERENT' },
                ],
                correctOptionId: 'B',
                explanation: 'Từ khóa DISTINCT loại bỏ các bản ghi trùng lặp trên các cột được chọn trong SELECT.',
            },
            {
                id: 'q4',
                type: 'sql_query',
                points: 20,
                question: 'Tìm tất cả các sản phẩm có giá (price) từ 100,000 đến 500,000 VNĐ và sắp xếp giảm dần theo giá.',
                description: 'Bảng products gồm các cột: product_id, product_name, price, stock_quantity, category_id.',
                sampleQuery: 'SELECT product_id, product_name, price\nFROM products\nWHERE price BETWEEN 100000 AND 500000\nORDER BY price DESC;',
                solutionQuery: 'SELECT product_id, product_name, price FROM products WHERE price BETWEEN 100000 AND 500000 ORDER BY price DESC;',
                schema: [
                    {
                        tableName: 'products',
                        columns: ['product_id (INT, PK)', 'product_name (VARCHAR)', 'price (DECIMAL)', 'stock_quantity (INT)'],
                    },
                ],
                mockTableResult: [
                    { product_id: 104, product_name: 'Bàn phím cơ DareU', price: 499000, stock_quantity: 45 },
                    { product_id: 102, product_name: 'Chuột Gaming Logitech', price: 350000, stock_quantity: 120 },
                    { product_id: 108, product_name: 'Tai nghe chụp tai Sony', price: 150000, stock_quantity: 80 },
                ],
                explanation: 'Sử dụng toán tử BETWEEN ... AND ... kết hợp ORDER BY price DESC.',
            },
            {
                id: 'q5',
                type: 'multiple_choice',
                points: 20,
                question: 'Kết quả của biểu thức "NULL = NULL" trong SQL trả về giá trị gì?',
                options: [
                    { id: 'A', text: 'TRUE' },
                    { id: 'B', text: 'FALSE' },
                    { id: 'C', text: 'UNKNOWN / NULL' },
                    { id: 'D', text: 'ERROR' },
                ],
                correctOptionId: 'C',
                explanation: 'Trong SQL chuẩn ba giá trị logic (three-valued logic), phép so sánh giá trị với NULL bằng toán tử = luôn cho ra UNKNOWN (NULL). Để so sánh NULL ta phải dùng IS NULL hoặc IS NOT NULL.',
            },
        ],
    },
    {
        id: 'mock-2',
        title: 'Quản lý đào tạo & Sinh viên - Trung bình',
        category: 'University',
        difficulty: 'Trung bình',
        difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Các bài tập chuyên sâu về INNER/LEFT JOIN, GROUP BY, HAVING và subquery tính toán bảng điểm.',
        questionsCount: 5,
        durationMinutes: 30,
        participantsCount: 982,
        icon: 'school',
        iconBg: 'bg-blue-50 border-blue-100',
        iconColor: 'text-blue-600',
        questions: [
            {
                id: 'q2-1',
                type: 'multiple_choice',
                points: 20,
                question: 'Mệnh đề HAVING khác mệnh đề WHERE ở điểm nào chính yếu nhất?',
                options: [
                    { id: 'A', text: 'HAVING chỉ dùng cho chuỗi ký tự, WHERE dùng cho số' },
                    { id: 'B', text: 'HAVING lọc điều kiện sau khi đã nhóm (GROUP BY) và áp dụng được hàm tổng hợp (AGGREGATE)' },
                    { id: 'C', text: 'WHERE chỉ lọc dữ liệu sau khi sắp xếp ORDER BY' },
                    { id: 'D', text: 'Không có điểm khác nhau' },
                ],
                correctOptionId: 'B',
                explanation: 'WHERE lọc các dòng đơn lẻ trước khi gom nhóm, còn HAVING lọc các nhóm dữ liệu đã gom và có thể sử dụng các hàm tổng hợp như COUNT, SUM, AVG, MAX, MIN.',
            },
            {
                id: 'q2-2',
                type: 'sql_query',
                points: 20,
                question: 'Thống kê điểm trung bình (GPA) của từng sinh viên (mã sinh viên, họ tên) và chỉ lấy sinh viên có GPA >= 8.0.',
                description: 'Bảng students (student_id, full_name), bảng scores (score_id, student_id, course_id, grade).',
                sampleQuery: 'SELECT s.student_id, s.full_name, ROUND(AVG(sc.grade), 2) AS gpa\nFROM students s\nJOIN scores sc ON s.student_id = sc.student_id\nGROUP BY s.student_id, s.full_name\nHAVING AVG(sc.grade) >= 8.0;',
                solutionQuery: 'SELECT s.student_id, s.full_name, ROUND(AVG(sc.grade), 2) AS gpa FROM students s JOIN scores sc ON s.student_id = sc.student_id GROUP BY s.student_id, s.full_name HAVING AVG(sc.grade) >= 8.0;',
                schema: [
                    { tableName: 'students', columns: ['student_id (INT, PK)', 'full_name (VARCHAR)', 'class_id (VARCHAR)'] },
                    { tableName: 'scores', columns: ['score_id (INT, PK)', 'student_id (INT, FK)', 'course_id (INT)', 'grade (DECIMAL)'] },
                ],
                mockTableResult: [
                    { student_id: 2024001, full_name: 'Lê Hoàng Nam', gpa: 8.85 },
                    { student_id: 2024045, full_name: 'Đặng Thu Thảo', gpa: 8.4 },
                ],
                explanation: 'Kết hợp JOIN giữa students và scores, nhóm theo sinh viên và lọc bằng HAVING AVG(sc.grade) >= 8.0.',
            },
            {
                id: 'q2-3',
                type: 'multiple_choice',
                points: 20,
                question: 'Loại JOIN nào sẽ trả về toàn bộ bản ghi từ bảng bên trái ngay cả khi không tìm thấy kết quả khớp ở bảng bên phải?',
                options: [
                    { id: 'A', text: 'INNER JOIN' },
                    { id: 'B', text: 'LEFT JOIN (LEFT OUTER JOIN)' },
                    { id: 'C', text: 'RIGHT JOIN' },
                    { id: 'D', text: 'CROSS JOIN' },
                ],
                correctOptionId: 'B',
                explanation: 'LEFT JOIN trả về tất cả các hàng từ bảng bên trái (Left table) cùng với các giá trị tương ứng từ bảng bên phải, nếu không có khớp sẽ điền NULL.',
            },
            {
                id: 'q2-4',
                type: 'sql_query',
                points: 20,
                question: 'Tìm các sinh viên chưa đăng ký học bất kỳ môn học nào trong học kỳ hiện tại.',
                description: 'Bảng students kết nối LEFT JOIN với enrollments qua student_id, lọc những bản ghi enrollment_id IS NULL.',
                sampleQuery: 'SELECT s.student_id, s.full_name\nFROM students s\nLEFT JOIN enrollments e ON s.student_id = e.student_id\nWHERE e.enrollment_id IS NULL;',
                solutionQuery: 'SELECT s.student_id, s.full_name FROM students s LEFT JOIN enrollments e ON s.student_id = e.student_id WHERE e.enrollment_id IS NULL;',
                schema: [
                    { tableName: 'students', columns: ['student_id (INT, PK)', 'full_name (VARCHAR)'] },
                    { tableName: 'enrollments', columns: ['enrollment_id (INT, PK)', 'student_id (INT, FK)', 'semester (VARCHAR)'] },
                ],
                mockTableResult: [
                    { student_id: 2024099, full_name: 'Vũ Đức Thịnh' },
                    { student_id: 2024102, full_name: 'Trần Quỳnh Anh' },
                ],
                explanation: 'Dùng LEFT JOIN và điều kiện WHERE bảng bên phải IS NULL để tìm các phần tử chưa có quan hệ.',
            },
            {
                id: 'q2-5',
                type: 'multiple_choice',
                points: 20,
                question: 'Phát biểu nào sau đây đúng khi sử dụng UNION và UNION ALL?',
                options: [
                    { id: 'A', text: 'UNION ALL loại bỏ các dòng trùng lặp, UNION giữ lại tất cả' },
                    { id: 'B', text: 'UNION loại bỏ các dòng trùng lặp, còn UNION ALL giữ nguyên tất cả bản ghi trùng' },
                    { id: 'C', text: 'Cả hai đều tự động sắp xếp kết quả tăng dần' },
                    { id: 'D', text: 'UNION bắt buộc hai truy vấn phải có tên cột giống hệt nhau' },
                ],
                correctOptionId: 'B',
                explanation: 'UNION sẽ thực hiện loại bỏ các dòng bản ghi trùng lặp (có chi phí hiệu năng sắp xếp/dedup), còn UNION ALL gộp nhanh tất cả các dòng bao gồm trùng lặp.',
            },
        ],
    },
    {
        id: 'mock-3',
        title: 'Hệ thống Y tế & Bệnh viện - Trung bình',
        category: 'Hospital',
        difficulty: 'Trung bình',
        difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Thực hành các truy vấn phức tạp kết hợp nhiều bảng: bệnh nhân, bác sĩ, lịch hẹn và toa thuốc.',
        questionsCount: 5,
        durationMinutes: 35,
        participantsCount: 756,
        icon: 'medical_services',
        iconBg: 'bg-rose-50 border-rose-100',
        iconColor: 'text-rose-600',
        questions: [
            {
                id: 'q3-1',
                type: 'multiple_choice',
                points: 20,
                question: 'Khóa ngoại (FOREIGN KEY) trong cơ sở dữ liệu có tác dụng chính là gì?',
                options: [
                    { id: 'A', text: 'Tăng tốc độ truy vấn chỉ mục' },
                    { id: 'B', text: 'Đảm bảo tính toàn vẹn tham chiếu giữa dữ liệu của hai bảng' },
                    { id: 'C', text: 'Tự động mã hóa thông tin bảo mật' },
                    { id: 'D', text: 'Cho phép lưu trữ dữ liệu không giới hạn kích thước' },
                ],
                correctOptionId: 'B',
                explanation: 'Ràng buộc khóa ngoại (Foreign Key) đảm bảo tính toàn vẹn tham chiếu (referential integrity), ngăn việc chèn giá trị không tồn tại ở bảng cha.',
            },
            {
                id: 'q3-2',
                type: 'sql_query',
                points: 20,
                question: 'Đếm số lượng bệnh nhân đã khám theo từng bác sĩ (doctor_id, doctor_name) trong tháng 05/2026.',
                description: 'Bảng doctors và appointments kết nối qua doctor_id.',
                sampleQuery: 'SELECT d.doctor_id, d.doctor_name, COUNT(a.appointment_id) AS total_appointments\nFROM doctors d\nJOIN appointments a ON d.doctor_id = a.doctor_id\nWHERE a.appointment_date BETWEEN \'2026-05-01\' AND \'2026-05-31\'\nGROUP BY d.doctor_id, d.doctor_name\nORDER BY total_appointments DESC;',
                solutionQuery: 'SELECT d.doctor_id, d.doctor_name, COUNT(a.appointment_id) AS total_appointments FROM doctors d JOIN appointments a ON d.doctor_id = a.doctor_id WHERE a.appointment_date BETWEEN \'2026-05-01\' AND \'2026-05-31\' GROUP BY d.doctor_id, d.doctor_name ORDER BY total_appointments DESC;',
                schema: [
                    { tableName: 'doctors', columns: ['doctor_id (INT, PK)', 'doctor_name (VARCHAR)', 'specialty (VARCHAR)'] },
                    { tableName: 'appointments', columns: ['appointment_id (INT, PK)', 'doctor_id (INT, FK)', 'patient_id (INT, FK)', 'appointment_date (DATE)'] },
                ],
                mockTableResult: [
                    { doctor_id: 12, doctor_name: 'BS. CKII Nguyễn Thị Mai', total_appointments: 48 },
                    { doctor_id: 5, doctor_name: 'BS. Lê Minh Trí', total_appointments: 39 },
                ],
                explanation: 'Sử dụng COUNT và GROUP BY kết hợp điều kiện lọc ngày tháng khám bệnh.',
            },
            {
                id: 'q3-3',
                type: 'multiple_choice',
                points: 20,
                question: 'Hàm nào sau đây trong SQL dùng để lấy phần ngày/tháng/năm từ một trường kiểu DATETIME?',
                options: [
                    { id: 'A', text: 'EXTRACT / DATEPART / YEAR / MONTH' },
                    { id: 'B', text: 'SPLIT_DATE' },
                    { id: 'C', text: 'PARSE_TIME' },
                    { id: 'D', text: 'GET_CALENDAR' },
                ],
                correctOptionId: 'A',
                explanation: 'Các hàm chuẩn như EXTRACT(), DATEPART(), YEAR(), MONTH() dùng để trích xuất các thành phần ngày giờ.',
            },
            {
                id: 'q3-4',
                type: 'sql_query',
                points: 20,
                question: 'Lấy thông tin thuốc (drug_name, total_prescribed) được kê đơn nhiều nhất trong hệ thống.',
                description: 'Bảng prescription_items chứa thông tin drug_id, drug_name, quantity.',
                sampleQuery: 'SELECT drug_name, SUM(quantity) AS total_prescribed\nFROM prescription_items\nGROUP BY drug_name\nORDER BY total_prescribed DESC\nLIMIT 1;',
                solutionQuery: 'SELECT drug_name, SUM(quantity) AS total_prescribed FROM prescription_items GROUP BY drug_name ORDER BY total_prescribed DESC LIMIT 1;',
                schema: [
                    { tableName: 'prescription_items', columns: ['item_id (INT, PK)', 'prescription_id (INT)', 'drug_name (VARCHAR)', 'quantity (INT)'] },
                ],
                mockTableResult: [
                    { drug_name: 'Paracetamol 500mg', total_prescribed: 1450 },
                ],
                explanation: 'Sử dụng SUM(quantity), GROUP BY drug_name và ORDER BY ... DESC LIMIT 1.',
            },
            {
                id: 'q3-5',
                type: 'multiple_choice',
                points: 20,
                question: 'Chỉ mục (INDEX) mang lại lợi ích gì cho cơ sở dữ liệu?',
                options: [
                    { id: 'A', text: 'Giảm dung lượng ổ cứng lưu trữ bảng' },
                    { id: 'B', text: 'Tăng tốc độ truy vấn tìm kiếm dữ liệu (SELECT)' },
                    { id: 'C', text: 'Tăng tốc độ cho mọi thao tác INSERT và UPDATE' },
                    { id: 'D', text: 'Tự động sao lưu dữ liệu khi gặp sự cố' },
                ],
                correctOptionId: 'B',
                explanation: 'INDEX xây dựng cấu trúc cây tìm kiếm (thường là B-Tree) giúp tăng tốc độ đọc dữ liệu, tuy nhiên có thể làm chậm một phần nhỏ thao tác ghi (INSERT/UPDATE).',
            },
        ],
    },
    {
        id: 'mock-4',
        title: 'Phân tích dữ liệu kinh doanh - Nâng cao',
        category: 'Analytics',
        difficulty: 'Nâng cao',
        difficultyColor: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Các bài tập phân tích dữ liệu hiệu suất cao với Window Functions, CTE và Aggregate Functions.',
        questionsCount: 5,
        durationMinutes: 40,
        participantsCount: 542,
        icon: 'bar_chart',
        iconBg: 'bg-amber-50 border-amber-100',
        iconColor: 'text-amber-600',
        questions: [
            {
                id: 'q4-1',
                type: 'multiple_choice',
                points: 20,
                question: 'Window Function nào đánh số thứ tự liên tục không tạo khoảng trống khi có các giá trị bằng nhau?',
                options: [
                    { id: 'A', text: 'ROW_NUMBER()' },
                    { id: 'B', text: 'RANK()' },
                    { id: 'C', text: 'DENSE_RANK()' },
                    { id: 'D', text: 'NTILE()' },
                ],
                correctOptionId: 'C',
                explanation: 'DENSE_RANK() gán cùng thứ hạng cho các giá trị bằng nhau và thứ hạng kế tiếp sẽ tăng liền kề (1, 1, 2, 3), trong khi RANK() tạo khoảng trống (1, 1, 3).',
            },
            {
                id: 'q4-2',
                type: 'sql_query',
                points: 20,
                question: 'Tính tổng doanh thu lũy kế (cumulative revenue) theo từng ngày trong tháng.',
                description: 'Bảng daily_sales (sale_date, amount). Sử dụng SUM(amount) OVER (ORDER BY sale_date).',
                sampleQuery: 'SELECT sale_date, amount,\n       SUM(amount) OVER (ORDER BY sale_date) AS cumulative_revenue\nFROM daily_sales;',
                solutionQuery: 'SELECT sale_date, amount, SUM(amount) OVER (ORDER BY sale_date) AS cumulative_revenue FROM daily_sales;',
                schema: [
                    { tableName: 'daily_sales', columns: ['sale_date (DATE, PK)', 'amount (DECIMAL)'] },
                ],
                mockTableResult: [
                    { sale_date: '2026-05-01', amount: 12000000, cumulative_revenue: 12000000 },
                    { sale_date: '2026-05-02', amount: 18500000, cumulative_revenue: 30500000 },
                    { sale_date: '2026-05-03', amount: 9500000, cumulative_revenue: 40000000 },
                ],
                explanation: 'Window function SUM(amount) OVER (ORDER BY sale_date) tính tổng cộng dồn theo thời gian.',
            },
            {
                id: 'q4-3',
                type: 'multiple_choice',
                points: 20,
                question: 'Mục đích chính của mệnh đề WITH (Common Table Expression - CTE) là gì?',
                options: [
                    { id: 'A', text: 'Khởi tạo transaction cô lập' },
                    { id: 'B', text: 'Tạo bảng tạm có tên trong phạm vi truy vấn giúp code rõ ràng và tái sử dụng' },
                    { id: 'C', text: 'Mã hóa kết quả đầu ra của bảng' },
                    { id: 'D', text: 'Tự động tạo trigger đồng bộ' },
                ],
                correctOptionId: 'B',
                explanation: 'CTE định nghĩa bảng tạm thời trong bộ nhớ cho truy vấn đơn lẻ, giúp đơn giản hóa các truy vấn phức tạp và cho phép đệ quy.',
            },
            {
                id: 'q4-4',
                type: 'sql_query',
                points: 20,
                question: 'Tìm top 1 sản phẩm có doanh số bán cao nhất trong từng danh mục (category_id).',
                description: 'Sử dụng CTE hoặc Subquery kết hợp hàm ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY total_sales DESC).',
                sampleQuery: 'WITH RankedProducts AS (\n    SELECT product_id, product_name, category_id, total_sales,\n           ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY total_sales DESC) as rn\n    FROM products\n)\nSELECT product_id, product_name, category_id, total_sales\nFROM RankedProducts\nWHERE rn = 1;',
                solutionQuery: 'WITH RankedProducts AS (SELECT product_id, product_name, category_id, total_sales, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY total_sales DESC) as rn FROM products) SELECT product_id, product_name, category_id, total_sales FROM RankedProducts WHERE rn = 1;',
                schema: [
                    { tableName: 'products', columns: ['product_id (INT, PK)', 'product_name (VARCHAR)', 'category_id (INT)', 'total_sales (DECIMAL)'] },
                ],
                mockTableResult: [
                    { product_id: 101, product_name: 'iPhone 15 Pro', category_id: 1, total_sales: 150000000 },
                    { product_id: 205, product_name: 'MacBook Air M2', category_id: 2, total_sales: 220000000 },
                ],
                explanation: 'PARTITION BY category_id chia nhỏ nhóm phân loại và ROW_NUMBER() chọn ra vị trí số 1.',
            },
            {
                id: 'q4-5',
                type: 'multiple_choice',
                points: 20,
                question: 'Hàm LEAD(column, offset) và LAG(column, offset) trong SQL dùng để làm gì?',
                options: [
                    { id: 'A', text: 'Lấy dữ liệu của dòng phía sau (LEAD) và dòng phía trước (LAG) theo thứ tự sắp xếp' },
                    { id: 'B', text: 'Xóa các bản ghi trễ hạn trong bảng' },
                    { id: 'C', text: 'Đo lường độ trễ mạng khi kết nối database' },
                    { id: 'D', text: 'Chỉ dùng để tính thời gian trễ của lịch hẹn' },
                ],
                correctOptionId: 'A',
                explanation: 'LEAD/LAG là các hàm phân tích giá trị của dòng kế tiếp hoặc dòng liền kề trước đó mà không cần thực hiện self-join.',
            },
        ],
    },
    {
        id: 'mock-5',
        title: 'Hệ thống Ngân hàng & Giao dịch - Nâng cao',
        category: 'Banking',
        difficulty: 'Nâng cao',
        difficultyColor: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Đề thi tổng hợp kiểm tra transaction, khóa ngoại ràng buộc và tính toán số dư tài khoản tự động.',
        questionsCount: 5,
        durationMinutes: 45,
        participantsCount: 321,
        icon: 'account_balance',
        iconBg: 'bg-teal-50 border-teal-100',
        iconColor: 'text-teal-600',
        questions: [
            {
                id: 'q5-1',
                type: 'multiple_choice',
                points: 20,
                question: 'Thuộc tính nào trong nguyên lý ACID đảm bảo rằng mọi thao tác trong một transaction hoặc thành công tất cả hoặc thất bại hoàn toàn (không lưu trạng thái dở dang)?',
                options: [
                    { id: 'A', text: 'Atomicity (Tính nguyên tử)' },
                    { id: 'B', text: 'Consistency (Tính nhất quán)' },
                    { id: 'C', text: 'Isolation (Tính cô lập)' },
                    { id: 'D', text: 'Durability (Tính bền vững)' },
                ],
                correctOptionId: 'A',
                explanation: 'Atomicity (Tính nguyên tử) đảm bảo giao dịch là một khối thống nhất: All or Nothing.',
            },
            {
                id: 'q5-2',
                type: 'sql_query',
                points: 20,
                question: 'Truy vấn danh sách các tài khoản có tổng số tiền chuyển đi (sender_account) vượt quá 50,000,000 VNĐ trong ngày hôm nay.',
                description: 'Bảng transactions (tx_id, sender_account, receiver_account, amount, tx_time, status). Lọc status = \'SUCCESS\'.',
                sampleQuery: 'SELECT sender_account, SUM(amount) AS total_transferred\nFROM transactions\nWHERE status = \'SUCCESS\' AND DATE(tx_time) = CURRENT_DATE\nGROUP BY sender_account\nHAVING SUM(amount) > 50000000;',
                solutionQuery: 'SELECT sender_account, SUM(amount) AS total_transferred FROM transactions WHERE status = \'SUCCESS\' AND DATE(tx_time) = CURRENT_DATE GROUP BY sender_account HAVING SUM(amount) > 50000000;',
                schema: [
                    { tableName: 'transactions', columns: ['tx_id (VARCHAR, PK)', 'sender_account (VARCHAR)', 'receiver_account (VARCHAR)', 'amount (DECIMAL)', 'tx_time (DATETIME)', 'status (VARCHAR)'] },
                ],
                mockTableResult: [
                    { sender_account: '1029384756', total_transferred: 85000000 },
                    { sender_account: '9988776655', total_transferred: 120000000 },
                ],
                explanation: 'Sử dụng SUM, GROUP BY và HAVING kết hợp kiểm tra trạng thái SUCCESS.',
            },
            {
                id: 'q5-3',
                type: 'multiple_choice',
                points: 20,
                question: 'Hiện tượng "Dirty Read" xảy ra ở mức độ cô lập (Isolation Level) nào?',
                options: [
                    { id: 'A', text: 'Read Uncommitted' },
                    { id: 'B', text: 'Read Committed' },
                    { id: 'C', text: 'Repeatable Read' },
                    { id: 'D', text: 'Serializable' },
                ],
                correctOptionId: 'A',
                explanation: 'Read Uncommitted cho phép một transaction đọc dữ liệu chưa được commit của một transaction khác, dẫn tới Dirty Read.',
            },
            {
                id: 'q5-4',
                type: 'sql_query',
                points: 20,
                question: 'Tính số dư khả dụng hiện tại của từng tài khoản dựa trên tổng tiền nạp (CR) trừ đi tổng tiền rút (DR).',
                description: 'Bảng account_ledger (entry_id, account_no, entry_type (\'CR\' / \'DR\'), amount).',
                sampleQuery: 'SELECT account_no,\n       SUM(CASE WHEN entry_type = \'CR\' THEN amount ELSE -amount END) AS current_balance\nFROM account_ledger\nGROUP BY account_no;',
                solutionQuery: 'SELECT account_no, SUM(CASE WHEN entry_type = \'CR\' THEN amount ELSE -amount END) AS current_balance FROM account_ledger GROUP BY account_no;',
                schema: [
                    { tableName: 'account_ledger', columns: ['entry_id (INT, PK)', 'account_no (VARCHAR)', 'entry_type (VARCHAR)', 'amount (DECIMAL)'] },
                ],
                mockTableResult: [
                    { account_no: '9988112233', current_balance: 45000000 },
                    { account_no: '9988445566', current_balance: 18200000 },
                ],
                explanation: 'Sử dụng biểu thức điều kiện CASE WHEN trong hàm SUM để cộng dồn tiền ghi có và trừ đi tiền ghi nợ.',
            },
            {
                id: 'q5-5',
                type: 'multiple_choice',
                points: 20,
                question: 'Lệnh SQL nào dùng để hủy bỏ hoàn toàn các thay đổi vừa thực hiện trong transaction hiện tại và quay về trạng thái ban đầu?',
                options: [
                    { id: 'A', text: 'CANCEL' },
                    { id: 'B', text: 'ROLLBACK' },
                    { id: 'C', text: 'DISCARD' },
                    { id: 'D', text: 'REVERT' },
                ],
                correctOptionId: 'B',
                explanation: 'Lệnh ROLLBACK hủy bỏ mọi thao tác đã thực hiện kể từ lệnh BEGIN/START TRANSACTION gần nhất.',
            },
        ],
    },
];