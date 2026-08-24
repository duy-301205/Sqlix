export interface DatabasePractice {
    id: string;
    name: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
    difficultyColor: string;
    description: string;
    tablesCount: number;
    exercisesCount: number;
    rating: number;
    iconBg: string;
    iconColor: string;
    icon: string;
}

export const DATABASES_LIST: DatabasePractice[] = [
    {
        id: 'ecommerce',
        name: 'E-commerce DB',
        difficulty: 'Dễ',
        difficultyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description:
            'Cơ sở dữ liệu cửa hàng trực tuyến với sản phẩm, danh mục, khách hàng và đơn hàng.',
        tablesCount: 5,
        exercisesCount: 30,
        rating: 4.5,
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        iconColor: 'text-emerald-600',
        icon: 'shopping_bag',
    },

    {
        id: 'university',
        name: 'University DB',
        difficulty: 'Trung bình',
        difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description:
            'Cơ sở dữ liệu quản lý sinh viên, khóa học, giảng viên và kết quả học tập.',
        tablesCount: 5,
        exercisesCount: 40,
        rating: 4.7,
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
        iconColor: 'text-blue-600',
        icon: 'school',
    },

    {
        id: 'hospital',
        name: 'Hospital DB',
        difficulty: 'Trung bình',
        difficultyColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description:
            'Cơ sở dữ liệu bệnh viện với bệnh nhân, bác sĩ, lịch hẹn, đơn thuốc và hồ sơ khám bệnh.',
        tablesCount: 5,
        exercisesCount: 45,
        rating: 4.6,
        iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
        iconColor: 'text-purple-600',
        icon: 'medical_services',
    },
];