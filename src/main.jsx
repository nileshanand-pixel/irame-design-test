// Sentry initialization should be imported first!
import './lib/instrument';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import AppProvider from './providers/AppProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
	import.meta.env.VITE_DISABLE_REACT_STRICT_MODE === 'true' ? (
		<AppProvider>
			<App />
		</AppProvider>
	) : (
		<React.StrictMode>
			<AppProvider>
				<App />
			</AppProvider>
		</React.StrictMode>
	),
);
