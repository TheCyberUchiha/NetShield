import React from 'react';
import ReactDOM from 'react-dom/client';
import BlockApp from './BlockApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('block-root')!).render(
  <React.StrictMode>
    <BlockApp />
  </React.StrictMode>
);
