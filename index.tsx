import './src/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Detect Capacitor (iOS/Android app) and apply platform-specific fixes
if ((window as any).Capacitor) {
  // Add capacitor class for CSS scoping
  document.documentElement.classList.add('capacitor');

  // Update viewport meta to disable zoom on iOS
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
