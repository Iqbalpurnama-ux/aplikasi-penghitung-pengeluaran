import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SplashProvider } from './components/SplashProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplashProvider>
      <App />
    </SplashProvider>
  </StrictMode>,
);
