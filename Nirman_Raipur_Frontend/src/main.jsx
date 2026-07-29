
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './Components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
)
