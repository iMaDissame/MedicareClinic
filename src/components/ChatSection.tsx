import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getChats, getChatMessages, sendChatMessage, startChat } from '../services/axiosClient';
import axiosClient from '../services/axiosClient';
import Button from './ui/Button';
import Card from './ui/Card';
import { MessageCircle, Send, User, Users, Clock, AlertCircle, Search, MoreVertical, Phone, Video, ArrowLeft } from 'lucide-react';

const ChatSection = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Scroll management states
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserType = localStorage.getItem('authType');
  const currentUserId = JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
  const isAdmin = currentUserType === 'admin';

  useEffect(() => {
    getChats().then(res => setChats(res.data.data));
    if (currentUserType === 'admin') {
      axiosClient.get('/admin/users').then(res => setUsers(res.data.data));
    } else {
      axiosClient.get('/admins').then(res => setAdmins(res.data.data));
    }
  }, []);

  const handlePartnerClick = async (partner: any) => {
    setSelectedPartner(partner);
    setShowMobileChat(true); // Show chat on mobile
    setIsLoading(true);
    setShouldAutoScroll(true); // Reset auto-scroll when selecting new chat
    setUserHasScrolled(false);
    
    const chat = chats.find(c =>
      (currentUserType === 'admin' && c.user.id === partner.id) ||
      (currentUserType !== 'admin' && c.admin.id === partner.id)
    );
    
    if (chat) {
      setSelectedChat(chat);
      fetchMessages(chat.id);
    } else {
      let res;
      if (currentUserType === 'admin') {
        res = await axiosClient.post('/chats/start', { user_id: partner.id });
      } else {
        res = await axiosClient.post('/chats/start', { admin_id: partner.id });
      }
      setSelectedChat(res.data.data);
      fetchMessages(res.data.data.id);
    }
    setIsLoading(false);
  };

  const fetchMessages = useCallback((chatId: string) => {
    getChatMessages(chatId).then(res => {
      const newMessages = res.data.data;
      setMessages(prevMessages => {
        // Only trigger auto-scroll if it's a new message from someone else
        const hasNewMessages = newMessages.length > prevMessages.length;
        if (hasNewMessages && shouldAutoScroll && !userHasScrolled) {
          setTimeout(() => scrollToBottom(), 100);
        }
        return newMessages;
      });
    });
  }, [shouldAutoScroll, userHasScrolled]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const interval = setInterval(() => fetchMessages(selectedChat.id), 3000);
    return () => clearInterval(interval);
  }, [selectedChat, fetchMessages]);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // If user scrolled up, disable auto-scroll
    if (!isNearBottom && !userHasScrolled) {
      setUserHasScrolled(true);
      setShouldAutoScroll(false);
    }
    
    // If user scrolled back to bottom, enable auto-scroll
    if (isNearBottom && userHasScrolled) {
      setUserHasScrolled(false);
      setShouldAutoScroll(true);
    }
  }, [userHasScrolled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    const messageText = input;
    setInput('');
    setShouldAutoScroll(true); // Auto-scroll for own messages
    setUserHasScrolled(false);
    await sendChatMessage(selectedChat.id, messageText);
    fetchMessages(selectedChat.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partners = currentUserType === 'admin' ? users : admins;
  const filteredPartners = partners.filter(partner =>
    (partner.username || partner.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (partner.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Enhanced message component with beautiful styling
  const MessageBubble = ({ msg, isOwn }: { msg: any, isOwn: boolean }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`group relative max-w-[280px] md:max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-5 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 font-medium ${
            isOwn
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200 rounded-br-md'
              : 'bg-white text-gray-800 border border-pink-100 shadow-pink-100 rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed break-words">{msg.message}</p>
        </div>
        
        <div className={`flex items-center mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            isOwn ? 'text-pink-100' : 'text-gray-500'
          }`}>
            {formatTime(msg.created_at)}
          </span>
        </div>
      </div>
    </div>
  );

  const BackButton = () => (
    <button
      onClick={() => setShowMobileChat(false)}
      className="lg:hidden flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors mb-4 font-medium"
    >
      <ArrowLeft className="h-5 w-5" />
      <span>Back to Agents</span>
    </button>
  );

  // Admin view with enhanced styling
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-pink-700">Chat Management</h1>
                <p className="text-pink-600 mt-2">Communicate with students and provide support</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center lg:text-right">
                  <p className="text-sm text-pink-600">Active Users</p>
                  <p className="text-2xl font-bold text-pink-700">{users.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pink-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-pink-700">{chats.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pink-600">Active Users</p>
                  <p className="text-2xl font-bold text-pink-700">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pink-600">Messages Today</p>
                  <p className="text-2xl font-bold text-pink-700">{messages.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Chat Interface */}
          <div className="lg:hidden">
            {showMobileChat && selectedPartner ? (
              <div className="space-y-4">
                <BackButton />
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-200 h-[calc(100vh-200px)] flex flex-col">
                  {/* Mobile Chat Header */}
                  <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {(selectedPartner.username || selectedPartner.name || '').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-pink-700">
                            {selectedPartner.username || selectedPartner.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-pink-600 font-medium">Online</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-full transition-colors">
                          <Phone className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-full transition-colors">
                          <Video className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Messages Area */}
                  <div 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-pink-50"
                  >
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                          <span className="text-pink-600 font-medium">Loading messages...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="h-8 w-8 text-pink-400" />
                            </div>
                            <p className="text-lg font-bold text-pink-600 mb-2">Start the conversation!</p>
                            <p className="text-pink-500">Send the first message to begin chatting</p>
                          </div>
                        )}
                        {messages.map(msg => (
                          <MessageBubble 
                            key={msg.id} 
                            msg={msg} 
                            isOwn={msg.sender_type === currentUserType && msg.sender_id === currentUserId}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Mobile Input Area */}
                  <div className="p-4 border-t border-pink-200 bg-white">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1 min-h-[40px] max-h-32 bg-gradient-to-r from-pink-50 to-rose-50 rounded-full px-4 py-2 flex items-center border-2 border-pink-200">
                        <input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="flex-1 bg-transparent border-none outline-none placeholder-pink-400 text-sm font-medium"
                        />
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-3 rounded-full transition-all duration-200 shadow-lg transform hover:scale-105 ${
                          input.trim()
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-pink-200'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-200 p-6">
                <h3 className="text-lg font-bold text-pink-700 mb-4">Students ({users.length})</h3>
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-pink-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-4 focus:ring-pink-200 focus:border-pink-400 bg-gradient-to-r from-pink-50 to-rose-50 placeholder-pink-400 font-medium"
                  />
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPartners.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-pink-400" />
                      </div>
                      <h3 className="text-lg font-bold text-pink-600 mb-2">No Students Found</h3>
                      <p className="text-pink-500">
                        {searchTerm ? 'Try adjusting your search' : 'Students will appear here when they join'}
                      </p>
                    </div>
                  ) : (
                    filteredPartners.map(partner => (
                      <div
                        key={partner.id}
                        className="group relative p-4 cursor-pointer rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 bg-white hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 border border-pink-100 hover:border-pink-300"
                        onClick={() => handlePartnerClick(partner)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:from-pink-500 group-hover:to-rose-500">
                              {(partner.username || partner.name || '').charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-pink-700 truncate group-hover:text-pink-800">
                              {partner.username || partner.name}
                            </div>
                            <div className="text-sm text-pink-500 truncate group-hover:text-pink-600">
                              {partner.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Chat Interface */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
            {/* Users Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-200 h-[600px] flex flex-col">
                <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
                  <h3 className="text-lg font-bold text-pink-700 mb-3">Students ({users.length})</h3>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-pink-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-pink-200 rounded-lg focus:ring-4 focus:ring-pink-200 focus:border-pink-400 bg-gradient-to-r from-pink-50 to-rose-50 placeholder-pink-400 font-medium"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {filteredPartners.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-pink-400" />
                      </div>
                      <h3 className="text-lg font-bold text-pink-600 mb-2">No Students Found</h3>
                      <p className="text-pink-500">
                        {searchTerm ? 'Try adjusting your search' : 'Students will appear here when they join'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredPartners.map(partner => (
                        <div
                          key={partner.id}
                          className={`group relative p-3 cursor-pointer rounded-lg mb-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                            selectedPartner?.id === partner.id 
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl scale-105' 
                              : 'bg-white hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 border border-pink-100 hover:border-pink-300'
                          }`}
                          onClick={() => handlePartnerClick(partner)}
                        >
                          {/* Active indicator */}
                          {selectedPartner?.id === partner.id && (
                            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                selectedPartner?.id === partner.id 
                                  ? 'bg-white text-pink-500 shadow-lg' 
                                  : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white group-hover:from-pink-500 group-hover:to-rose-500'
                              }`}>
                                {(partner.username || partner.name || '').charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className={`font-bold truncate transition-colors duration-300 ${
                                selectedPartner?.id === partner.id ? 'text-white' : 'text-pink-700 group-hover:text-pink-800'
                              }`}>
                                {partner.username || partner.name}
                              </div>
                              <div className={`text-xs truncate transition-colors duration-300 ${
                                selectedPartner?.id === partner.id ? 'text-pink-100' : 'text-pink-500 group-hover:text-pink-600'
                              }`}>
                                {partner.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-200 h-[600px] flex flex-col">
                {selectedChat && selectedPartner ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {(selectedPartner.username || selectedPartner.name || '').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-pink-700">
                              {selectedPartner.username || selectedPartner.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm text-pink-600 font-medium">Online</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-xl transition-colors duration-200">
                            <Phone className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-xl transition-colors duration-200">
                            <Video className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-xl transition-colors duration-200">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div 
                      ref={messagesContainerRef}
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-pink-50"
                    >
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                            <span className="text-pink-600 font-medium">Loading conversation...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {messages.length === 0 && (
                            <div className="text-center py-16">
                              <div className="w-20 h-20 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="h-10 w-10 text-pink-400" />
                              </div>
                              <p className="text-lg font-bold text-pink-600 mb-2">Start the conversation!</p>
                              <p className="text-pink-500">Send the first message to begin chatting</p>
                            </div>
                          )}
                          {messages.map(msg => (
                            <MessageBubble 
                              key={msg.id} 
                              msg={msg} 
                              isOwn={msg.sender_type === currentUserType && msg.sender_id === currentUserId}
                            />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-pink-200 bg-white">
                      <div className="flex items-end space-x-4">
                        <div className="flex-1 relative">
                          <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            rows={2}
                            className="w-full px-5 py-4 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 resize-none bg-gradient-to-r from-rose-50 to-pink-50 text-gray-800 font-medium placeholder-pink-400 transition-all duration-200"
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={!input.trim()}
                          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full flex items-center justify-center mb-6">
                        <MessageCircle className="h-12 w-12 text-pink-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-pink-600 mb-2">Select a Student</h3>
                      <p className="text-pink-500 max-w-md">Choose a student from the sidebar to start a conversation and provide support</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User view - Enhanced support chat with beautiful styling
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Mobile Back Button */}
        {showMobileChat && (
          <div className="lg:hidden mb-4">
            <BackButton />
          </div>
        )}

        {/* Header - Hidden on mobile when chat is open */}
        <div className={`mb-8 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-3">Customer Support</h1>
              <p className="text-pink-100 text-lg font-medium">Get help from our support team</p>
            </div>
          </div>
        </div>

        {/* Support Agents Selection - Hidden on mobile when chat is open */}
        <div className={`mb-6 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-pink-700 mb-2">Choose a Support Agent</h2>
              <p className="text-pink-600 font-medium">Select an agent to get personalized help</p>
            </div>
            
            {admins.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-pink-600 mb-2">No Agents Available</h3>
                <p className="text-pink-500">Support agents are currently unavailable. Please try again later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map(partner => (
                  <div
                    key={partner.id}
                    className={`group relative p-6 cursor-pointer rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                      selectedPartner?.id === partner.id 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xl scale-105' 
                        : 'bg-white hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 border-2 border-pink-200 hover:border-pink-400 shadow-lg'
                    }`}
                    onClick={() => handlePartnerClick(partner)}
                  >
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg transition-all duration-300 ${
                          selectedPartner?.id === partner.id 
                            ? 'bg-white text-pink-500 shadow-xl' 
                            : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white group-hover:from-pink-500 group-hover:to-rose-500'
                        }`}>
                          {(partner.username || partner.name || '').charAt(0).toUpperCase()}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 border-3 border-white rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className={`font-bold text-lg mb-1 transition-colors duration-300 ${
                        selectedPartner?.id === partner.id ? 'text-white' : 'text-pink-700 group-hover:text-pink-800'
                      }`}>
                        {partner.username || partner.name}
                      </div>
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        selectedPartner?.id === partner.id ? 'text-pink-100' : 'text-pink-500 group-hover:text-pink-600'
                      }`}>
                        Support Specialist
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedPartner?.id === partner.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200 flex flex-col ${showMobileChat ? 'h-[calc(100vh-100px)] lg:h-[500px]' : 'h-[500px]'}`}>
          {selectedChat && selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {(selectedPartner.username || selectedPartner.name || '').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-pink-700 text-lg">{selectedPartner.username || selectedPartner.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-pink-600 font-medium">Online • Support Agent</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-full transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-pink-600 hover:bg-pink-100 rounded-full transition-colors">
                      <Video className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-white to-pink-50"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                      <span className="text-pink-600 font-medium">Connecting...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="h-8 w-8 text-pink-400" />
                        </div>
                        <p className="text-lg font-bold text-pink-600 mb-2">Start the conversation!</p>
                        <p className="text-pink-500">Your support agent is ready to help</p>
                      </div>
                    )}
                    {messages.map(msg => (
                      <MessageBubble 
                        key={msg.id} 
                        msg={msg} 
                        isOwn={msg.sender_type === currentUserType && msg.sender_id === currentUserId}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-5 border-t border-pink-200 bg-white">
                <div className="flex items-center space-x-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 bg-gradient-to-r from-rose-50 to-pink-50 text-gray-800 font-medium placeholder-pink-400 transition-all duration-200"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-pink-600 mb-2">Select a Support Agent</h3>
                <p className="text-pink-500 max-w-sm">Choose an agent above to start getting help with your questions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;