import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { Save, Upload, AlertCircle, Check, Bot } from 'lucide-react';
import { saveQuestion } from '../services/db';
import type { Question } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import worker using Vite's ?url suffix
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFExtractor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [baseId, setBaseId] = useState('');
    const [extractedQuestions, setExtractedQuestions] = useState<Record<string, Question>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [progressMsg, setProgressMsg] = useState('');
    const [rawText, setRawText] = useState('');

    // Gemini State
    // TODO: Replace with your actual API key or use import.meta.env.VITE_GEMINI_API_KEY
    const [apiKey] = useState('AIzaSyDUhJ0ajetHaFDkSQ7dHYEGCQuohw_6o1c');
    const [useGemini, setUseGemini] = useState(false);
    const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
            setSuccessMsg('');
        }
    };

    const extractWithGemini = async (pdf: any) => {
        if (!apiKey) {
            throw new Error("API Key is required for Gemini extraction");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: geminiModel });

        let allQuestions: Record<string, Question> = {};

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            setProgressMsg(`Processing page ${pageNum}/${pdf.numPages} with Gemini...`);

            try {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) continue;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

                const prompt = `
                Extract multiple-choice questions from this image. 
                Return a JSON array of objects.
                Each object should have:
                - id: Generate a unique ID based on "${baseId}", page number ${pageNum}, and question number. Format: "${baseId}_P${pageNum}_Q{number}"
                - question_en: English question text
                - question_hi: Hindi question text (if available, else null)
                - options_en: Array of English options
                - options_hi: Array of Hindi options (if available, else null)
                - answer: The correct answer index (1-based: 1=A, 2=B, 3=C, 4=D). If not marked, set to 0.
                - year: "${baseId.split('_')[2] || new Date().getFullYear()}"
                - exam: "${baseId.split('_')[1]?.toUpperCase() || 'UNKNOWN'}"
                - subject: "General"
                
                Important:
                - Handle bilingual questions (English and Hindi side-by-side or stacked).
                - If a question is split across columns, combine it.
                - Ignore headers/footers.
                - Return ONLY the JSON array, no markdown formatting.
                `;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: "image/jpeg",
                        },
                    },
                ]);

                const response = await result.response;
                const text = response.text();

                // Clean markdown if present
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    const questions = JSON.parse(jsonStr);

                    if (Array.isArray(questions)) {
                        questions.forEach((q: any) => {
                            const qId = q.id || `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                            allQuestions[qId] = {
                                id: qId,
                                exam: q.exam || 'UNKNOWN',
                                year: q.year || '2024',
                                category: q.subject || 'General',
                                level: 'medium',
                                answer: q.answer || 1,
                                tags: [],
                                created_at: Date.now(),
                                question_en: q.question_en || "Text not extracted",
                                question_hi: q.question_hi || "",
                                options_en: q.options_en || [],
                                options_hi: q.options_hi || []
                            };
                        });
                    }
                } catch (parseError) {
                    console.error('Failed to parse Gemini response:', text);
                }

            } catch (pageError: any) {
                console.error(`Error processing page ${pageNum}:`, pageError);
            }
        }

        return allQuestions;
    };

    const parseQuestionsFromText = (text: string, baseId: string): Record<number, Partial<Question>> => {
        const questionsMap: Record<number, Partial<Question>> = {};

        // Split text into lines
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        // Multiple question number patterns
        const questionPatterns = [
            /^(\d+)\.\s*/,           // "1. "
            /^Q\.?\s*(\d+)[\.)]?\s*/, // "Q.1" or "Q 1." or "Q1)"
            /^\[(\d+)\]\s*/,          // "[1] "
            /^Question\s+(\d+)[\.:]?\s*/i, // "Question 1:"
        ];

        // Option patterns
        const optionPatterns = [
            /^\(([a-dA-D])\)\s*/,     // "(a) "
            /^([a-dA-D])\)\s*/,       // "a) "
            /^([a-dA-D])\.\s*/,       // "a. "
            /^\[([a-dA-D])\]\s*/,     // "[a] "
        ];

        let currentQNum: number | null = null;
        let currentText = '';
        let currentOptions: string[] = [];
        let isCurrentHindi = false;

        const processCurrentQuestion = () => {
            if (currentQNum !== null && currentText) {
                if (!questionsMap[currentQNum]) {
                    questionsMap[currentQNum] = {
                        id: `${baseId}_${String(currentQNum).padStart(3, '0')}`,
                        exam: baseId.split('_')[1]?.toUpperCase() || 'UNKNOWN',
                        year: baseId.split('_')[2] || new Date().getFullYear().toString(),
                        category: 'General',
                        level: 'medium',
                        answer: 1,
                        tags: [],
                        created_at: Date.now(),
                        options_en: [],
                        options_hi: [],
                        question_en: '',
                        question_hi: ''
                    };
                }

                const qObj = questionsMap[currentQNum];

                if (isCurrentHindi) {
                    if (!qObj.question_hi) qObj.question_hi = currentText;
                    if (currentOptions.length > 0 && (!qObj.options_hi || qObj.options_hi.length === 0)) {
                        qObj.options_hi = currentOptions;
                    }
                } else {
                    if (!qObj.question_en) qObj.question_en = currentText;
                    if (currentOptions.length > 0 && (!qObj.options_en || qObj.options_en.length === 0)) {
                        qObj.options_en = currentOptions;
                    }
                }
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this is a question number
            let questionMatch = null;
            let matchedPattern = null;

            for (const pattern of questionPatterns) {
                const match = line.match(pattern);
                if (match) {
                    questionMatch = match;
                    matchedPattern = pattern;
                    break;
                }
            }

            if (questionMatch) {
                // Save previous question
                processCurrentQuestion();

                // Start new question
                currentQNum = parseInt(questionMatch[1], 10);
                currentText = line.replace(matchedPattern!, '').trim();
                currentOptions = [];
                isCurrentHindi = /[\u0900-\u097F]/.test(currentText);
                continue;
            }

            // Check if this is an option
            if (currentQNum !== null) {
                let optionMatch = null;
                let matchedOptionPattern = null;

                for (const pattern of optionPatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        optionMatch = match;
                        matchedOptionPattern = pattern;
                        break;
                    }
                }

                if (optionMatch) {
                    const optionText = line.replace(matchedOptionPattern!, '').trim();
                    currentOptions.push(optionText);
                    continue;
                }

                // Otherwise, it's continuation of question text
                if (currentOptions.length === 0) {
                    currentText += ' ' + line;
                    // Update language detection
                    if (/[\u0900-\u097F]/.test(line)) {
                        isCurrentHindi = true;
                    }
                }
            }
        }

        // Process last question
        processCurrentQuestion();

        return questionsMap;
    };

    const parsePDF = async () => {
        if (!file || !baseId) {
            setError('Please select a file and provide a Base ID.');
            return;
        }

        if (useGemini && !apiKey) {
            setError('Please provide a Gemini API Key.');
            return;
        }

        setLoading(true);
        setError('');
        setExtractedQuestions({});
        setRawText('');
        setProgressMsg('Loading PDF...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            if (useGemini) {
                const geminiQuestions = await extractWithGemini(pdf);
                if (Object.keys(geminiQuestions).length === 0) {
                    setError('No questions extracted with Gemini. Check API key or PDF content.');
                } else {
                    setExtractedQuestions(geminiQuestions);
                    setSuccessMsg(`Extracted ${Object.keys(geminiQuestions).length} questions using Gemini!`);
                }
            } else {
                // Legacy Regex Extraction
                let allText = '';

                // Extract text from all pages
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    setProgressMsg(`Extracting text from page ${pageNum}/${pdf.numPages}...`);

                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    // Get text items and sort by position (top to bottom, left to right)
                    const textItems = textContent.items as any[];
                    textItems.sort((a, b) => {
                        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
                        // If on same line (y position similar), sort by x position
                        if (yDiff < 5) {
                            return a.transform[4] - b.transform[4];
                        }
                        // Otherwise sort by y position (top to bottom, note: PDF coords are bottom-up)
                        return b.transform[5] - a.transform[5];
                    });

                    // Concatenate text with proper spacing
                    let pageText = '';
                    let lastY = -1;

                    for (const item of textItems) {
                        const y = item.transform[5];
                        const text = item.str;

                        // New line if Y position changed significantly
                        if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                            pageText += '\n';
                        } else if (pageText && !pageText.endsWith(' ')) {
                            pageText += ' ';
                        }

                        pageText += text;
                        lastY = y;
                    }

                    allText += pageText + '\n\n';
                }

                setProgressMsg('Parsing questions...');
                setRawText(allText); // Save for debugging/preview

                // Parse the extracted text into questions
                const questionsMap = parseQuestionsFromText(allText, baseId);

                // Convert map to final questions
                const finalQuestions: Record<string, Question> = {};
                Object.values(questionsMap).forEach((q) => {
                    if (q.id) {
                        const finalQ = q as Question;
                        // Ensure all required fields are present
                        if (!finalQ.question_en) finalQ.question_en = "Text not extracted";
                        if (!finalQ.question_hi) finalQ.question_hi = "Text not extracted";
                        if (!finalQ.options_en || finalQ.options_en.length === 0) {
                            finalQ.options_en = ["Option A", "Option B", "Option C", "Option D"];
                        }
                        if (!finalQ.options_hi || finalQ.options_hi.length === 0) {
                            finalQ.options_hi = ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
                        }
                        finalQuestions[finalQ.id] = finalQ;
                    }
                });

                if (Object.keys(finalQuestions).length === 0) {
                    setError('No questions extracted. Please check the PDF format.');
                } else {
                    setExtractedQuestions(finalQuestions);
                    setSuccessMsg(`Extracted ${Object.keys(finalQuestions).length} questions!`);
                }
            }

        } catch (err: any) {
            console.error(err);
            setError('Failed to parse PDF: ' + err.message);
        } finally {
            setLoading(false);
            setProgressMsg('');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const promises = Object.values(extractedQuestions).map(q => saveQuestion(q));
            await Promise.all(promises);
            setSuccessMsg(`Successfully saved ${Object.keys(extractedQuestions).length} questions!`);
            setExtractedQuestions({});
        } catch (err: any) {
            setError('Failed to save questions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Question Extractor (OCR)</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base ID (e.g., q_uppsc_2024_gs)</label>
                        <input
                            type="text"
                            value={baseId}
                            onChange={(e) => setBaseId(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            placeholder="q_exam_year_subject"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF</label>
                        <div className="flex items-center space-x-2">
                            <label className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-4 flex items-center shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Upload className="h-5 w-5 mr-2 text-gray-500" />
                                <span>Select File</span>
                                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                            </label>
                            <span className="text-sm text-gray-500">{file ? file.name : 'No file chosen'}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Bot className={`h-5 w-5 ${useGemini ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className="font-medium text-gray-900">AI Extraction (Gemini)</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={useGemini}
                                onChange={(e) => setUseGemini(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {useGemini && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <select
                                    value={geminiModel}
                                    onChange={(e) => setGeminiModel(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                >
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Efficient)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Higher Accuracy)</option>
                                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                                    <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (Latest)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
                        <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
                        <Check className="flex-shrink-0 inline w-4 h-4 mr-3" />
                        {successMsg}
                    </div>
                )}

                {progressMsg && (
                    <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50">
                        {progressMsg}
                    </div>
                )}

                <button
                    onClick={parsePDF}
                    disabled={loading || !file || !baseId}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : (useGemini ? 'Extract with Gemini AI' : 'Extract with Legacy OCR')}
                </button>
            </div>

            {rawText && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Extracted Text Preview</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[400px]">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                            {rawText}
                        </pre>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        This is the raw text extracted from your PDF. Check if it looks correct before reviewing parsed questions.
                    </p>
                </div>
            )}

            {Object.keys(extractedQuestions).length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Preview ({Object.keys(extractedQuestions).length} Questions)</h2>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Save className="h-5 w-5" />
                            <span>Save to Firebase</span>
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[600px]">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                            {JSON.stringify(extractedQuestions, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDFExtractor;
