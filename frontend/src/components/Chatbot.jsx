import { useState, useEffect, useRef } from 'react';
import '../styles/Chatbot.css';
import ChatSidebar from './ChatSidebar';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { useLayoutEffect } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { FiSend, FiPlusCircle, FiMessageSquare } from 'react-icons/fi';

// Helper function to format message content with enhanced Notion-like styling
const formatMessageContent = (content) => {
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const withLinks = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Format bullet points
  let formatted = withLinks;
  formatted = formatted.replace(/^\s*[-*]\s(.+)$/gm, '<div class="notion-list-item">• $1</div>');
  
  // Format numbered lists
  formatted = formatted.replace(/^\s*(\d+)\.\s(.+)$/gm, '<div class="notion-numbered-item">$1. $2</div>');
  
  // Add paragraph styling
  const withParagraphs = formatted.split('\n').map(line => 
    line ? (line.startsWith('<div class="notion') ? line : `<p>${line}</p>`) : '<p><br/></p>'
  ).join('');
  
  return withParagraphs;
};

// Helper function to format code blocks with enhanced syntax highlighting
const CodeBlock = ({ language, value }) => {
  return (
    <div className="notion-code-block">
      <div className="notion-code-header">
        <span className="notion-code-language">{language || 'code'}</span>
        <div className="notion-code-actions">
          <button className="notion-code-copy" onClick={() => navigator.clipboard.writeText(value)}>
            Copy
          </button>
        </div>
      </div>
      <pre className="notion-pre">
        <code className={`language-${language || 'text'}`}>{value}</code>
      </pre>
    </div>
  );
};

// Helper component for rendering callouts/blockquotes in Notion style
const NotionCallout = ({ children }) => {
  return (
    <div className="notion-callout">
      <div className="notion-callout-icon">💡</div>
      <div className="notion-callout-content">{children}</div>
    </div>
  );
};

const Chatbot = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Load chat history from localStorage when component mounts
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    const savedMessages = localStorage.getItem('messages');
    const savedUserId = localStorage.getItem('userId');
    
    if (savedConversations && savedMessages) {
      const parsedConversations = JSON.parse(savedConversations);
      const parsedMessages = JSON.parse(savedMessages);
      
      setConversations(parsedConversations);
      setMessages(parsedMessages);
      
      if (parsedConversations.length > 0) {
        setActiveConversationId(parsedConversations[0].id);
      }
      
      if (savedUserId) {
        setUserId(savedUserId);
      }
    } else {
      initializeNewChat();
    }
  }, []);

  // Initialize a new chat conversation
  const initializeNewChat = () => {
    const newConversationId = uuidv4();
    const newConversation = {
      id: newConversationId,
      title: 'New Chat',
      timestamp: new Date()
    };
    
    setConversations([newConversation]);
    setActiveConversationId(newConversationId);
    
    const initialMessage = {
      sender: 'bot',
      message: 'Hello! I am your Real Estate assistant. How can I help you today?',
      timestamp: new Date(),
      conversationId: newConversationId
    };
    
    setMessages([initialMessage]);
    
    // Save to localStorage
    localStorage.setItem('conversations', JSON.stringify([newConversation]));
    localStorage.setItem('messages', JSON.stringify([initialMessage]));
  };

  // Handle viewport resize
  useLayoutEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      // Force scroll to bottom after resize
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Initial update
    updateViewportHeight();
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // Auto-scroll to bottom of messages and save to localStorage when messages change
  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages, viewportHeight]);
  
  // Save conversations to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);
  
  // Save userId to localStorage when it changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Get UI size dimensions
  const getUiSize = () => {
    const container = document.querySelector('.chatbot-container');
    if (container) {
      return {
        width: container.offsetWidth,
        height: container.offsetHeight
      };
    }
    return { width: 400, height: 600 }; // Default fallback values
  };

  // Create a new chat conversation
  const handleNewChat = () => {
    const newConversationId = uuidv4();
    const newConversation = {
      id: newConversationId,
      title: 'New Chat',
      timestamp: new Date()
    };
    
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversationId(newConversationId);
    
    const initialMessage = {
      sender: 'bot',
      message: 'Hello! I am your Real Estate assistant. How can I help you today?',
      timestamp: new Date(),
      conversationId: newConversationId
    };
    
    // Keep existing messages and add the new one
    const updatedMessages = [...messages, initialMessage];
    setMessages(updatedMessages);
    setInput('');
    
    // Save to localStorage
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  // Select an existing conversation
  const handleSelectChat = (conversationId) => {
    setActiveConversationId(conversationId);
    // No need to reset messages as we're now keeping all messages in state
  };

  // Clear all chat history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all chat history?')) {
      // Clear localStorage
      localStorage.removeItem('conversations');
      localStorage.removeItem('messages');
      localStorage.removeItem('userId');
      
      // Initialize a new chat
      initializeNewChat();
      setUserId(null);
    }
  };

  // Update conversation title based on first user message
  useEffect(() => {
    const currentConversation = conversations.find(conv => conv.id === activeConversationId);
    if (currentConversation && currentConversation.title === 'New Chat') {
      const userMessages = messages.filter(msg => msg.conversationId === activeConversationId && msg.sender === 'user');
      if (userMessages.length > 0) {
        const firstUserMessage = userMessages[0].message;
        const title = firstUserMessage.length > 30 ? firstUserMessage.substring(0, 30) + '...' : firstUserMessage;
        const updatedConversations = conversations.map(conv => 
          conv.id === activeConversationId ? {...conv, title} : conv
        );
        setConversations(updatedConversations);
        
        // Save updated conversations to localStorage
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      }
    }
  }, [messages, activeConversationId, conversations]);

  // Send message to backend API
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      sender: 'user',
      message: input,
      timestamp: new Date(),
      conversationId: activeConversationId
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const uiSize = getUiSize();
      const response = await fetch('https://real-estate-server-2ey5.onrender.com/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          userId: userId,
          uiSize: uiSize,
          conversationId: activeConversationId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Save userId if it's a new conversation
        if (!userId && data.userId) {
          setUserId(data.userId);
        }

        // Add bot response to chat
        const botMessage = {
          sender: 'bot',
          message: data.response,
          timestamp: new Date(),
          conversationId: activeConversationId
        };

        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        // Handle error
        console.error('Error from server:', data.error);
        const errorMessage = {
          sender: 'bot',
          message: 'Sorry, I am having trouble processing your request. Please try again.',
          timestamp: new Date(),
          conversationId: activeConversationId
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        sender: 'bot',
        message: 'Sorry, I am having trouble connecting to the server. Please try again later.',
        timestamp: new Date(),
        conversationId: activeConversationId
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter messages for the active conversation
  const activeMessages = messages.filter(msg => msg.conversationId === activeConversationId);

  return (
    <div className="chatbot-layout">
      <ChatSidebar 
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onClearHistory={handleClearHistory}
        activeConversationId={activeConversationId}
      />
      
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2><FiMessageSquare className="header-icon" /> Real Estate Assistant</h2>
          <div className="chatbot-subtitle">Notion-style AI Chat</div>
        </div>
        
        <div className="chatbot-messages notion-scrollbar" ref={messagesContainerRef}>
          {activeMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? '🏠' : '👤'}
              </div>
              <div className="message-bubble">
                {msg.sender === 'bot' ? (
                  <div className="message-content notion-style">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <CodeBlock
                              language={match[1]}
                              value={String(children).replace(/\n$/, '')}
                              {...props}
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ node, children, ...props }) => {
                          return <NotionCallout>{children}</NotionCallout>;
                        },
                        table: ({ node, children, ...props }) => {
                          return <div className="notion-table-container"><table className="notion-table" {...props}>{children}</table></div>;
                        }
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div 
                    className="message-content user-message-content"
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.message) }}
                  />
                )}
                <div className="message-timestamp">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar">🏠</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chatbot-input notion-input">
          <div className="input-container">
            <button 
              className="new-chat-button"
              onClick={handleNewChat}
              title="Start a new chat"
            >
              <FiPlusCircle />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything or type /..."
              disabled={isLoading}
              className="notion-text-input"
            />
            <button 
              className="send-button"
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
            >
              <FiSend />
            </button>
          </div>
          <div className="input-footer">
            <span className="input-tip">💡 Ask questions related to real estate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;