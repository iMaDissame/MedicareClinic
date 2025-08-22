import React from 'react';
import ChatSection from '../components/ChatSection';

const UserChat: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat with Admin</h1>
    <ChatSection />
  </div>
);

export default UserChat;