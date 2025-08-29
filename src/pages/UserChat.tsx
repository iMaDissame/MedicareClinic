import React from 'react';
import ChatSection from '../components/ChatSection';

const UserChat: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 md:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 flex items-center justify-center md:justify-start">
              <svg className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Support Client
            </h1>
            <p className="text-blue-100 text-base md:text-lg mb-3 md:mb-2">
              Obtenez de l'aide de notre équipe de support dédiée
            </p>
            <div className="flex items-center justify-center md:justify-start">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-blue-200 text-sm">
                Assistance rapide et personnalisée
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Comment pouvons-nous vous aider ?</h2>
              <p className="text-sm text-gray-600">Notre équipe est là pour répondre à toutes vos questions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Online status and response time removed as requested */}
          </div>
        </div>
      </div>
      
      <ChatSection />
      
  {/* Questions fréquentes section removed as requested */}
    </div>
  </div>
);

export default UserChat;