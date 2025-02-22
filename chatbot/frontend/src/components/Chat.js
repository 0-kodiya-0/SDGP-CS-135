import React, { useState, useEffect, useRef } from 'react';
import '../Chat.css';

function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState(''); // Store file name for display
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event) => {
        if (event.target.files[0]) {
            setFile(event.target.files[0]);
            setFileName(event.target.files[0].name);
            setMessages(prevMessages => [...prevMessages, { text: `File Uploaded: ${event.target.files[0].name}`, sender: 'user' }]);
        }
    };

    const removeFile = () => {
        setFile(null);
        setFileName('');
        setMessages(prevMessages => [...prevMessages, { text: 'File Removed', sender: 'user' }]);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { text: input, sender: 'user' };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', input);
            if (file) {
                formData.append('file', file);
            }
            const history = updatedMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
            formData.append('history', JSON.stringify(history));

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botReply = { text: data.reply, sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, botReply]);

        } catch (error) {
            console.error('Error fetching chatbot response:', error);
            const errorReply = { text: 'Sorry, I encountered an error.', sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, errorReply]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                        {message.text}
                    </div>
                ))}
                {isLoading && <div className="message bot">Thinking...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                />
                {fileName && (
                    <div className="file-info">
                        <span>{fileName}</span>
                        <button onClick={removeFile}>Remove File</button>
                    </div>
                )}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;