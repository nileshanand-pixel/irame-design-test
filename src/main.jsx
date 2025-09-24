// Sentry initialization should be imported first!
import './lib/instrument';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
	import.meta.env.VITE_DISABLE_REACT_STRICT_MODE === 'true' ? (
		<App />
	) : (
		<React.StrictMode>
			<App />
		</React.StrictMode>
	),
);
