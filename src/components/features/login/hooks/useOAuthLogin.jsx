import { useNavigate } from 'react-router-dom';

import { loginWithGoogle } from '../services/auth.service';
import { logError } from '@/lib/logger';
import { REDIRECTION_URL_AFTER_LOGIN } from '@/constants/login-constants';

export const useOAuthLogin = (data) => {
	const navigate = useNavigate();

	const connectGoogle = async () => {
		try {
			if (!data) return;

			if (data.error && data.error === 'access_denied') {
				navigate('/');
			}
			if (!data.code) return;
			const params = new URLSearchParams();
			params.append('code', data.code.toString());

			// await loginWithGoogle(params);

			navigate(REDIRECTION_URL_AFTER_LOGIN);
		} catch (err) {
			console.log(err);
			logError(err, { feature: 'login', action: 'google-oauth' });
			navigate('/');
		}
	};

	return {
		connectGoogle,
	};
};
