// Sentry initialization should be imported first!
import './lib/instrument';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import AppProvider from './providers/AppProvider';
import { toast as _nativeToast } from 'react-toastify';

// ---------------------------------------------------------------------------
// Global toast deduplication
// If the same message fires more than once within DEDUP_MS (e.g. axios
// interceptor + mutation onError both showing the same 403 message), only
// the first one is displayed. Works automatically for all 100+ API callers
// with zero changes to hooks or services.
// ---------------------------------------------------------------------------
const DEDUP_MS = 600;
const _recentToasts = new Map();

const _dedup = (originalFn) =>
	function (content, options) {
		// Build a string key from the content (string or React node)
		let key;
		if (typeof content === 'string') {
			key = content;
		} else if (content?.props?.message) {
			// Custom ToastComponent wraps message in props.message
			key = content.props.message;
		} else {
			key = JSON.stringify(content);
		}

		const now = Date.now();
		const lastSeen = _recentToasts.get(key);
		if (lastSeen !== undefined && now - lastSeen < DEDUP_MS) {
			return; // swallow duplicate
		}
		_recentToasts.set(key, now);
		// Prune stale entries to avoid unbounded growth
		for (const [k, t] of _recentToasts) {
			if (now - t >= DEDUP_MS) _recentToasts.delete(k);
		}
		return originalFn.call(_nativeToast, content, options);
	};

_nativeToast.error = _dedup(_nativeToast.error);
_nativeToast.success = _dedup(_nativeToast.success);
_nativeToast.info = _dedup(_nativeToast.info);
_nativeToast.warning = _dedup(_nativeToast.warning);
// ---------------------------------------------------------------------------

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
