// src/pages/AdminChat.tsx
import React from 'react';
import ChatSection from '../../components/ChatSection';

const AdminChat: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Chat</h1>
    <ChatSection />
  </div>
);

export default AdminChat;