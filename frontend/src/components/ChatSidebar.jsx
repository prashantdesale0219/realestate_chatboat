import { useState, useEffect } from 'react';
import '../styles/ChatSidebar.css';

const ChatSidebar = ({ conversations, onNewChat, onSelectChat, onClearHistory, activeConversationId, onDeleteChat }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load sidebar state from localStorage on initial render
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div className={`chat-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-button" onClick={onNewChat}>
            <span className="plus-icon">+</span> New Chat
          </button>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

      <div className="chat-list">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className={`chat-list-item ${conversation.id === activeConversationId ? 'active' : ''}`}
          >
            <div className="chat-icon">💬</div>
            <div className="chat-title" onClick={() => onSelectChat(conversation.id)}>
              {conversation.title || 'New Chat'}
            </div>
            <div className="chat-actions">
              <button 
                className="delete-chat-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(conversation.id);
                }}
                title="Delete this chat"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="clear-history-button" onClick={onClearHistory}>
          <span className="trash-icon">🗑️</span> Clear All Chats
        </button>
      </div>
    </div>
    {isCollapsed && (
      <button className="sidebar-reopen-button" onClick={toggleSidebar} title="Open Sidebar">
        &#8594;
      </button>
    )}
    </>
  );
};

export default ChatSidebar;