import { useState } from 'react';

const useHuggingFaceService = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState(null);

    // Function to make the API request for text generation
    const generateText = async (prompt, maxLength = 100, temperature = 0.7) => {
        setLoading(true);
        setError(null);
        setResult(null);
        
        try {
            const response = await fetch('/api/text-generation/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, max_length: maxLength, temperature }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setResult(data.response);
            } else {
                setError(data.message || 'An error occurred during text generation');
            }
        } catch (err) {
            setError('Failed to generate text');
        } finally {
            setLoading(false);
        }
    };

    // Function to make the API request for summarization
    const summarizeText = async (file, maxLength = 150, minLength = 50) => {
        setLoading(true);
        setError(null);
        setResult(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('max_length', maxLength.toString());
            formData.append('min_length', minLength.toString());
            
            const response = await fetch('/api/summarization/', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setResult(data.response);
            } else {
                setError(data.message || 'An error occurred during summarization');
            }
        } catch (err) {
            setError('Failed to summarize text');
        } finally {
            setLoading(false);
        }
    };

    // Function to make the API request for question generation
    const generateQuestions = async (context, numQuestions = 5) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/question-generation/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context, num_questions: numQuestions }),
            });
            
            const data = await response.json();

            if (response.ok) {
                setResult(data.questions);
            } else {
                setError(data.message || 'An error occurred during question generation');
            }
        } catch (err) {
            setError('Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        result,
        generateText,
        summarizeText,
        generateQuestions,
    };
};

export default useHuggingFaceService;
