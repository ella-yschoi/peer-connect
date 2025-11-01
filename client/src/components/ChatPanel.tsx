import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  currentUserId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='flex flex-col h-full liquid-card'>
      {/* Header */}
      <div
        className='p-4'
        style={{ borderBottom: '1px solid rgba(255,255,255,0.18)' }}
      >
        <h3 className='text-lg font-semibold text-ink-900 tracking-tight'>
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {messages.length === 0 ? (
          <div className='text-center text-ink-600 mt-8'>
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-xl shadow-glow ${
                  message.senderId === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'liquid-soft text-black'
                }`}
              >
                <div className='text-sm'>{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === currentUserId
                      ? 'text-blue-100'
                      : 'text-ink-300'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className='p-4'
        style={{ borderTop: '1px solid rgba(255,255,255,0.18)' }}
      >
        <div className='flex gap-2'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Type a message...'
            className='flex-1 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/60 liquid-soft'
          />
          <button
            type='submit'
            disabled={!inputValue.trim()}
            className='px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-glow'
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
