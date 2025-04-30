import { useState, useEffect } from "react";

interface TypewriterTextProps {
    messages: string[];
    typingSpeed?: number;
    deleteSpeed?: number;
    pauseDuration?: number;
}

// TypewriterText Component
const TypewriterText: React.FC<TypewriterTextProps> = ({
    messages,
    typingSpeed = 50,
    deleteSpeed = 30,
    pauseDuration = 2000
}) => {
    const [text, setText] = useState('');
    const [messageIndex, setMessageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentMessage = messages[messageIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (text.length < currentMessage.length) {
                    setText(currentMessage.slice(0, text.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                if (text.length > 0) {
                    setText(currentMessage.slice(0, text.length - 1));
                } else {
                    setIsDeleting(false);
                    setMessageIndex((messageIndex + 1) % messages.length);
                }
            }
        }, isDeleting ? deleteSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [text, messageIndex, isDeleting, messages, deleteSpeed, typingSpeed, pauseDuration]);

    return (
        <span className="text-blue-400">
            {text}
            <span className="ml-1 inline-block h-6 w-1 animate-blink bg-blue-400"></span>
        </span>
    );
};

export default TypewriterText;