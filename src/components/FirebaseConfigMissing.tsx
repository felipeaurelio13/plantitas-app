import React from 'react';
import { AlertTriangle, Settings, ExternalLink } from 'lucide-react';
import Footer from './Footer';

export const FirebaseConfigMissing: React.FC = () => {
  const copyEnvTemplate = () => {
    const envTemplate = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_OPENAI_API_KEY=your_openai_key_here`;

    navigator.clipboard?.writeText(envTemplate).then(() => {
      alert('📋 Environment variables template copied to clipboard!');
    }).catch(() => {
      console.log('📋 Could not copy to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔥 Firebase Configuration Required
          </h1>
          <p className="text-gray-600">
            Your PlantCare app needs to be connected to Firebase to work properly.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              ⚠️ Missing Configuration
            </h3>
            <p className="text-red-700 text-sm">
              Firebase environment variables are not configured. The app cannot connect to 
              your Firebase project for authentication and data storage.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Quick Setup Guide
            </h3>
            <ol className="text-blue-700 text-sm space-y-2">
              <li>1. Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">console.firebase.google.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>2. Enable Authentication and Firestore Database</li>
              <li>3. Get your Firebase config from Project Settings</li>
              <li>4. Add environment variables to your deployment</li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              🔧 Environment Variables Template
            </h3>
            <div className="bg-gray-800 text-green-400 rounded p-3 text-xs font-mono overflow-x-auto mb-3">
              <pre>{`# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_OPENAI_API_KEY=your_openai_key_here`}</pre>
            </div>
            <button
              onClick={copyEnvTemplate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              📋 Copy Template to Clipboard
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ For GitHub Pages Deployment
            </h3>
            <p className="text-green-700 text-sm mb-2">
              Add these variables as GitHub Secrets in your repository:
            </p>
            <p className="text-green-600 text-sm">
              Repository Settings → Secrets and Variables → Actions → New repository secret
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            🌱 Once configured, your PlantCare app will be ready to help you manage your plants!
          </p>
        </div>
      </div>
      <Footer className="mt-8" showVersion />
    </div>
  );
};