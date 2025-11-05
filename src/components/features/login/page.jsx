import React, { useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import BoxLoader from '@/components/elements/loading/BoxLoader';
import Form from './components/form';

const REDIRECTION_URL_AFTER_LOGIN = '/app/home?source=login';

const SignInSignUp = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState('');

	const router = useRouter();
	const hasCode = Boolean(router.query?.code);

	const bgStyles = {
		background:
			'linear-gradient(180deg, rgba(255, 255, 255, 0.40) 1.14%, rgba(255, 255, 255, 0.16) 98.72%), rgba(106, 18, 205, 0.02)',
		backdropFilter: 'blur(60px)',
		WebkitBackdropFilter: 'blur(60px)',
	};

	if (hasCode || isLoading) {
		return (
			<div className="flex items-center justify-center h-screen relative">
				<BoxLoader />
			</div>
		);
	}

	return (
		<>
			<h1 className="text-2xl font-semibold text-purple-100 pt-10 px-10">
				Irame.ai
			</h1>

			<div className="flex items-center justify-center ">
				<div className="relative w-[30rem] h-[44rem]">
					<div
						className="relative px-10 pb-10 flex flex-col form-bg rounded-3xl border-[0.0875rem] h-full z-10 pt-[7.5rem]"
						style={bgStyles}
					>
						<Form
							setIsLoading={setIsLoading}
							email={email}
							setEmail={setEmail}
						/>
					</div>

					<div
						className="absolute -top-8  bg-custom-gradient left-0 border border-red-500 -translate-x-[50%]"
						style={{
							width: '13.625rem',
							height: '13.625rem',
							borderRadius: '50%',
							zIndex: 1,
						}}
					></div>

					<div
						className="absolute -bottom-8 right-0 bg-custom-gradient translate-x-[50%]"
						style={{
							width: '13.625rem',
							height: '13.625rem',
							borderRadius: '50%',
							zIndex: 1,
						}}
					></div>
				</div>
			</div>
		</>
	);
};

export default SignInSignUp;
