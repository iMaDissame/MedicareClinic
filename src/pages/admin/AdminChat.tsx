import React from 'react';
import ChatSection from '../../components/ChatSection';

const AdminChat: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 md:mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 flex items-center justify-center md:justify-start">
              <svg className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Centre de Support Administrateur
            </h1>
            <p className="text-purple-100 text-base md:text-lg mb-3 md:mb-2">
              Communiquez avec les étudiants et fournissez un support en temps réel
            </p>
            <div className="flex items-center justify-center md:justify-start">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-purple-200 text-sm">
                Support disponible 24/7 pour vos étudiants
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <ChatSection />
    </div>
  </div>
);

export default AdminChat;