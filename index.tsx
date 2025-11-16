import React from 'react';
// Use 'react-dom' when loading via UMD script
// FIX: To fix the error on line 12, `ReactDOM` must be imported from 'react-dom/client' to use the `createRoot` API from React 18.
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

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