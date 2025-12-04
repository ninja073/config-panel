import React, { useEffect, useState } from 'react';
import { getQuestions, saveQuestion, deleteQuestion, getExams } from '../services/db';
import type { Question, Exam } from '../types';
import { Plus, Edit, Trash2, X, Save, Filter } from 'lucide-react';

const Questions: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

    // Filter state
    const [selectedExam, setSelectedExam] = useState<string>('all');

    const initialFormState: Question = {
        id: '',
        exam: '',
        year: new Date().getFullYear().toString(),
        category: '',
        level: 'medium',
        question_en: '',
        question_hi: '',
        options_en: ['', '', '', ''],
        options_hi: ['', '', '', ''],
        answer: 0,
        tags: [],
        created_at: Date.now(),
        explanation_en: '',
        explanation_hi: ''
    };

    const [formData, setFormData] = useState<Question>(initialFormState);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [questionsData, examsData] = await Promise.all([getQuestions(), getExams()]);
            setQuestions(questionsData);
            setExams(examsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Subject short forms mapping
    const SUBJECT_SHORT_FORMS: Record<string, string> = {
        'History': 'HIST',
        'Geography': 'GEO',
        'Polity': 'POL',
        'Economy': 'ECO',
        'Science & Tech': 'SCI',
        'Ethics': 'ETH',
        'General Studies': 'GS'
    };

    const generateQuestionId = (examId: string, year: string, category: string) => {
        const examCode = examId.split('_')[1]?.toUpperCase() || 'EXAM'; // Assuming exam id format like 'exam_uppsc_...'
        const subCode = SUBJECT_SHORT_FORMS[category] || 'GEN';
        const randomStr = crypto.randomUUID().split('-')[0];
        return `q_${examCode}_${year}_${subCode}_${randomStr}`;
    };

    const handleOpenModal = (question?: Question) => {
        if (question) {
            setCurrentQuestion(question);
            setFormData(question);
        } else {
            setCurrentQuestion(null);
            setFormData({ ...initialFormState, id: '' }); // ID will be generated on save
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentQuestion(null);
        setTagInput('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionChange = (lang: 'en' | 'hi', index: number, value: string) => {
        setFormData(prev => {
            const newOptions = lang === 'en' ? [...prev.options_en] : [...prev.options_hi];
            newOptions[index] = value;
            return {
                ...prev,
                [lang === 'en' ? 'options_en' : 'options_hi']: newOptions
            };
        });
    };

    const handleTagAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let questionToSave = { ...formData };

            // Generate ID if it's a new question (empty ID)
            if (!questionToSave.id) {
                questionToSave.id = generateQuestionId(questionToSave.exam, questionToSave.year, questionToSave.category);
            }

            await saveQuestion(questionToSave);
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving question:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await deleteQuestion(id);
                fetchData();
            } catch (error) {
                console.error("Error deleting question:", error);
            }
        }
    };

    const filteredQuestions = selectedExam === 'all'
        ? questions
        : questions.filter(q => q.exam === selectedExam);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            className="border-none bg-transparent focus:ring-0 text-sm text-gray-700"
                        >
                            <option value="all">All Exams</option>
                            {exams.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Question</span>
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question (EN)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredQuestions.map((q) => (
                            <tr key={q.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{q.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.exam} ({q.year})</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={q.question_en}>{q.question_en}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${q.level === 'easy' ? 'bg-green-100 text-green-800' :
                                            q.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {q.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(q)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredQuestions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No questions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {currentQuestion ? 'Edit Question' : 'Add Question'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* ID Field Removed */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Exam</label>
                                        <select
                                            name="exam"
                                            required
                                            value={formData.exam}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        >
                                            <option value="">Select Exam</option>
                                            {exams.map(exam => (
                                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Year</label>
                                        <select
                                            name="year"
                                            required
                                            value={formData.year}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        >
                                            {Array.from({ length: 26 }, (_, i) => 2025 - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <select
                                            name="category"
                                            required
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        >
                                            <option value="">Select Category</option>
                                            {[
                                                'History',
                                                'Geography',
                                                'Polity',
                                                'Economy',
                                                'Science & Tech',
                                                'Ethics',
                                                'General Studies'
                                            ].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Level</label>
                                        <select
                                            name="level"
                                            required
                                            value={formData.level}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Correct Answer (Option Index)</label>
                                        <select
                                            name="answer"
                                            required
                                            value={formData.answer}
                                            onChange={(e) => setFormData(prev => ({ ...prev, answer: parseInt(e.target.value) }))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        >
                                            <option value={0}>Option 1</option>
                                            <option value={1}>Option 2</option>
                                            <option value={2}>Option 3</option>
                                            <option value={3}>Option 4</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* English Section */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-gray-900 border-b pb-2">English</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Question</label>
                                            <textarea
                                                name="question_en"
                                                required
                                                rows={3}
                                                value={formData.question_en}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        {formData.options_en.map((opt, idx) => (
                                            <div key={`en-${idx}`}>
                                                <label className="block text-sm font-medium text-gray-700">Option {idx + 1}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange('en', idx, e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Explanation (English)</label>
                                            <textarea
                                                name="explanation_en"
                                                rows={3}
                                                value={formData.explanation_en || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                placeholder="Explanation in English..."
                                            />
                                        </div>
                                    </div>

                                    {/* Hindi Section */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-gray-900 border-b pb-2">Hindi</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Question</label>
                                            <textarea
                                                name="question_hi"
                                                required
                                                rows={3}
                                                value={formData.question_hi}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        {formData.options_hi.map((opt, idx) => (
                                            <div key={`hi-${idx}`}>
                                                <label className="block text-sm font-medium text-gray-700">Option {idx + 1}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange('hi', idx, e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Explanation (Hindi)</label>
                                            <textarea
                                                name="explanation_hi"
                                                rows={3}
                                                value={formData.explanation_hi || ''}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                placeholder="Explanation in Hindi..."
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tags (Press Enter to add)</label>
                                    <div className="mt-1 flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md">
                                        {formData.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-indigo-600 hover:text-indigo-900">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagAdd}
                                            className="flex-1 outline-none border-none focus:ring-0 text-sm min-w-[100px]"
                                            placeholder="Add tag..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <Save className="h-4 w-4 inline-block mr-2" />
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questions;
