import { useNavigate } from 'react-router-dom';

import { loginWithGoogle } from '../services/auth.service';

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

			navigate('/app/new-chat');
		} catch (err) {
			console.log(err);
			navigate('/');
		}
	};

	return {
		connectGoogle,
	};
};
