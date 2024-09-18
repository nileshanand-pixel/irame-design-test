import React, { useEffect, useState } from 'react';
import { getToken } from '@/lib/utils';
import { getFreshdeskToken } from './service/freshdesk.service';
import useAuth from '@/hooks/useAuth';

const WIDGET_ID = 1060000001832;
const WIDGET_SCRIPT_URL = `https://ind-widget.freshworks.com/widgets/${WIDGET_ID}.js`;

const FreshdeskWidget = () => {
	const [isScriptLoaded, setIsScriptLoaded] = useState(false);
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		if (!isAuthenticated) return;
		const loadScript = () => {
			const script = document.createElement('script');
			script.src = WIDGET_SCRIPT_URL;
			script.async = true;
			script.onload = () => setIsScriptLoaded(true);
			document.body.appendChild(script);

			return () => {
				document.body.removeChild(script);
			};
		};

		window.fwSettings = {
			widget_id: WIDGET_ID,
		};

		// Initialize FreshworksWidget
		if (typeof window.FreshworksWidget !== 'function') {
			const n = function () {
				n.q.push(arguments);
			};
			n.q = [];
			window.FreshworksWidget = n;
		}

		return loadScript();
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isScriptLoaded) return;

		const getFreshdeskAuthToken = async () => {
			try {
				return await getFreshdeskToken(getToken());
			} catch (error) {
				console.error('Failed to authenticate', error);
				return null;
			}
		};

		const authenticateWidget = async () => {
			const token = await getFreshdeskAuthToken();
			if (token) {
				window.FreshworksWidget('authenticate', { token });
			}
		};

		authenticateWidget();
	}, [isScriptLoaded]);

	return null;
};

export default FreshdeskWidget;
