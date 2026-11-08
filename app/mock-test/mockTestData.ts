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

export const MOCK_TESTS: MockTestItem[] = [];
