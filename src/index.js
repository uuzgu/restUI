import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { DarkModeProvider } from './DarkModeContext';
import { LanguageProvider } from './LanguageContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DarkModeProvider>
      <LanguageProvider>
        <Router>
          <App />
        </Router>
      </LanguageProvider>
    </DarkModeProvider>
  </React.StrictMode>
);
