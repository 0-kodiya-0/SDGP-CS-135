import { useState, useEffect } from "react";

// Simulated typing effect hook
const useTypingEffect = (text: string, speed = 50) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return displayText;
};

export default useTypingEffect;