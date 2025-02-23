import React from 'react';
import Chat from './components/Chat';
import './index.css'; // Make sure to import CSS

function App() {
  return (
    <div className="app-container"> {/* Add a container with a class */}
      <header>
        <h1>My Chatbot App</h1>
      </header>
      <main>
        <Chat />
      </main>
    </div>
  );
}

export default App;