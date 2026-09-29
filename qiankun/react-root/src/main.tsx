// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import { initGlobalState, registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'pure-html',
    entry: 'http://localhost:8002/',
    container: '#root',
    activeRule: '/pure',
  },
]);

start();