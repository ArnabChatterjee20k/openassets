import { createRoot } from 'react-dom/client';
import '@/lib/font-css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
