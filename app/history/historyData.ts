export type TestStatus = 'passed' | 'failed' | 'timeout';
export type TestDifficulty = 'Dễ' | 'Trung bình' | 'Khó';

export interface QuestionReviewItem {
    questionId: string;
    questionText: string;
    type: 'sql_query' | 'multiple_choice';
    points: number;
    maxPoints: number;
    isCorrect: boolean;
    userAnswer: string;
    solutionAnswer: string;
    explanation: string;
}

export interface MockTestHistoryItem {
    id: string; // Session ID (vd: session-101)
    testId: string; // Mock Test ID (vd: mock-1)
    testTitle: string;
    category: 'E-commerce' | 'University' | 'Hospital' | 'Analytics' | 'Banking' | string;
    difficulty: TestDifficulty;
    submittedAt: string; // Định dạng: "HH:mm - DD/MM/YYYY"
    submittedTimestamp: number; // Dùng để sort chính xác
    timeSpentSeconds: number; // Số giây làm bài thực tế
    durationMinutes: number; // Thời gian quy định (phút)
    correctAnswers: number;
    totalQuestions: number;
    score: number; // Thang 100
    status: TestStatus;
    questionsReview: QuestionReviewItem[];
}

export interface HistorySummaryStats {
    totalAttempts: number;
    averageScore: number;
    passCount: number;
    passRate: number;
    bestScore: number;
    bestTestTitle: string;
    ratingText: string;
}

export interface HistoryFilterState {
    searchTerm: string;
    status: 'all' | TestStatus;
    difficulty: 'all' | TestDifficulty;
    sortBy: 'newest' | 'oldest' | 'highest_score' | 'lowest_score';
}

export const MOCK_HISTORY_DATA: MockTestHistoryItem[] = [];

/**
 * Tính toán nhanh các chỉ số tổng quan từ danh sách lịch sử thi
 */
export function calculateHistoryStats(items: MockTestHistoryItem[]): HistorySummaryStats {
    if (!items || items.length === 0) {
        return {
            totalAttempts: 0,
            averageScore: 0,
            passCount: 0,
            passRate: 0,
            bestScore: 0,
            bestTestTitle: 'Chưa có',
            ratingText: 'Chưa có dữ liệu',
        };
    }

    const totalAttempts = items.length;
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const passCount = items.filter((item) => item.score >= 60).length;
    const passRate = Math.round((passCount / totalAttempts) * 100);

    // Tìm bài thi có điểm cao nhất
    let bestItem = items[0];
    for (const item of items) {
        if (item.score > bestItem.score) {
            bestItem = item;
        }
    }

    let ratingText = 'Xuất sắc';
    if (averageScore < 50) {
        ratingText = 'Cần cố gắng';
    } else if (averageScore < 65) {
        ratingText = 'Trung bình';
    } else if (averageScore < 80) {
        ratingText = 'Khá';
    } else if (averageScore < 90) {
        ratingText = 'Giỏi';
    }

    return {
        totalAttempts,
        averageScore,
        passCount,
        passRate,
        bestScore: bestItem.score,
        bestTestTitle: bestItem.testTitle,
        ratingText,
    };
}
