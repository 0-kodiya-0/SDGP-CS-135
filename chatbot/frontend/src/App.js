import React from 'react';
import Chat from './components/Chat';
import './index.css';

function App() {
  return (
    <div className="App">
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