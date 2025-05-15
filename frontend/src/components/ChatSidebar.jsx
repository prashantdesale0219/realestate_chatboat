import { useState } from 'react';
import '../styles/ChatSidebar.css';

const ChatSidebar = ({ conversations, onNewChat, onSelectChat, onClearHistory, activeConversationId }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`chat-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={onNewChat}>
          <span className="plus-icon">+</span> New Chat
        </button>
        <button className="toggle-button" onClick={toggleSidebar}>
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="conversations-list">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className={`conversation-item ${conversation.id === activeConversationId ? 'active' : ''}`}
            onClick={() => onSelectChat(conversation.id)}
          >
            <span className="conversation-icon">💬</span>
            <span className="conversation-title">
              {conversation.title || 'New Chat'}
            </span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="clear-history-button" onClick={onClearHistory}>
          <span className="trash-icon">🗑️</span> Clear All Chats
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;