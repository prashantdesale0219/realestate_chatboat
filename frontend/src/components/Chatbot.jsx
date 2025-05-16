import { useState, useEffect, useRef } from 'react';
import '../styles/Chatbot.css';
import ChatSidebar from './ChatSidebar';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { useLayoutEffect } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { FiSend, FiPlusCircle, FiMessageSquare, FiMoon, FiSun } from 'react-icons/fi';

// Helper function to format message content with enhanced Notion-like styling
const formatMessageContent = (content) => {
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const withLinks = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Format bullet points
  let formatted = withLinks;
  formatted = formatted.replace(/^\s*[-*]\s(.+)$/gm, '<div class="notion-list-item">• $1</div>');
  
  // Format numbered listsm, '<div class="notion-numbered-item">$1. $2</div>');
  
  // Format text highlights (==hig$1. hlighted text==)
  formatted = formatted.replace(/==([^=]+)==/g, '<span class="notion-highlight">$1</span>');
  
  // Format dividers (---)
  formatted = formatted.replace(/^---$/gm, '<div class="notion-divider"></div>');
  
  // Format quotes (> quoted text)
  formatted = formatted.replace(/^>\s(.+)$/gm, '<div class="notion-quote">$1</div>');
  
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

// Helper component for rendering Notion-style headings
const NotionHeading = ({ level, children }) => {
  const HeadingTag = `h${level}`;
  return (
    <HeadingTag className={`notion-heading notion-heading-${level}`}>
      {children}
    </HeadingTag>
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
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };
  
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
      message: 'Hello! I am your Real Estate assistant. I\'m ready to answer any questions you might have in any language. You can ask me about buying or selling property, investments, home loans, or any other real estate related topics.',
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
      message: 'Hello! I am your Real Estate assistant. I\'m ready to answer any questions you might have in any language. You can ask me about buying or selling property, investments, home loans, or any other real estate related topics.',
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

  // Handle deleting a specific chat
  const handleDeleteChat = (conversationId) => {
    // Filter out the conversation to be deleted
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    
    // Filter out messages belonging to the deleted conversation
    const updatedMessages = messages.filter(msg => msg.conversationId !== conversationId);
    
    setConversations(updatedConversations);
    setMessages(updatedMessages);
    
    // If we're deleting the active conversation, switch to another one or create a new chat
    if (conversationId === activeConversationId) {
      if (updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
      } else {
        handleNewChat();
      }
    }
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

  // Reference for input field
  const inputRef = useRef(null);

  // Auto focus input field after component mounts and after sending message
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

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
    
    // Focus on input field after sending message
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check if the query is related to real estate properties
    const isPropertyQuery = /property|flat|apartment|house|plot|land|buy|sell|rent|lease|price|cost|rate|location|area|sq\.ft|square feet|bhk|bedroom|vesu|surat/i.test(input);

    // If it's a property query, try to get specific property information first
    if (isPropertyQuery) {
      try {
        console.log('Detected property query, attempting Google Search API...');
        // First try to get specific property information using Google Search API
        const propertySearchResults = await performPropertySearch(input);
        
        if (propertySearchResults) {
          console.log('Successfully retrieved property search results');
          const botMessage = {
            sender: 'bot',
            message: propertySearchResults,
            timestamp: new Date(),
            conversationId: activeConversationId
          };
          
          setMessages(prevMessages => [...prevMessages, botMessage]);
          setIsLoading(false);
          return; // Exit early as we've handled the response with property search
        } else {
          console.log('No property search results found, falling back to regular flow');
        }
      } catch (searchError) {
        console.error('Error with property search:', searchError);
        // Add a user-friendly error message
        const errorMessage = {
          sender: 'bot',
          message: 'मुझे Google सर्च API से डेटा प्राप्त करने में समस्या हो रही है। कृपया अपनी .env फाइल में API कुंजी और CX मान की जांच करें।\n\nTechnical details: ' + searchError.message,
          timestamp: new Date(),
          conversationId: activeConversationId
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsLoading(false);
        return; // Exit early as we've handled the error
      }
    }

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
        // Handle error but provide a more helpful response
        console.error('Error from server:', data.error);
        
        // Use web search to try to answer the query instead of showing an error
        try {
          const searchQuery = `real estate ${input}`;
          // Use Google Search API for real estate queries
          const googleApiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
          // Check if API key is available
          if (!googleApiKey) {
            console.error('Google API Key is missing. Please check your .env file');
            throw new Error('Google API Key is missing');
          }
          // Handle both formats of CX (with or without 'cx=' prefix)
          const googleCx = process.env.REACT_APP_GOOGLE_SEARCH_CX.includes('cx=') ? 
            process.env.REACT_APP_GOOGLE_SEARCH_CX.split('cx=')[1] : 
            process.env.REACT_APP_GOOGLE_SEARCH_CX;
          const searchResponse = await fetch(`https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(searchQuery)}`);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            let helpfulResponse = "I found the following information for your query:\n\n";
            
            if (searchData.items && searchData.items.length > 0) {
              // Extract useful information from search results
              searchData.items.slice(0, 5).forEach(result => {
                helpfulResponse += `### ${result.title}\n${result.snippet}\n\n`;
              });
              
              helpfulResponse += "\nWould you like to know more about any specific information? I'm here to help.";
              
              const botMessage = {
                sender: 'bot',
                message: helpfulResponse,
                timestamp: new Date(),
                conversationId: activeConversationId
              };
              
              setMessages(prevMessages => [...prevMessages, botMessage]);
              return; // Exit early as we've handled the response
            }
          }
        } catch (searchError) {
          console.error('Error with search fallback:', searchError);
        }
        
        // If search fails or no results, provide a friendly response with API status information
        let errorMessage = 'मैं आपके प्रश्न का उत्तर देने के लिए अपनी पूरी क्षमता का उपयोग कर रहा हूँ। कृपया अधिक विवरण प्रदान करें या अलग तरीके से पूछने का प्रयास करें ताकि मैं आपकी बेहतर सहायता कर सकूँ।';
        
        // Add API status information if there was an error with the Google Search API
        if (searchError) {
          console.error('Google Search API error details:', searchError);
          errorMessage += '\n\nGoogle सर्च API से डेटा प्राप्त करने में समस्या हुई है। कृपया सुनिश्चित करें कि आपकी .env फाइल में सही API कुंजी और CX मान हैं।';
        }
        
        const helpfulMessage = {
          sender: 'bot',
          message: errorMessage,
          timestamp: new Date(),
          conversationId: activeConversationId
        };
        setMessages(prevMessages => [...prevMessages, helpfulMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide a more helpful and bilingual response for network errors
      const friendlyMessage = {
        sender: 'bot',
        message: 'I\'m having trouble connecting to the server, but I\'m here to help. You can try asking your question again or try again in a little while. In the meantime, feel free to explore other real estate topics!',
        timestamp: new Date(),
        conversationId: activeConversationId
      };
      setMessages(prevMessages => [...prevMessages, friendlyMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Context management to track conversation history and prevent repetitive questions
  const [conversationContext, setConversationContext] = useState({});

  // Function to analyze conversation context and avoid repetitive questions
  const analyzeConversationContext = (conversationId, userMessage) => {
    // Initialize context for this conversation if it doesn't exist
    if (!conversationContext[conversationId]) {
      conversationContext[conversationId] = {
        topics: new Set(),
        askedQuestions: new Set(),
        userPreferences: {},
        lastInteractionTime: new Date(),
        interactionCount: 0
      };
    }

    const context = conversationContext[conversationId];
    context.lastInteractionTime = new Date();
    context.interactionCount += 1;

    // Extract topics from user message
    const topicKeywords = [
      'property', 'flat', 'apartment', 'house', 'plot', 'land', 'buy', 'sell', 'rent',
      'price', 'cost', 'budget', 'location', 'area', 'bhk', 'bedroom', 'loan', 'mortgage',
      'investment', 'return', 'legal', 'document', 'registration', 'stamp duty', 'tax'
    ];

    // Check for topics in user message
    topicKeywords.forEach(keyword => {
      if (userMessage.toLowerCase().includes(keyword)) {
        context.topics.add(keyword);
      }
    });

    // Extract user preferences
    const locationMatch = userMessage.match(/(?:in|at|near|around|vesu|वेसु|surat|सूरत)\s+([\w\s]+)/i);
    const propertyTypeMatch = userMessage.match(/(?:flat|apartment|house|villa|plot|land|फ्लैट|अपार्टमेंट|मकान|विला|प्लॉट|ज़मीन)/i);
    const bedroomMatch = userMessage.match(/(\d+)\s*(?:bhk|bedroom|bed|बेडरूम)/i);
    const budgetMatch = userMessage.match(/(?:budget|price|cost|under|below|around|₹|rs\.?|inr)\s*(\d+(?:\.\d+)?\s*(?:k|l|lakh|cr|crore|लाख|करोड़)?)/i);

    if (locationMatch) context.userPreferences.location = locationMatch[1] || locationMatch[0];
    if (propertyTypeMatch) context.userPreferences.propertyType = propertyTypeMatch[0];
    if (bedroomMatch) context.userPreferences.bedrooms = bedroomMatch[1];
    if (budgetMatch) context.userPreferences.budget = budgetMatch[0];

    // Add this question to asked questions to avoid repetition
    context.askedQuestions.add(userMessage.toLowerCase());

    // Update the context
    setConversationContext({...conversationContext, [conversationId]: context});
    return context;
  };

  // Function to generate dynamic follow-up questions based on context
  const generateFollowUpQuestions = (context) => {
    const followUps = [];
    
    // If user has shown interest in property but hasn't specified location
    if ((context.topics.has('property') || context.topics.has('flat') || 
         context.topics.has('house') || context.topics.has('apartment')) && 
        !context.userPreferences.location) {
      followUps.push('आप किस स्थान पर प्रॉपर्टी देख रहे हैं?');
    }
    
    // If user has shown interest in property but hasn't specified budget
    if ((context.topics.has('property') || context.topics.has('buy') || 
         context.topics.has('investment')) && !context.userPreferences.budget) {
      followUps.push('आपका बजट क्या है?');
    }
    
    // If user has shown interest in property but hasn't specified type
    if ((context.topics.has('property') || context.topics.has('buy')) && 
        !context.userPreferences.propertyType) {
      followUps.push('आप किस प्रकार की प्रॉपर्टी में रुचि रखते हैं? (फ्लैट, विला, प्लॉट आदि)');
    }
    
    // If user has shown interest in investment
    if (context.topics.has('investment') && context.interactionCount > 1) {
      followUps.push('क्या आप रियल एस्टेट में निवेश के बारे में अधिक जानकारी चाहते हैं?');
    }
    
    // If user has shown interest in loans
    if (context.topics.has('loan') || context.topics.has('mortgage')) {
      followUps.push('क्या आप होम लोन के विभिन्न विकल्पों के बारे में जानना चाहते हैं?');
    }
    
    // Select a random follow-up question to avoid repetition
    if (followUps.length > 0) {
      const randomIndex = Math.floor(Math.random() * followUps.length);
      return followUps[randomIndex];
    }
    
    // Default follow-up if no specific context is available
    return 'क्या आप रियल एस्टेट से संबंधित कोई अन्य जानकारी चाहते हैं?';
  };

  // Function to perform property-specific search with improved context awareness
  const performPropertySearch = async (query) => {
    try {
      // Analyze conversation context
      const context = analyzeConversationContext(activeConversationId, query);
      
      // Extract location, property type, and budget from query and context
      const locationMatch = query.match(/(?:in|at|near|around|vesu|वेसु|surat|सूरत)\s+([\w\s]+)/i);
      const propertyTypeMatch = query.match(/(?:flat|apartment|house|villa|plot|land|फ्लैट|अपार्टमेंट|मकान|विला|प्लॉट|ज़मीन)\s+([\w\s]+)/i);
      const bedroomMatch = query.match(/(\d+)\s*(?:bhk|bedroom|bed|बेडरूम)/i);
      const budgetMatch = query.match(/(?:budget|price|cost|under|below|around|₹|rs\.?|inr)\s*(\d+(?:\.\d+)?\s*(?:k|l|lakh|cr|crore|लाख|करोड़)?)/i);
      
      // Format search query with extracted information and context
      let searchQuery = 'real estate property';
      
      // Use location from current query or from context if available
      if (locationMatch && locationMatch[1]) {
        searchQuery += ` in ${locationMatch[1]}`;
      } else if (query.toLowerCase().includes('vesu') || query.includes('वेसु')) {
        searchQuery += ' in Vesu Surat';
      } else if (query.toLowerCase().includes('surat') || query.includes('सूरत')) {
        searchQuery += ' in Surat';
      } else if (context.userPreferences.location) {
        searchQuery += ` in ${context.userPreferences.location}`;
      }
      
      // Use property type from current query or from context if available
      if (propertyTypeMatch && propertyTypeMatch[0]) {
        searchQuery += ` ${propertyTypeMatch[0]}`;
      } else if (context.userPreferences.propertyType) {
        searchQuery += ` ${context.userPreferences.propertyType}`;
      }
      
      // Use bedroom info from current query or from context if available
      if (bedroomMatch && bedroomMatch[1]) {
        searchQuery += ` ${bedroomMatch[1]} BHK`;
      } else if (context.userPreferences.bedrooms) {
        searchQuery += ` ${context.userPreferences.bedrooms} BHK`;
      }
      
      // Use budget from current query or from context if available
      if (budgetMatch && budgetMatch[1]) {
        searchQuery += ` budget ${budgetMatch[1]}`;
      } else if (query.includes('80') && (query.includes('lakh') || query.includes('lakhs') || query.includes('लाख'))) {
        searchQuery += ' budget 80 lakhs';
      } else if (context.userPreferences.budget) {
        searchQuery += ` budget ${context.userPreferences.budget}`;
      }
      
      // Perform the search using Google Search API for better real estate results
      const googleApiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
      // Check if API key is available
      if (!googleApiKey) {
        console.error('Google API Key is missing. Please check your .env file');
        throw new Error('Google API Key is missing');
      }
      // Handle both formats of CX (with or without 'cx=' prefix)
      const googleCx = process.env.REACT_APP_GOOGLE_SEARCH_CX.includes('cx=') ? 
        process.env.REACT_APP_GOOGLE_SEARCH_CX.split('cx=')[1] : 
        process.env.REACT_APP_GOOGLE_SEARCH_CX;
      
      console.log('Searching with query:', searchQuery);
      console.log('Using API key:', googleApiKey ? 'Available' : 'Missing');
      console.log('Using CX:', googleCx ? 'Available' : 'Missing');
      
      const searchResponse = await fetch(`https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(searchQuery)}`);
      
      if (!searchResponse.ok) {
        throw new Error('Search API request failed');
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return null; // No results found
      }
      
      // Format the response in a helpful way
      let response = `### प्रॉपर्टी विकल्प\n\n`;
      response += `आपकी जानकारी के अनुसार, मैंने निम्नलिखित प्रॉपर्टी विकल्प पाए हैं:\n\n`;
      
      // Add property listings from search results
      searchData.items.slice(0, 5).forEach((item, index) => {
        // Clean up the title and snippet
        const title = item.title.replace(/\s+/g, ' ').trim();
        const snippet = item.snippet.replace(/\s+/g, ' ').trim();
        
        response += `#### विकल्प ${index + 1}: ${title}\n`;
        response += `${snippet}\n\n`;
        
        // Extract and add price information if available
        const priceMatch = (title + ' ' + snippet).match(/(₹|Rs\.?|INR)\s*(\d+(?:\.\d+)?\s*(?:K|L|Lakh|Lakhs|Cr|Crore)?)/i);
        if (priceMatch) {
          response += `**कीमत:** ${priceMatch[0]}\n\n`;
        }
        
        // Add source link
        response += `[अधिक जानकारी के लिए यहां क्लिक करें](${item.link})\n\n`;
      });
      
      // Add a helpful conclusion with dynamic follow-up based on context
      response += `### अतिरिक्त जानकारी\n\n`;
      
      // Add personalized follow-up question based on conversation context
      const followUpQuestion = generateFollowUpQuestions(context);
      response += `${followUpQuestion}\n\n`;
      
      response += `आप निम्न के बारे में भी पूछ सकते हैं:\n\n`;
      response += `- किसी विशेष प्रॉपर्टी के बारे में अधिक जानकारी\n`;
      response += `- आसपास की सुविधाएं और बुनियादी ढांचा\n`;
      response += `- होम लोन और वित्तपोषण विकल्प\n`;
      response += `- प्रॉपर्टी दस्तावेज और कानूनी प्रक्रिया\n\n`;
      
      return response;
    } catch (error) {
      console.error('Error in property search:', error);
      return null; // Return null to fall back to regular flow
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
        onDeleteChat={handleDeleteChat}
      />
      
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2><FiMessageSquare className="header-icon" /> Real Estate Assistant</h2>
          <div className="chatbot-subtitle">
            <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <span>AI Chat</span>
          </div>
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
                        },
                        h1: ({ node, children, ...props }) => {
                          return <NotionHeading level={1}>{children}</NotionHeading>;
                        },
                        h2: ({ node, children, ...props }) => {
                          return <NotionHeading level={2}>{children}</NotionHeading>;
                        },
                        h3: ({ node, children, ...props }) => {
                          return <NotionHeading level={3}>{children}</NotionHeading>;
                        },
                        p: ({ node, children, ...props }) => {
                          return <p className="notion-paragraph">{children}</p>;
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
              ref={inputRef}
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
