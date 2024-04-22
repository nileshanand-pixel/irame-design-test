import { useRouter } from '@/hooks/useRouter';
import { useEffect } from 'react';
import { useOAuthLogin } from './hooks/useOAuthLogin';

export default function GoogleCallbackPage() {
	const { query } = useRouter();
	const { connectGoogle } = useOAuthLogin(query);

	useEffect(() => {
		connectGoogle();
	}, []);

	return (
		<div className="container flex h-screen w-screen flex-col items-center justify-center">
			logging in...
		</div>
	);
}
