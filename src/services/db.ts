import { ref, get, set, remove } from 'firebase/database';
import { db } from './firebase';
import type { Exam, Question } from '../types';

// Exams
export const getExams = async (): Promise<Exam[]> => {
    const snapshot = await get(ref(db, 'Exams'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
    }
    return [];
};

export const saveExam = async (exam: Exam) => {
    await set(ref(db, `Exams/${exam.id}`), exam);
};

export const deleteExam = async (examId: string) => {
    await remove(ref(db, `Exams/${examId}`));
};

// Questions
export const getQuestions = async (): Promise<Question[]> => {
    const snapshot = await get(ref(db, 'questions'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
    }
    return [];
};

export const saveQuestion = async (question: Question) => {
    // If id is not provided, generate one (though usually we might want a specific format)
    // For this app, let's assume the ID is generated or provided in the form
    await set(ref(db, `questions/${question.id}`), question);
};

export const deleteQuestion = async (questionId: string) => {
    await remove(ref(db, `questions/${questionId}`));
};
