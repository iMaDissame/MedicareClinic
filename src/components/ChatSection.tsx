import React, { useEffect, useState } from 'react';
import { getChats, getChatMessages, sendChatMessage } from '../services/axiosClient';

const ChatSection = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    getChats().then(res => setChats(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const interval = setInterval(() => fetchMessages(selectedChat.id), 2000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  const fetchMessages = (chatId: string) => {
    getChatMessages(chatId).then(res => setMessages(res.data.data));
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    await sendChatMessage(selectedChat.id, input);
    setInput('');
    fetchMessages(selectedChat.id);
  };

  // Get current user type and id
  const currentUserType = localStorage.getItem('authType');
  const currentUserId = JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;

  return (
    <div className="flex h-[500px] w-full max-w-3xl border rounded-lg shadow-lg bg-white">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
        <h2 className="p-4 font-bold text-lg border-b">Chats</h2>
        {chats.map(chat => {
          const partner = currentUserType === 'admin' ? chat.user : chat.admin;
          return (
            <div
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-blue-100 ${selectedChat?.id === chat.id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="font-semibold">{partner?.username || partner?.name}</div>
              <div className="text-xs text-gray-500">{partner?.email}</div>
            </div>
          );
        })}
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
          {selectedChat ? (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === currentUserType && msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs break-words shadow
                    ${msg.sender_type === currentUserType && msg.sender_id === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900'}`}
                >
                  {msg.message}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-20">Select a chat to start messaging</div>
          )}
        </div>
        {/* Input */}
        {selectedChat && (
          <div className="p-3 border-t flex items-center bg-white">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-2xl focus:outline-none focus:ring"
            />
            <button
              onClick={handleSend}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;