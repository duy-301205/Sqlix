export interface Exercise {
    id: string;
    orderNumber: number;
    title: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
    difficultyColor: string;
    category: string;
    points: number;
    description: string;
    requirements: string[];
    expectedOutputColumns: string[];
    sampleQuery: string;
    solutionQuery: string;
    mockData: Record<string, string | number>[];
}

export const DATABASE_EXERCISES: Record<string, Exercise[]> = {
    // ==========================================
    // 1. E-COMMERCE DB EXERCISES
    // Tables: categories, products, order_details, customers, orders
    // ==========================================
    ecommerce: [
        {
            id: 'ex-ecom-1',
            orderNumber: 1,
            title: 'Lọc danh sách sản phẩm giá từ 500,000 trở lên',
            difficulty: 'Dễ',
            difficultyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            category: 'SELECT & WHERE',
            points: 100,
            description: 'Lấy ra thông tin gồm product_name, price và stock_quantity của những sản phẩm trong bảng products có giá từ 500,000 trở lên. Sắp xếp giảm dần theo giá niêm yết.',
            requirements: [
                'Truy vấn từ bảng products',
                'Mệnh đề WHERE: price >= 500000',
                'Mệnh đề ORDER BY: price DESC',
                'Cột kết quả: product_name, price, stock_quantity',
            ],
            expectedOutputColumns: ['product_name', 'price', 'stock_quantity'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT product_name, price, stock_quantity\nFROM products\nWHERE price >= 500000\nORDER BY price DESC;`,
            solutionQuery: 'SELECT product_name, price, stock_quantity FROM products WHERE price >= 500000 ORDER BY price DESC;',
            mockData: [
                { product_name: 'Màn hình UltraFine 4K 27 inch', price: 9800000, stock_quantity: 15 },
                { product_name: 'Tai nghe Bluetooth ANC Pro', price: 3450000, stock_quantity: 28 },
                { product_name: 'Chuột công thái học Master 3S', price: 2190000, stock_quantity: 45 },
                { product_name: 'Bàn phím cơ không dây RK84', price: 1250000, stock_quantity: 60 },
            ],
        },
        {
            id: 'ex-ecom-2',
            orderNumber: 2,
            title: 'Thống kê tổng số lượng sản phẩm theo từng danh mục',
            difficulty: 'Trung bình',
            difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
            category: 'INNER JOIN & GROUP BY',
            points: 100,
            description: 'Truy vấn category_name từ bảng categories và đếm tổng số lượng sản phẩm (total_products) thuộc danh mục đó từ bảng products. Sắp xếp giảm dần theo số lượng sản phẩm.',
            requirements: [
                'JOIN giữa bảng categories và products qua khóa category_id',
                'Sử dụng hàm COUNT(p.product_id) AS total_products',
                'Mệnh đề GROUP BY c.category_id, c.category_name',
                'Cột kết quả: category_name, total_products',
            ],
            expectedOutputColumns: ['category_name', 'total_products'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT c.category_name, COUNT(p.product_id) AS total_products\nFROM categories c\nJOIN products p ON c.category_id = p.category_id\nGROUP BY c.category_id, c.category_name\nORDER BY total_products DESC;`,
            solutionQuery: 'SELECT c.category_name, COUNT(p.product_id) AS total_products FROM categories c JOIN products p ON c.category_id = p.category_id GROUP BY c.category_id, c.category_name ORDER BY total_products DESC;',
            mockData: [
                { category_name: 'Phụ kiện máy tính', total_products: 12 },
                { category_name: 'Thiết bị âm thanh', total_products: 8 },
                { category_name: 'Màn hình hiển thị', total_products: 5 },
            ],
        },
        {
            id: 'ex-ecom-3',
            orderNumber: 3,
            title: 'Top khách hàng chi tiêu nhiều nhất theo tổng tiền đơn hàng',
            difficulty: 'Khó',
            difficultyColor: 'bg-rose-50 text-rose-700 border-rose-200',
            category: 'MULTI-JOIN & AGGREGATE',
            points: 100,
            description: 'Truy vấn họ tên khách hàng (customer_name), email và tổng tiền đã chi tiêu (total_spent) từ bảng customers và orders. Chỉ tính các đơn hàng có status = "PAID". Lấy ra 3 khách hàng chi tiêu nhiều nhất.',
            requirements: [
                'JOIN giữa bảng customers và orders qua customer_id',
                'Mệnh đề WHERE: o.status = "PAID"',
                'Hàm tổng hợp: SUM(o.total_amount) AS total_spent',
                'ORDER BY total_spent DESC LIMIT 3',
                'Cột kết quả: customer_name, email, total_spent',
            ],
            expectedOutputColumns: ['customer_name', 'email', 'total_spent'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT c.customer_name, c.email, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o ON c.customer_id = o.customer_id\nWHERE o.status = 'PAID'\nGROUP BY c.customer_id, c.customer_name, c.email\nORDER BY total_spent DESC\nLIMIT 3;`,
            solutionQuery: 'SELECT c.customer_name, c.email, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.status = \'PAID\' GROUP BY c.customer_id, c.customer_name, c.email ORDER BY total_spent DESC LIMIT 3;',
            mockData: [
                { customer_name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', total_spent: 45800000 },
                { customer_name: 'Trần Thị Mai', email: 'mai.tran@yahoo.com', total_spent: 38200000 },
                { customer_name: 'Lê Hoàng Nam', email: 'nam.le@outlook.com', total_spent: 29450000 },
            ],
        },
    ],

    // ==========================================
    // 2. UNIVERSITY DB EXERCISES
    // Tables: departments, students, courses, instructors, enrollments
    // ==========================================
    university: [
        {
            id: 'ex-uni-1',
            orderNumber: 1,
            title: 'Danh sách sinh viên xuất sắc có điểm GPA >= 3.6',
            difficulty: 'Dễ',
            difficultyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            category: 'SELECT & FILTER',
            points: 100,
            description: 'Truy vấn danh sách sinh viên gồm full_name, gpa, enrollment_year từ bảng students có điểm trung bình tích lũy GPA lớn hơn hoặc bằng 3.6.',
            requirements: [
                'Truy vấn từ bảng students',
                'Điều kiện WHERE: gpa >= 3.6',
                'Sắp xếp ORDER BY: gpa DESC',
                'Cột kết quả: full_name, gpa, enrollment_year',
            ],
            expectedOutputColumns: ['full_name', 'gpa', 'enrollment_year'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT full_name, gpa, enrollment_year\nFROM students\nWHERE gpa >= 3.6\nORDER BY gpa DESC;`,
            solutionQuery: 'SELECT full_name, gpa, enrollment_year FROM students WHERE gpa >= 3.6 ORDER BY gpa DESC;',
            mockData: [
                { full_name: 'Đặng Minh Khôi', gpa: 3.92, enrollment_year: 2023 },
                { full_name: 'Phạm Quỳnh Anh', gpa: 3.85, enrollment_year: 2022 },
                { full_name: 'Hoàng Mạnh Duy', gpa: 3.78, enrollment_year: 2023 },
            ],
        },
        {
            id: 'ex-uni-2',
            orderNumber: 2,
            title: 'Thống kê danh sách khóa học và tên khoa phụ trách',
            difficulty: 'Trung bình',
            difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
            category: 'INNER JOIN',
            points: 100,
            description: 'Lấy thông tin course_name, credits từ bảng courses cùng tên khoa phụ trách (department_name) từ bảng departments.',
            requirements: [
                'JOIN bảng courses và departments qua department_id',
                'Sắp xếp tăng dần theo course_name',
                'Cột kết quả: course_name, credits, department_name',
            ],
            expectedOutputColumns: ['course_name', 'credits', 'department_name'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT c.course_name, c.credits, d.department_name\nFROM courses c\nJOIN departments d ON c.department_id = d.department_id\nORDER BY c.course_name ASC;`,
            solutionQuery: 'SELECT c.course_name, c.credits, d.department_name FROM courses c JOIN departments d ON c.department_id = d.department_id ORDER BY c.course_name ASC;',
            mockData: [
                { course_name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, department_name: 'Khoa Công nghệ Thông tin' },
                { course_name: 'Cơ sở dữ liệu nâng cao', credits: 3, department_name: 'Khoa Công nghệ Thông tin' },
                { course_name: 'Kinh tế lượng', credits: 3, department_name: 'Khoa Kinh tế Quốc tế' },
            ],
        },
        {
            id: 'ex-uni-3',
            orderNumber: 3,
            title: 'Tính điểm tổng kết trung bình theo từng môn học',
            difficulty: 'Khó',
            difficultyColor: 'bg-rose-50 text-rose-700 border-rose-200',
            category: 'CALCULATION & GROUP BY',
            points: 100,
            description: 'Tính điểm trung bình học phần (avg_final_score) từ bảng enrollments cho mỗi môn học trong bảng courses. Công thức tính điểm tổng kết: midterm_score * 0.4 + final_score * 0.6. Chỉ lấy những môn học có từ 3 lượt đăng ký trở lên.',
            requirements: [
                'JOIN giữa courses và enrollments qua course_id',
                'Hàm tính trung bình: AVG(e.midterm_score * 0.4 + e.final_score * 0.6) AS avg_final_score',
                'Mệnh đề HAVING: COUNT(e.enrollment_id) >= 3',
                'Cột kết quả: course_name, total_students, avg_final_score',
            ],
            expectedOutputColumns: ['course_name', 'total_students', 'avg_final_score'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT c.course_name, COUNT(e.enrollment_id) AS total_students, ROUND(AVG(e.midterm_score * 0.4 + e.final_score * 0.6), 2) AS avg_final_score\nFROM courses c\nJOIN enrollments e ON c.course_id = e.course_id\nGROUP BY c.course_id, c.course_name\nHAVING COUNT(e.enrollment_id) >= 3\nORDER BY avg_final_score DESC;`,
            solutionQuery: 'SELECT c.course_name, COUNT(e.enrollment_id) AS total_students, ROUND(AVG(e.midterm_score * 0.4 + e.final_score * 0.6), 2) AS avg_final_score FROM courses c JOIN enrollments e ON c.course_id = e.course_id GROUP BY c.course_id, c.course_name HAVING COUNT(e.enrollment_id) >= 3 ORDER BY avg_final_score DESC;',
            mockData: [
                { course_name: 'Cơ sở dữ liệu nâng cao', total_students: 45, avg_final_score: 8.42 },
                { course_name: 'Lập trình Web nâng cao', total_students: 38, avg_final_score: 7.95 },
                { course_name: 'Hệ điều hành', total_students: 50, avg_final_score: 7.20 },
            ],
        },
    ],

    // ==========================================
    // 3. HOSPITAL DB EXERCISES
    // Tables: patients, doctors, appointments, prescriptions, medical_records
    // ==========================================
    hospital: [
        {
            id: 'ex-hosp-1',
            orderNumber: 1,
            title: 'Danh sách bác sĩ có trên 5 năm kinh nghiệm',
            difficulty: 'Dễ',
            difficultyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            category: 'SELECT & WHERE',
            points: 100,
            description: 'Lấy ra thông tin full_name, specialty, years_of_experience và phone từ bảng doctors với điều kiện bác sĩ có số năm kinh nghiệm (years_of_experience) lớn hơn hoặc bằng 5 năm.',
            requirements: [
                'Truy vấn từ bảng doctors',
                'Mệnh đề WHERE: years_of_experience >= 5',
                'Sắp xếp ORDER BY: years_of_experience DESC',
                'Cột kết quả: full_name, specialty, years_of_experience, phone',
            ],
            expectedOutputColumns: ['full_name', 'specialty', 'years_of_experience', 'phone'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT full_name, specialty, years_of_experience, phone\nFROM doctors\nWHERE years_of_experience >= 5\nORDER BY years_of_experience DESC;`,
            solutionQuery: 'SELECT full_name, specialty, years_of_experience, phone FROM doctors WHERE years_of_experience >= 5 ORDER BY years_of_experience DESC;',
            mockData: [
                { full_name: 'BS. Lê Trọng Hưng', specialty: 'Tim mạch', years_of_experience: 16, phone: '0912345678' },
                { full_name: 'BS. Vũ Thúy Hằng', specialty: 'Nhi khoa', years_of_experience: 11, phone: '0987654321' },
                { full_name: 'BS. Trần Đình Trọng', specialty: 'Ngoại thần kinh', years_of_experience: 8, phone: '0903124567' },
            ],
        },
        {
            id: 'ex-hosp-2',
            orderNumber: 2,
            title: 'Danh sách bệnh nhân và bác sĩ phụ trách khám bệnh',
            difficulty: 'Trung bình',
            difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
            category: 'MULTI-TABLE JOIN',
            points: 100,
            description: 'Truy vấn tên bệnh nhân (p.full_name AS patient_name), tên bác sĩ (d.full_name AS doctor_name), thời gian khám (appointment_date) và chẩn đoán (diagnosis) từ 3 bảng appointments, patients và doctors.',
            requirements: [
                'JOIN appointments với patients qua patient_id',
                'JOIN appointments với doctors qua doctor_id',
                'Sắp xếp giảm dần theo appointment_date',
                'Cột kết quả: patient_name, doctor_name, appointment_date, diagnosis',
            ],
            expectedOutputColumns: ['patient_name', 'doctor_name', 'appointment_date', 'diagnosis'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT p.full_name AS patient_name, d.full_name AS doctor_name, a.appointment_date, a.diagnosis\nFROM appointments a\nJOIN patients p ON a.patient_id = p.patient_id\nJOIN doctors d ON a.doctor_id = d.doctor_id\nORDER BY a.appointment_date DESC;`,
            solutionQuery: 'SELECT p.full_name AS patient_name, d.full_name AS doctor_name, a.appointment_date, a.diagnosis FROM appointments a JOIN patients p ON a.patient_id = p.patient_id JOIN doctors d ON a.doctor_id = d.doctor_id ORDER BY a.appointment_date DESC;',
            mockData: [
                { patient_name: 'Bùi Thị Lan', doctor_name: 'BS. Lê Trọng Hưng', appointment_date: '2024-03-15 08:30:00', diagnosis: 'Tăng huyết áp vô căn' },
                { patient_name: 'Trần Văn Bình', doctor_name: 'BS. Vũ Thúy Hằng', appointment_date: '2024-03-14 14:00:00', diagnosis: 'Viêm phế quản cấp' },
            ],
        },
        {
            id: 'ex-hosp-3',
            orderNumber: 3,
            title: 'Thống kê các loại thuốc được kê đơn nhiều lần nhất',
            difficulty: 'Khó',
            difficultyColor: 'bg-rose-50 text-rose-700 border-rose-200',
            category: 'AGGREGATION & GROUP BY',
            points: 100,
            description: 'Truy vấn tên biệt dược (medicine_name), số lần được kê đơn (times_prescribed) và tổng số ngày điều trị (total_days) từ bảng prescriptions. Chỉ hiển thị những loại thuốc có số lần kê từ 2 lần trở lên.',
            requirements: [
                'Truy vấn từ bảng prescriptions',
                'COUNT(prescription_id) AS times_prescribed',
                'SUM(days_supply) AS total_days',
                'Mệnh đề HAVING: COUNT(prescription_id) >= 2',
                'Cột kết quả: medicine_name, times_prescribed, total_days',
            ],
            expectedOutputColumns: ['medicine_name', 'times_prescribed', 'total_days'],
            sampleQuery: `-- Viết câu lệnh truy vấn SQL của bạn\nSELECT medicine_name, COUNT(prescription_id) AS times_prescribed, SUM(days_supply) AS total_days\nFROM prescriptions\nGROUP BY medicine_name\nHAVING COUNT(prescription_id) >= 2\nORDER BY times_prescribed DESC, total_days DESC;`,
            solutionQuery: 'SELECT medicine_name, COUNT(prescription_id) AS times_prescribed, SUM(days_supply) AS total_days FROM prescriptions GROUP BY medicine_name HAVING COUNT(prescription_id) >= 2 ORDER BY times_prescribed DESC, total_days DESC;',
            mockData: [
                { medicine_name: 'Paracetamol 500mg', times_prescribed: 18, total_days: 90 },
                { medicine_name: 'Amoxicillin 500mg', times_prescribed: 12, total_days: 84 },
                { medicine_name: 'Amlodipine 5mg', times_prescribed: 8, total_days: 240 },
            ],
        },
    ],
};