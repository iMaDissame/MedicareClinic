import React, { useEffect, useState, useRef } from 'react';
import { getChats, getChatMessages, sendChatMessage, startChat } from '../services/axiosClient';
import axiosClient from '../services/axiosClient';
import Button from './ui/Button';

const ChatSection = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserType = localStorage.getItem('authType');
  const currentUserId = JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;

  useEffect(() => {
    getChats().then(res => setChats(res.data.data));
    if (currentUserType === 'admin') {
      axiosClient.get('/admin/users').then(res => setUsers(res.data.data));
    } else {
      axiosClient.get('/admins').then(res => setAdmins(res.data.data));
    }
  }, []);

  // When a partner is selected, start or select chat
  const handlePartnerClick = async (partner) => {
    setSelectedPartner(partner);
    // Find existing chat
    const chat = chats.find(c =>
      (currentUserType === 'admin' && c.user.id === partner.id) ||
      (currentUserType !== 'admin' && c.admin.id === partner.id)
    );
    if (chat) {
      setSelectedChat(chat);
      fetchMessages(chat.id);
    } else {
      // Start new chat with correct payload
      let res;
      if (currentUserType === 'admin') {
        res = await axiosClient.post('/chats/start', { user_id: partner.id });
      } else {
        res = await axiosClient.post('/chats/start', { admin_id: partner.id });
      }
      setSelectedChat(res.data.data);
      fetchMessages(res.data.data.id);
    }
  };

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const interval = setInterval(() => fetchMessages(selectedChat.id), 2000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = (chatId: string) => {
    getChatMessages(chatId).then(res => setMessages(res.data.data));
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    await sendChatMessage(selectedChat.id, input);
    setInput('');
    fetchMessages(selectedChat.id);
  };

  // Sidebar: show users for admin, admins for user
  const partners = currentUserType === 'admin' ? users : admins;

  return (
    <div className="flex h-[540px] w-full max-w-3xl border rounded-2xl shadow-xl bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 bg-gradient-to-b from-pink-100 to-rose-100 border-r border-pink-200 overflow-y-auto">
        <h2 className="p-5 font-bold text-lg border-b border-pink-200 text-pink-700 tracking-wide">{currentUserType === 'admin' ? 'Users' : 'Admins'}</h2>
        <div className="space-y-1">
          {partners.map(partner => (
            <div
              key={partner.id}
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-xl transition-all duration-150 hover:bg-pink-200/60 ${selectedPartner?.id === partner.id ? 'bg-pink-200/80' : ''}`}
              onClick={() => handlePartnerClick(partner)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg">
                {(partner.username || partner.name || '').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-pink-700 truncate">{partner.username || partner.name}</div>
                <div className="text-xs text-pink-500 truncate">{partner.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-rose-50">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {selectedChat ? (
            <>
              {messages.length === 0 && (
                <div className="text-center text-pink-400 mt-20 text-lg font-medium">Start the conversation!</div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === currentUserType && msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-5 py-3 rounded-2xl max-w-[70%] break-words shadow-lg text-base font-medium
                      ${msg.sender_type === currentUserType && msg.sender_id === currentUserId
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                        : 'bg-white text-gray-900 border border-pink-100'}`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="text-center text-pink-400 mt-20 text-lg font-medium">Select a partner to start messaging</div>
          )}
        </div>
        {/* Input */}
        {selectedChat && (
          <div className="px-6 py-4 border-t border-pink-200 bg-white flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-rose-50 text-gray-900"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;