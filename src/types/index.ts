export interface Exam {
    id: string;
    name: string;
    fullName: string;
    description: string;
}

export interface Question {
    id: string;
    exam: string;
    year: string;
    category: string;
    level: 'easy' | 'medium' | 'hard';
    question_en: string;
    question_hi: string;
    options_en: string[];
    options_hi: string[];
    answer: number; // Index of the correct option (0-3)
    tags: string[];
    created_at: number;
    explanation_en?: string;
    explanation_hi?: string;
}

export interface User {
    uid: string;
    email: string | null;
}
