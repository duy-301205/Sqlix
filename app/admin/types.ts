export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'PENDING';

export interface AdminUser {
    id: string;
    username: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    role: UserRole;
    status: UserStatus;
    totalExercisesSolved: number;
    testsTaken: number;
    createdAt: string;
    lastActiveAt: string;
}

export interface DashboardStats {
    totalUsers: number;
    activeUsersToday: number;
    userGrowthPercent: number;
    totalCategories: number;
    totalLessons: number;
    totalSections: number;
    totalDatabases: number;
    totalExercises: number;
    totalMockTests: number;
    totalQuestions: number;
    totalTestSessions: number;
    passRatePercent: number;
    averageTestScore: number;
    systemHealth: {
        dbStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
        activeConnections: number;
        cpuUsagePercent: number;
        memoryUsagePercent: number;
        avgQueryLatencyMs: number;
    };
    recentTestSessions: {
        id: string;
        userName: string;
        userAvatar: string;
        userEmail: string;
        testTitle: string;
        score: number;
        maxScore: number;
        isPassed: boolean;
        durationSeconds: number;
        submittedAt: string;
    }[];
    recentRegisteredUsers: AdminUser[];
    weeklyActivity: {
        day: string;
        testCount: number;
        userRegistrations: number;
        exerciseSubmissions: number;
    }[];
}

// Learning module types
export interface SectionItem {
    id: string;
    title: string;
    orderIndex: number;
    contentMarkdown: string;
    sampleQuery?: string;
    expectedResult?: string;
    durationMinutes: number;
}

export interface LessonItem {
    id: string;
    categoryId: string;
    title: string;
    description: string;
    orderIndex: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    isPublished: boolean;
    sections: SectionItem[];
}

export interface LearningCategory {
    id: string;
    title: string;
    slug: string;
    description: string;
    orderIndex: number;
    iconName: string;
    colorTheme: string;
    lessons: LessonItem[];
}

// Practice module types
export interface PracticeDatabase {
    id: string;
    name: string;
    slug: string;
    description: string;
    dialect: 'PostgreSQL' | 'MySQL' | 'SQLite';
    tableCount: number;
    sampleRecordsCount: number;
    schemaData: string; // JSON or DDL
    initSqlScript: string;
    createdAt: string;
    updatedAt: string;
    exerciseCount: number;
}

export interface PracticeExercise {
    id: string;
    databaseId: string;
    title: string;
    slug: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    requirements: string;
    hints?: string[];
    solutionQuery: string;
    initialCodeSnippet?: string;
    points: number;
    orderIndex: number;
    createdAt: string;
}

// Mock test module types
export type QuestionType = 'SQL_QUERY' | 'MULTIPLE_CHOICE';

export interface QuestionOption {
    id: string;
    key: 'A' | 'B' | 'C' | 'D';
    content: string;
    isCorrect: boolean;
}

export interface MockTestQuestion {
    id: string;
    mockTestId: string;
    type: QuestionType;
    prompt: string;
    orderIndex: number;
    points: number;
    explanation?: string;
    // For SQL_QUERY:
    databaseId?: string;
    solutionQuery?: string;
    initialQuery?: string;
    // For MULTIPLE_CHOICE:
    options?: QuestionOption[];
}

export interface MockTest {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    passingScore: number;
    maxScore: number;
    isPublished: boolean;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    questionsCount: number;
    createdAt: string;
    updatedAt: string;
}

// History module types
export interface TestSessionHistory {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string;
    mockTestId: string;
    mockTestTitle: string;
    score: number;
    maxScore: number;
    isPassed: boolean;
    durationSeconds: number;
    startedAt: string;
    submittedAt: string;
    correctAnswersCount: number;
    totalQuestionsCount: number;
}
