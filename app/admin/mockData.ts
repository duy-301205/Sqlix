import {
    AdminUser,
    DashboardStats,
    LearningCategory,
    MockTest,
    MockTestQuestion,
    PracticeDatabase,
    PracticeExercise,
    TestSessionHistory
} from './types';

export const mockUsers: AdminUser[] = [
    {
        id: 'usr-1',
        username: 'duyhoang',
        fullName: 'Nguyễn Duy Hoàng',
        email: 'hoang.duy@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'ADMIN',
        status: 'ACTIVE',
        totalExercisesSolved: 142,
        testsTaken: 18,
        createdAt: '2024-01-15T08:30:00Z',
        lastActiveAt: '2024-03-28T10:15:00Z',
    },
    {
        id: 'usr-2',
        username: 'minhtran',
        fullName: 'Trần Quang Minh',
        email: 'minh.tq@company.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'ACTIVE',
        totalExercisesSolved: 88,
        testsTaken: 9,
        createdAt: '2024-02-01T14:20:00Z',
        lastActiveAt: '2024-03-28T09:40:00Z',
    },
    {
        id: 'usr-3',
        username: 'thuhuong',
        fullName: 'Lê Thu Hương',
        email: 'huong.le@techhub.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        totalExercisesSolved: 215,
        testsTaken: 30,
        createdAt: '2024-01-10T09:00:00Z',
        lastActiveAt: '2024-03-27T17:10:00Z',
    },
    {
        id: 'usr-4',
        username: 'anhduc',
        fullName: 'Phạm Anh Đức',
        email: 'duc.pham@student.hust.edu.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'BANNED',
        totalExercisesSolved: 12,
        testsTaken: 2,
        createdAt: '2024-03-01T11:45:00Z',
        lastActiveAt: '2024-03-15T16:00:00Z',
    },
    {
        id: 'usr-5',
        username: 'khanhlinh',
        fullName: 'Vũ Khánh Linh',
        email: 'linh.vu@fpt.edu.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'ACTIVE',
        totalExercisesSolved: 160,
        testsTaken: 22,
        createdAt: '2024-02-14T07:12:00Z',
        lastActiveAt: '2024-03-28T11:05:00Z',
    },
    {
        id: 'usr-6',
        username: 'tuannguyen',
        fullName: 'Nguyễn Văn Tuấn',
        email: 'tuan.nv@domain.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'PENDING',
        totalExercisesSolved: 0,
        testsTaken: 0,
        createdAt: '2024-03-28T08:00:00Z',
        lastActiveAt: '2024-03-28T08:00:00Z',
    },
    {
        id: 'usr-7',
        username: 'hoangnam',
        fullName: 'Đặng Hoàng Nam',
        email: 'nam.dh@dataflow.io',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        totalExercisesSolved: 198,
        testsTaken: 25,
        createdAt: '2024-01-05T09:10:00Z',
        lastActiveAt: '2024-03-28T11:20:00Z',
    },
    {
        id: 'usr-8',
        username: 'bichngoc',
        fullName: 'Trịnh Bích Ngọc',
        email: 'ngoc.tb@fintech.com',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'ACTIVE',
        totalExercisesSolved: 75,
        testsTaken: 8,
        createdAt: '2024-02-18T15:30:00Z',
        lastActiveAt: '2024-03-27T21:40:00Z',
    },
    {
        id: 'usr-9',
        username: 'quocbao',
        fullName: 'Lương Quốc Bảo',
        email: 'bao.lq@student.ptit.edu.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        role: 'STUDENT',
        status: 'BANNED',
        totalExercisesSolved: 4,
        testsTaken: 1,
        createdAt: '2024-03-10T13:20:00Z',
        lastActiveAt: '2024-03-20T10:15:00Z',
    },
    {
        id: 'usr-10',
        username: 'thanhha',
        fullName: 'Trần Thanh Hà',
        email: 'ha.tt@techlead.vn',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        role: 'ADMIN',
        status: 'ACTIVE',
        totalExercisesSolved: 310,
        testsTaken: 45,
        createdAt: '2024-01-01T08:00:00Z',
        lastActiveAt: '2024-03-28T11:45:00Z',
    }
];

export const mockDashboardStats: DashboardStats = {
    totalUsers: 1482,
    activeUsersToday: 326,
    userGrowthPercent: 18.4,
    totalCategories: 6,
    totalLessons: 42,
    totalSections: 168,
    totalDatabases: 8,
    totalExercises: 215,
    totalMockTests: 12,
    totalQuestions: 156,
    totalTestSessions: 3840,
    passRatePercent: 78.5,
    averageTestScore: 8.2,
    systemHealth: {
        dbStatus: 'HEALTHY',
        activeConnections: 42,
        cpuUsagePercent: 24,
        memoryUsagePercent: 58,
        avgQueryLatencyMs: 14.2
    },
    recentTestSessions: [
        {
            id: 'sess-101',
            userName: 'Trần Quang Minh',
            userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            userEmail: 'minh.tq@company.com',
            testTitle: 'SQL Advanced Aggregations & Window Functions',
            score: 9.5,
            maxScore: 10,
            isPassed: true,
            durationSeconds: 1650,
            submittedAt: '2024-03-28T11:05:00Z'
        },
        {
            id: 'sess-102',
            userName: 'Vũ Khánh Linh',
            userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
            userEmail: 'linh.vu@fpt.edu.vn',
            testTitle: 'Đề thi thử SQL Cơ bản - Đợt 1',
            score: 8.0,
            maxScore: 10,
            isPassed: true,
            durationSeconds: 2100,
            submittedAt: '2024-03-28T10:40:00Z'
        },
        {
            id: 'sess-103',
            userName: 'Lê Thu Hương',
            userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            userEmail: 'huong.le@techhub.vn',
            testTitle: 'Database Optimization & Indexing Assessment',
            score: 10.0,
            maxScore: 10,
            isPassed: true,
            durationSeconds: 1420,
            submittedAt: '2024-03-28T09:15:00Z'
        },
        {
            id: 'sess-104',
            userName: 'Phạm Anh Đức',
            userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            userEmail: 'duc.pham@student.hust.edu.vn',
            testTitle: 'Kiểm tra tổng hợp SQL Intermediate',
            score: 4.5,
            maxScore: 10,
            isPassed: false,
            durationSeconds: 2700,
            submittedAt: '2024-03-28T08:50:00Z'
        },
        {
            id: 'sess-105',
            userName: 'Nguyễn Duy Hoàng',
            userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            userEmail: 'hoang.duy@gmail.com',
            testTitle: 'PostgreSQL JSON & Full Text Search Specialization',
            score: 9.0,
            maxScore: 10,
            isPassed: true,
            durationSeconds: 1820,
            submittedAt: '2024-03-28T07:30:00Z'
        }
    ],
    recentRegisteredUsers: mockUsers.slice(0, 5),
    weeklyActivity: [
        { day: 'Th 2', testCount: 65, userRegistrations: 24, exerciseSubmissions: 310 },
        { day: 'Th 3', testCount: 78, userRegistrations: 19, exerciseSubmissions: 420 },
        { day: 'Th 4', testCount: 92, userRegistrations: 35, exerciseSubmissions: 512 },
        { day: 'Th 5', testCount: 110, userRegistrations: 42, exerciseSubmissions: 630 },
        { day: 'Th 6', testCount: 85, userRegistrations: 28, exerciseSubmissions: 480 },
        { day: 'Th 7', testCount: 140, userRegistrations: 52, exerciseSubmissions: 790 },
        { day: 'CN', testCount: 165, userRegistrations: 64, exerciseSubmissions: 890 }
    ]
};

export const mockDatabases: PracticeDatabase[] = [
    {
        id: 'db-1',
        name: 'E-Commerce Store (ShopNow)',
        slug: 'ecommerce-store',
        description: 'Cơ sở dữ liệu sàn thương mại điện tử với bảng Users, Products, Orders, OrderItems, Categories.',
        dialect: 'PostgreSQL',
        tableCount: 6,
        sampleRecordsCount: 25000,
        schemaData: `{
  "tables": ["users", "products", "categories", "orders", "order_items", "payments"],
  "relationships": [
    "orders.user_id -> users.id",
    "order_items.order_id -> orders.id",
    "order_items.product_id -> products.id"
  ]
}`,
        initSqlScript: `CREATE TABLE users (id SERIAL PRIMARY KEY, full_name VARCHAR(100), email VARCHAR(100) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);\nCREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(150), price NUMERIC(10,2), stock INT);`,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-02-15T14:30:00Z',
        exerciseCount: 35
    },
    {
        id: 'db-2',
        name: 'HR & Payroll Management',
        slug: 'hr-payroll',
        description: 'Cơ sở dữ liệu nhân sự, phòng ban, bậc lương, dự án và chấm công.',
        dialect: 'MySQL',
        tableCount: 5,
        sampleRecordsCount: 12000,
        schemaData: `{ "tables": ["employees", "departments", "salaries", "projects", "employee_projects"] }`,
        initSqlScript: `CREATE TABLE departments (id INT AUTO_INCREMENT PRIMARY KEY, dept_name VARCHAR(100));\nCREATE TABLE employees (id INT AUTO_INCREMENT PRIMARY KEY, dept_id INT, full_name VARCHAR(100), hire_date DATE);`,
        createdAt: '2024-01-20T11:00:00Z',
        updatedAt: '2024-03-01T09:15:00Z',
        exerciseCount: 28
    },
    {
        id: 'db-3',
        name: 'Hospital Clinic System',
        slug: 'hospital-clinic',
        description: 'Hệ thống quản lý bệnh viện: Bệnh nhân, Bác sĩ, Lịch hẹn, Toa thuốc và Bệnh án.',
        dialect: 'PostgreSQL',
        tableCount: 7,
        sampleRecordsCount: 34000,
        schemaData: `{ "tables": ["patients", "doctors", "appointments", "prescriptions", "departments"] }`,
        initSqlScript: `CREATE TABLE patients (id SERIAL PRIMARY KEY, name VARCHAR(100), date_of_birth DATE);\nCREATE TABLE doctors (id SERIAL PRIMARY KEY, name VARCHAR(100), specialty VARCHAR(100));`,
        createdAt: '2024-02-05T08:00:00Z',
        updatedAt: '2024-03-12T16:45:00Z',
        exerciseCount: 42
    }
];

export const mockExercises: PracticeExercise[] = [
    {
        id: 'ex-101',
        databaseId: 'db-1',
        title: 'Tìm top 5 khách hàng chi tiêu nhiều nhất trong năm 2023',
        slug: 'top-5-spending-customers-2023',
        difficulty: 'MEDIUM',
        requirements: 'Viết truy vấn trả về cột user_id, full_name và tổng số tiền đã chi tiêu (total_spent), sắp xếp theo total_spent giảm dần, chỉ lấy 5 kết quả đầu tiên.',
        hints: ['Sử dụng JOIN giữa bảng users và orders', 'Dùng SUM(total_amount) và GROUP BY', 'Sử dụng ORDER BY DESC LIMIT 5'],
        solutionQuery: `SELECT u.id AS user_id, u.full_name, SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE EXTRACT(YEAR FROM o.created_at) = 2023
GROUP BY u.id, u.full_name
ORDER BY total_spent DESC
LIMIT 5;`,
        initialCodeSnippet: `-- Viết câu lệnh SQL của bạn tại đây\nSELECT \nFROM \n`,
        points: 25,
        orderIndex: 1,
        createdAt: '2024-01-15T09:00:00Z'
    },
    {
        id: 'ex-102',
        databaseId: 'db-1',
        title: 'Liệt kê các danh mục chưa có sản phẩm nào được bán',
        slug: 'categories-with-no-sales',
        difficulty: 'EASY',
        requirements: 'Tìm tất cả category_id, category_name chưa từng xuất hiện trong bất kỳ đơn hàng nào đã hoàn thành.',
        hints: ['Có thể sử dụng NOT EXISTS hoặc LEFT JOIN kết hợp IS NULL'],
        solutionQuery: `SELECT c.id, c.name 
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL;`,
        points: 15,
        orderIndex: 2,
        createdAt: '2024-01-16T10:30:00Z'
    },
    {
        id: 'ex-103',
        databaseId: 'db-1',
        title: 'Tính doanh thu trung bình mỗi ngày trong tháng 12/2023',
        slug: 'daily-average-revenue-dec-2023',
        difficulty: 'HARD',
        requirements: 'Tính tổng doanh thu theo ngày trong tháng 12/2023 và tính trung bình doanh thu mỗi ngày bằng CTE.',
        hints: ['Dùng CTE tính doanh thu từng ngày rồi SELECT AVG'],
        solutionQuery: `WITH DailySales AS (
  SELECT DATE(created_at) AS sale_date, SUM(total_amount) AS daily_total
  FROM orders
  WHERE created_at >= '2023-12-01' AND created_at < '2024-01-01'
  GROUP BY DATE(created_at)
)
SELECT AVG(daily_total) AS avg_daily_revenue FROM DailySales;`,
        points: 30,
        orderIndex: 3,
        createdAt: '2024-01-18T14:00:00Z'
    },
    {
        id: 'ex-201',
        databaseId: 'db-2',
        title: 'Tìm nhân viên có mức lương cao nhất trong từng phòng ban',
        slug: 'highest-salary-per-department',
        difficulty: 'MEDIUM',
        requirements: 'Sử dụng Window Function ROW_NUMBER() hoặc DENSE_RANK() để tìm nhân viên nhận lương cao nhất của mỗi phòng ban.',
        hints: ['PARTITION BY dept_id ORDER BY salary DESC'],
        solutionQuery: `SELECT dept_id, full_name, salary
FROM (
  SELECT dept_id, full_name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) as rank
  FROM employees
) ranked
WHERE rank = 1;`,
        points: 25,
        orderIndex: 1,
        createdAt: '2024-02-01T08:30:00Z'
    },
    {
        id: 'ex-202',
        databaseId: 'db-2',
        title: 'Đếm số lượng nhân viên làm việc trong các dự án đang chạy',
        slug: 'count-employees-in-active-projects',
        difficulty: 'EASY',
        requirements: 'Viết truy vấn đếm số nhân viên duy nhất tham gia vào các dự án có status = "IN_PROGRESS".',
        hints: ['JOIN bảng projects và employee_projects', 'COUNT(DISTINCT employee_id)'],
        solutionQuery: `SELECT p.name AS project_name, COUNT(DISTINCT ep.employee_id) AS total_employees
FROM projects p
JOIN employee_projects ep ON p.id = ep.project_id
WHERE p.status = 'IN_PROGRESS'
GROUP BY p.id, p.name;`,
        points: 15,
        orderIndex: 2,
        createdAt: '2024-02-05T11:20:00Z'
    },
    {
        id: 'ex-301',
        databaseId: 'db-3',
        title: 'Thống kê số lượt khám bệnh theo chuyên khoa bác sĩ trong quý 1',
        slug: 'appointments-by-specialty-q1',
        difficulty: 'MEDIUM',
        requirements: 'Nhóm theo bác sĩ và chuyên khoa, đếm số lịch hẹn hoàn tất (status = "COMPLETED") từ 01/01 đến 31/03.',
        hints: ['JOIN doctors d ON a.doctor_id = d.id', 'COUNT(a.id)'],
        solutionQuery: `SELECT d.specialty, COUNT(a.id) AS total_appointments
FROM doctors d
JOIN appointments a ON d.id = a.doctor_id
WHERE a.status = 'COMPLETED' AND a.appointment_date BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY d.specialty
ORDER BY total_appointments DESC;`,
        points: 20,
        orderIndex: 1,
        createdAt: '2024-02-10T09:15:00Z'
    }
];

export const mockLearningCategories: LearningCategory[] = [
    {
        id: 'cat-1',
        title: 'SQL Căn Bản cho Người Mới Bắt Đầu',
        slug: 'sql-basics',
        description: 'Làm quen với cú pháp cơ bản: SELECT, WHERE, ORDER BY, GROUP BY và các hàm tổng hợp.',
        orderIndex: 1,
        iconName: 'BookOpen',
        colorTheme: 'blue',
        lessons: [
            {
                id: 'les-1',
                categoryId: 'cat-1',
                title: 'Khái niệm Cơ sở dữ liệu quan hệ & Cú pháp SELECT cơ bản',
                description: 'Hiểu cấu trúc bảng (Table), dòng (Row), cột (Column) và cách truy vấn dữ liệu đầu tiên.',
                orderIndex: 1,
                difficulty: 'BEGINNER',
                isPublished: true,
                sections: [
                    {
                        id: 'sec-1',
                        title: 'Tổng quan về Hệ quản trị CSDL Quan hệ (RDBMS)',
                        orderIndex: 1,
                        durationMinutes: 10,
                        contentMarkdown: 'Hệ cơ sở dữ liệu quan hệ tổ chức dữ liệu dưới dạng các bảng 2 chiều gồm các hàng và cột...',
                        sampleQuery: 'SELECT * FROM users;',
                        expectedResult: 'Hiển thị toàn bộ dữ liệu bảng users'
                    },
                    {
                        id: 'sec-2',
                        title: 'Chọn lọc cột và đổi bí danh với AS',
                        orderIndex: 2,
                        durationMinutes: 15,
                        contentMarkdown: 'Khi không muốn lấy toàn bộ cột (*), bạn có thể chỉ định rõ danh sách các cột cần truy xuất...',
                        sampleQuery: 'SELECT id AS user_id, email FROM users;',
                        expectedResult: 'user_id | email'
                    }
                ]
            },
            {
                id: 'les-2',
                categoryId: 'cat-1',
                title: 'Lọc điều kiện với WHERE và các toán tử AND, OR, NOT',
                description: 'Kỹ thuật lọc dữ liệu theo điều kiện số, chuỗi ký tự, ngày tháng và kết hợp logic.',
                orderIndex: 2,
                difficulty: 'BEGINNER',
                isPublished: true,
                sections: [
                    {
                        id: 'sec-3',
                        title: 'Toán tử so sánh trong WHERE (=, !=, >, <, BETWEEN, IN)',
                        orderIndex: 1,
                        durationMinutes: 20,
                        contentMarkdown: 'Mệnh đề WHERE được đặt ngay sau FROM để lọc những hàng thỏa mãn điều kiện logic...',
                        sampleQuery: "SELECT * FROM orders WHERE total_amount > 500000 AND status = 'COMPLETED';",
                        expectedResult: 'Danh sách đơn hàng giá trị trên 500k và đã hoàn tất'
                    }
                ]
            }
        ]
    },
    {
        id: 'cat-2',
        title: 'Kỹ thuật Kết nối Bảng (SQL JOINs)',
        slug: 'sql-joins',
        description: 'Nắm vững Inner Join, Left Join, Right Join, Full Outer Join, Cross Join và Self Join.',
        orderIndex: 2,
        iconName: 'GitMerge',
        colorTheme: 'indigo',
        lessons: [
            {
                id: 'les-3',
                categoryId: 'cat-2',
                title: 'INNER JOIN và LEFT JOIN chuyên sâu',
                description: 'Phân biệt sự khác nhau và bài toán ứng dụng thực tế của Inner Join vs Left Join.',
                orderIndex: 1,
                difficulty: 'INTERMEDIATE',
                isPublished: true,
                sections: []
            }
        ]
    },
    {
        id: 'cat-3',
        title: 'Hàm Cửa Sổ (Window Functions) & Phân Tích Dữ Liệu',
        slug: 'sql-window-functions',
        description: 'ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD() và tính toán lũy kế PARTITION BY.',
        orderIndex: 3,
        iconName: 'Layers',
        colorTheme: 'purple',
        lessons: []
    }
];

export const mockMockTests: MockTest[] = [
    {
        id: 'test-1',
        title: 'Đề thi thử SQL Cơ bản - Đợt 1',
        description: 'Đánh giá khả năng viết truy vấn căn bản: SELECT, WHERE, ORDER BY, GROUP BY, HAVING.',
        durationMinutes: 45,
        passingScore: 7.0,
        maxScore: 10,
        isPublished: true,
        difficulty: 'BEGINNER',
        questionsCount: 15,
        createdAt: '2024-01-20T08:00:00Z',
        updatedAt: '2024-02-10T11:00:00Z'
    },
    {
        id: 'test-2',
        title: 'SQL Advanced Aggregations & Window Functions',
        description: 'Thử thách các câu hỏi nâng cao với CTEs, Window Functions và Tối ưu hóa truy vấn.',
        durationMinutes: 60,
        passingScore: 8.0,
        maxScore: 10,
        isPublished: true,
        difficulty: 'ADVANCED',
        questionsCount: 12,
        createdAt: '2024-02-01T09:30:00Z',
        updatedAt: '2024-03-05T14:20:00Z'
    },
    {
        id: 'test-3',
        title: 'Database Optimization & Indexing Assessment',
        description: 'Kiểm tra kiến thức về Explain Plan, B-Tree Index, Composite Index và Partitioning.',
        durationMinutes: 50,
        passingScore: 7.5,
        maxScore: 10,
        isPublished: false,
        difficulty: 'ADVANCED',
        questionsCount: 10,
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-20T16:00:00Z'
    }
];

export const mockQuestions: MockTestQuestion[] = [
    {
        id: 'q-101',
        mockTestId: 'test-1',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Mệnh đề nào trong SQL được dùng để lọc kết quả sau khi đã áp dụng GROUP BY?',
        orderIndex: 1,
        points: 1.0,
        explanation: 'HAVING được dùng để lọc các nhóm sau khi GROUP BY, trong khi WHERE lọc các hàng trước khi gom nhóm.',
        options: [
            { id: 'opt-1', key: 'A', content: 'WHERE', isCorrect: false },
            { id: 'opt-2', key: 'B', content: 'HAVING', isCorrect: true },
            { id: 'opt-3', key: 'C', content: 'ORDER BY', isCorrect: false },
            { id: 'opt-4', key: 'D', content: 'GROUP FILTER', isCorrect: false }
        ]
    },
    {
        id: 'q-102',
        mockTestId: 'test-1',
        type: 'SQL_QUERY',
        prompt: 'Hãy viết câu lệnh SQL lấy ra tên khách hàng (full_name) và số đơn hàng (total_orders) họ đã đặt từ bảng customers và orders, sắp xếp giảm dần theo số đơn hàng.',
        orderIndex: 2,
        points: 2.0,
        databaseId: 'db-1',
        solutionQuery: `SELECT c.full_name, COUNT(o.id) AS total_orders
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.full_name
ORDER BY total_orders DESC;`,
        initialQuery: `SELECT \nFROM customers\n`,
        explanation: 'Sử dụng LEFT JOIN để giữ lại cả khách hàng chưa từng đặt đơn, sau đó GROUP BY id và COUNT(o.id).'
    }
];

export const mockHistorySessions: TestSessionHistory[] = [
    {
        id: 'sess-101',
        sessionId: 'sess-101',
        userId: 'usr-2',
        userName: 'Trần Quang Minh',
        userEmail: 'minh.tq@company.com',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-2',
        mockTestTitle: 'SQL Advanced Aggregations & Window Functions',
        score: 9.5,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 1650,
        startedAt: '2024-03-28T10:37:30Z',
        submittedAt: '2024-03-28T11:05:00Z',
        correctAnswersCount: 11,
        totalQuestionsCount: 12
    },
    {
        id: 'sess-102',
        sessionId: 'sess-102',
        userId: 'usr-5',
        userName: 'Vũ Khánh Linh',
        userEmail: 'linh.vu@fpt.edu.vn',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-1',
        mockTestTitle: 'Đề thi thử SQL Cơ bản - Đợt 1',
        score: 8.0,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 2100,
        startedAt: '2024-03-28T10:05:00Z',
        submittedAt: '2024-03-28T10:40:00Z',
        correctAnswersCount: 12,
        totalQuestionsCount: 15
    },
    {
        id: 'sess-103',
        sessionId: 'sess-103',
        userId: 'usr-3',
        userName: 'Lê Thu Hương',
        userEmail: 'huong.le@techhub.vn',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-3',
        mockTestTitle: 'Database Optimization & Indexing Assessment',
        score: 10.0,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 1420,
        startedAt: '2024-03-28T08:51:20Z',
        submittedAt: '2024-03-28T09:15:00Z',
        correctAnswersCount: 10,
        totalQuestionsCount: 10
    },
    {
        id: 'sess-104',
        sessionId: 'sess-104',
        userId: 'usr-4',
        userName: 'Phạm Anh Đức',
        userEmail: 'duc.pham@student.hust.edu.vn',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-1',
        mockTestTitle: 'Đề thi thử SQL Cơ bản - Đợt 1',
        score: 4.5,
        maxScore: 10,
        isPassed: false,
        durationSeconds: 2700,
        startedAt: '2024-03-28T08:05:00Z',
        submittedAt: '2024-03-28T08:50:00Z',
        correctAnswersCount: 6,
        totalQuestionsCount: 15
    },
    {
        id: 'sess-105',
        sessionId: 'sess-105',
        userId: 'usr-1',
        userName: 'Nguyễn Duy Hoàng',
        userEmail: 'hoang.duy@gmail.com',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-2',
        mockTestTitle: 'SQL Advanced Aggregations & Window Functions',
        score: 9.0,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 1820,
        startedAt: '2024-03-28T06:59:40Z',
        submittedAt: '2024-03-28T07:30:00Z',
        correctAnswersCount: 11,
        totalQuestionsCount: 12
    }
];
