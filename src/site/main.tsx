import { createRoot } from 'react-dom/client';
import '@fontsource/geist/400.css';
import '@fontsource/geist-mono/400.css';
import '@/lib/font-css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
