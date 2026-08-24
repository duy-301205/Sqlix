export interface ColumnSchema {
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    description: string;
}

export interface TableSchema {
    name: string;
    vietnameseName: string;
    description: string;
    columnsCount: number;
    columns: ColumnSchema[];
}

export interface DatabaseDetail {
    id: string;
    name: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
    difficultyColor: string;
    subtitle: string;
    overviewText: string;
    tablesCount: number;
    attributesCount: number;
    relationsCount: number;
    mainCategoriesCount: number;
    businessTablesCount: number;
    junctionTablesCount: number;
    tables: TableSchema[];
    relationships: {
        relation: string;
        description: string;
    }[];
}

export const DATABASES_DETAIL: Record<string, DatabaseDetail> = {
    // =========================================================
    // 1. E-COMMERCE DB
    // =========================================================
    ecommerce: {
        id: 'ecommerce',
        name: 'E-commerce DB',
        difficulty: 'Dễ',
        difficultyColor:
            'bg-emerald-50 text-emerald-700 border-emerald-200',
        subtitle:
            'Truy vấn sản phẩm, khách hàng và đơn đặt hàng',
        overviewText:
            'Cơ sở dữ liệu E-commerce quản lý thông tin sản phẩm, danh mục, khách hàng, đơn hàng và chi tiết đơn hàng trong hệ thống bán lẻ trực tuyến.',
        tablesCount: 5,
        attributesCount: 25,
        relationsCount: 4,
        mainCategoriesCount: 2,
        businessTablesCount: 2,
        junctionTablesCount: 1,

        tables: [
            {
                name: 'categories',
                vietnameseName: 'Danh mục',
                description:
                    'Phân loại các sản phẩm theo từng nhóm ngành hàng.',
                columnsCount: 3,
                columns: [
                    {
                        name: 'category_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã danh mục (Khóa chính)',
                    },
                    {
                        name: 'category_name',
                        type: 'VARCHAR(100)',
                        description: 'Tên danh mục',
                    },
                    {
                        name: 'description',
                        type: 'TEXT',
                        description: 'Mô tả chi tiết nhóm hàng',
                    },
                ],
            },

            {
                name: 'products',
                vietnameseName: 'Sản phẩm',
                description:
                    'Lưu trữ thông tin về các mặt hàng và đơn giá niêm yết trong hệ thống.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'product_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã sản phẩm (Khóa chính)',
                    },
                    {
                        name: 'product_name',
                        type: 'VARCHAR(255)',
                        description: 'Tên sản phẩm',
                    },
                    {
                        name: 'category_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã danh mục (Khóa ngoại)',
                    },
                    {
                        name: 'price',
                        type: 'DECIMAL(10,2)',
                        description: 'Đơn giá niêm yết',
                    },
                    {
                        name: 'stock_quantity',
                        type: 'INT',
                        description: 'Số lượng tồn kho',
                    },
                    {
                        name: 'created_at',
                        type: 'DATETIME',
                        description: 'Thời gian nhập hàng',
                    },
                ],
            },

            {
                name: 'customers',
                vietnameseName: 'Khách hàng',
                description:
                    'Thông tin tài khoản khách hàng đã đăng ký mua sắm.',
                columnsCount: 5,
                columns: [
                    {
                        name: 'customer_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã khách hàng',
                    },
                    {
                        name: 'full_name',
                        type: 'VARCHAR(150)',
                        description: 'Họ và tên khách hàng',
                    },
                    {
                        name: 'email',
                        type: 'VARCHAR(100)',
                        description: 'Địa chỉ email',
                    },
                    {
                        name: 'phone',
                        type: 'VARCHAR(20)',
                        description: 'Số điện thoại liên hệ',
                    },
                    {
                        name: 'city',
                        type: 'VARCHAR(100)',
                        description: 'Tỉnh / Thành phố cư trú',
                    },
                ],
            },

            {
                name: 'orders',
                vietnameseName: 'Đơn hàng',
                description:
                    'Lưu trữ thông tin các đơn đặt hàng của khách hàng.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'order_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã đơn hàng',
                    },
                    {
                        name: 'customer_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã khách hàng đặt hàng',
                    },
                    {
                        name: 'order_date',
                        type: 'DATETIME',
                        description: 'Thời gian đặt đơn',
                    },
                    {
                        name: 'total_amount',
                        type: 'DECIMAL(12,2)',
                        description: 'Tổng giá trị đơn hàng',
                    },
                    {
                        name: 'status',
                        type: 'VARCHAR(50)',
                        description:
                            'Trạng thái đơn hàng',
                    },
                    {
                        name: 'shipping_address',
                        type: 'TEXT',
                        description: 'Địa chỉ giao hàng',
                    },
                ],
            },

            {
                name: 'order_details',
                vietnameseName: 'Chi tiết đơn hàng',
                description:
                    'Bảng liên kết lưu trữ số lượng và đơn giá từng sản phẩm trong mỗi đơn.',
                columnsCount: 5,
                columns: [
                    {
                        name: 'order_detail_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã chi tiết',
                    },
                    {
                        name: 'order_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã đơn hàng',
                    },
                    {
                        name: 'product_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã sản phẩm',
                    },
                    {
                        name: 'quantity',
                        type: 'INT',
                        description: 'Số lượng mua',
                    },
                    {
                        name: 'unit_price',
                        type: 'DECIMAL(10,2)',
                        description:
                            'Đơn giá tại thời điểm mua',
                    },
                ],
            },
        ],

        relationships: [
            {
                relation: 'categories (1) ─── (N) products',
                description:
                    'Một danh mục chứa nhiều sản phẩm.',
            },
            {
                relation: 'customers (1) ─── (N) orders',
                description:
                    'Một khách hàng có thể đặt nhiều đơn hàng.',
            },
            {
                relation: 'orders (1) ─── (N) order_details',
                description:
                    'Một đơn hàng gồm nhiều dòng chi tiết.',
            },
            {
                relation: 'products (1) ─── (N) order_details',
                description:
                    'Một sản phẩm xuất hiện trong nhiều chi tiết đơn hàng.',
            },
        ],
    },

    // =========================================================
    // 2. UNIVERSITY DB
    // =========================================================
    university: {
        id: 'university',
        name: 'University DB',
        difficulty: 'Trung bình',
        difficultyColor:
            'bg-blue-50 text-blue-700 border-blue-200',
        subtitle:
            'Quản lý sinh viên, học phần, giảng viên và kết quả học tập',
        overviewText:
            'Cơ sở dữ liệu trường đại học quản lý thông tin sinh viên, khoa, học phần, giảng viên và kết quả đăng ký học tập.',
        tablesCount: 5,
        attributesCount: 24,
        relationsCount: 5,
        mainCategoriesCount: 2,
        businessTablesCount: 2,
        junctionTablesCount: 1,

        tables: [
            {
                name: 'departments',
                vietnameseName: 'Khoa',
                description:
                    'Danh sách các khoa chuyên môn và đơn vị đào tạo.',
                columnsCount: 3,
                columns: [
                    {
                        name: 'department_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã khoa',
                    },
                    {
                        name: 'department_name',
                        type: 'VARCHAR(100)',
                        description: 'Tên khoa',
                    },
                    {
                        name: 'building',
                        type: 'VARCHAR(50)',
                        description: 'Tòa nhà văn phòng khoa',
                    },
                ],
            },

            {
                name: 'students',
                vietnameseName: 'Sinh viên',
                description:
                    'Lưu trữ hồ sơ cá nhân và tình trạng học tập của sinh viên.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'student_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã số sinh viên',
                    },
                    {
                        name: 'full_name',
                        type: 'VARCHAR(150)',
                        description: 'Họ và tên sinh viên',
                    },
                    {
                        name: 'department_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã khoa chuyên ngành',
                    },
                    {
                        name: 'date_of_birth',
                        type: 'DATE',
                        description: 'Ngày sinh',
                    },
                    {
                        name: 'gpa',
                        type: 'DECIMAL(3,2)',
                        description: 'Điểm trung bình tích lũy',
                    },
                    {
                        name: 'enrollment_year',
                        type: 'INT',
                        description: 'Khóa nhập học',
                    },
                ],
            },

            {
                name: 'courses',
                vietnameseName: 'Học phần',
                description:
                    'Danh sách các môn học và số lượng tín chỉ tương ứng.',
                columnsCount: 4,
                columns: [
                    {
                        name: 'course_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã học phần',
                    },
                    {
                        name: 'course_name',
                        type: 'VARCHAR(150)',
                        description: 'Tên môn học',
                    },
                    {
                        name: 'credits',
                        type: 'INT',
                        description: 'Số tín chỉ',
                    },
                    {
                        name: 'department_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Khoa phụ trách giảng dạy',
                    },
                ],
            },

            {
                name: 'instructors',
                vietnameseName: 'Giảng viên',
                description:
                    'Thông tin đội ngũ giảng viên và khoa công tác.',
                columnsCount: 5,
                columns: [
                    {
                        name: 'instructor_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã giảng viên',
                    },
                    {
                        name: 'full_name',
                        type: 'VARCHAR(150)',
                        description: 'Họ tên giảng viên',
                    },
                    {
                        name: 'department_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã khoa công tác',
                    },
                    {
                        name: 'email',
                        type: 'VARCHAR(100)',
                        description: 'Email cơ quan',
                    },
                    {
                        name: 'specialization',
                        type: 'VARCHAR(100)',
                        description: 'Chuyên ngành giảng dạy',
                    },
                ],
            },

            {
                name: 'enrollments',
                vietnameseName: 'Đăng ký học phần',
                description:
                    'Lịch sử đăng ký học phần và kết quả điểm số của sinh viên.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'enrollment_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã lượt đăng ký',
                    },
                    {
                        name: 'student_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã sinh viên',
                    },
                    {
                        name: 'course_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã học phần',
                    },
                    {
                        name: 'semester',
                        type: 'VARCHAR(20)',
                        description: 'Học kỳ',
                    },
                    {
                        name: 'midterm_score',
                        type: 'DECIMAL(4,2)',
                        description: 'Điểm quá trình',
                    },
                    {
                        name: 'final_score',
                        type: 'DECIMAL(4,2)',
                        description: 'Điểm thi cuối kỳ',
                    },
                ],
            },
        ],

        relationships: [
            {
                relation: 'departments (1) ─── (N) students',
                description:
                    'Một khoa quản lý nhiều sinh viên.',
            },
            {
                relation: 'departments (1) ─── (N) instructors',
                description:
                    'Một khoa có nhiều giảng viên.',
            },
            {
                relation: 'departments (1) ─── (N) courses',
                description:
                    'Một khoa tổ chức nhiều học phần.',
            },
            {
                relation: 'students (1) ─── (N) enrollments',
                description:
                    'Một sinh viên đăng ký nhiều học phần.',
            },
            {
                relation: 'courses (1) ─── (N) enrollments',
                description:
                    'Một học phần có nhiều sinh viên đăng ký.',
            },
        ],
    },

    // =========================================================
    // 3. HOSPITAL DB
    // =========================================================
    hospital: {
        id: 'hospital',
        name: 'Hospital DB',
        difficulty: 'Trung bình',
        difficultyColor:
            'bg-blue-50 text-blue-700 border-blue-200',
        subtitle:
            'Quản lý bệnh nhân, bác sĩ, lịch khám và hồ sơ điều trị',
        overviewText:
            'Cơ sở dữ liệu bệnh viện quản lý thông tin bệnh nhân, bác sĩ, lịch hẹn, hồ sơ khám bệnh và đơn thuốc.',
        tablesCount: 5,
        attributesCount: 28,
        relationsCount: 5,
        mainCategoriesCount: 2,
        businessTablesCount: 2,
        junctionTablesCount: 1,

        tables: [
            {
                name: 'patients',
                vietnameseName: 'Bệnh nhân',
                description:
                    'Lưu trữ thông tin cơ bản của bệnh nhân.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'patient_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã bệnh nhân',
                    },
                    {
                        name: 'full_name',
                        type: 'VARCHAR(150)',
                        description: 'Họ và tên bệnh nhân',
                    },
                    {
                        name: 'gender',
                        type: 'VARCHAR(10)',
                        description: 'Giới tính',
                    },
                    {
                        name: 'birth_date',
                        type: 'DATE',
                        description: 'Ngày sinh',
                    },
                    {
                        name: 'phone',
                        type: 'VARCHAR(20)',
                        description: 'Số điện thoại',
                    },
                    {
                        name: 'address',
                        type: 'VARCHAR(255)',
                        description: 'Địa chỉ bệnh nhân',
                    },
                ],
            },

            {
                name: 'doctors',
                vietnameseName: 'Bác sĩ',
                description:
                    'Danh sách bác sĩ và chuyên khoa công tác.',
                columnsCount: 5,
                columns: [
                    {
                        name: 'doctor_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã bác sĩ',
                    },
                    {
                        name: 'full_name',
                        type: 'VARCHAR(150)',
                        description: 'Họ tên bác sĩ',
                    },
                    {
                        name: 'specialty',
                        type: 'VARCHAR(100)',
                        description: 'Chuyên khoa',
                    },
                    {
                        name: 'phone',
                        type: 'VARCHAR(20)',
                        description: 'Số điện thoại',
                    },
                    {
                        name: 'experience_years',
                        type: 'INT',
                        description: 'Số năm kinh nghiệm',
                    },
                ],
            },

            {
                name: 'appointments',
                vietnameseName: 'Lịch khám',
                description:
                    'Quản lý lịch hẹn khám giữa bệnh nhân và bác sĩ.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'appointment_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã lịch hẹn',
                    },
                    {
                        name: 'patient_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã bệnh nhân',
                    },
                    {
                        name: 'doctor_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã bác sĩ',
                    },
                    {
                        name: 'appointment_date',
                        type: 'DATETIME',
                        description: 'Thời gian khám',
                    },
                    {
                        name: 'status',
                        type: 'VARCHAR(30)',
                        description: 'Trạng thái lịch khám',
                    },
                    {
                        name: 'reason',
                        type: 'TEXT',
                        description: 'Lý do khám',
                    },
                ],
            },

            {
                name: 'medical_records',
                vietnameseName: 'Hồ sơ khám bệnh',
                description:
                    'Lưu trữ kết quả khám, chẩn đoán và ghi chú điều trị.',
                columnsCount: 6,
                columns: [
                    {
                        name: 'record_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã hồ sơ khám',
                    },
                    {
                        name: 'appointment_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã lịch khám',
                    },
                    {
                        name: 'diagnosis',
                        type: 'VARCHAR(255)',
                        description: 'Chẩn đoán bệnh',
                    },
                    {
                        name: 'symptoms',
                        type: 'TEXT',
                        description: 'Triệu chứng',
                    },
                    {
                        name: 'treatment',
                        type: 'TEXT',
                        description: 'Phương pháp điều trị',
                    },
                    {
                        name: 'created_at',
                        type: 'DATETIME',
                        description: 'Thời gian tạo hồ sơ',
                    },
                ],
            },

            {
                name: 'prescriptions',
                vietnameseName: 'Đơn thuốc',
                description:
                    'Toa thuốc được kê sau khi bệnh nhân hoàn thành quá trình khám.',
                columnsCount: 5,
                columns: [
                    {
                        name: 'prescription_id',
                        type: 'INT',
                        isPk: true,
                        description: 'Mã đơn thuốc',
                    },
                    {
                        name: 'record_id',
                        type: 'INT',
                        isFk: true,
                        description: 'Mã hồ sơ khám',
                    },
                    {
                        name: 'medicine_name',
                        type: 'VARCHAR(150)',
                        description: 'Tên thuốc',
                    },
                    {
                        name: 'dosage',
                        type: 'VARCHAR(100)',
                        description: 'Liều dùng',
                    },
                    {
                        name: 'days_supply',
                        type: 'INT',
                        description: 'Số ngày sử dụng',
                    },
                ],
            },
        ],

        relationships: [
            {
                relation: 'patients (1) ─── (N) appointments',
                description:
                    'Một bệnh nhân có thể có nhiều lịch khám.',
            },
            {
                relation: 'doctors (1) ─── (N) appointments',
                description:
                    'Một bác sĩ tiếp nhận nhiều lịch khám.',
            },
            {
                relation: 'appointments (1) ─── (1) medical_records',
                description:
                    'Mỗi lịch khám có một hồ sơ khám tương ứng.',
            },
            {
                relation: 'medical_records (1) ─── (N) prescriptions',
                description:
                    'Một hồ sơ khám có thể có nhiều đơn thuốc.',
            },
            {
                relation: 'patients (1) ─── (N) medical_records',
                description:
                    'Một bệnh nhân có thể có nhiều hồ sơ khám theo thời gian.',
            },
        ],
    },
};