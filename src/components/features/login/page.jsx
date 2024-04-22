import { Button } from '@/components/ui/button';
import { API_URL } from '@/config';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useRouter } from '@/hooks/useRouter';

const SignInSignUp = () => {
	const navigate = useNavigate();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		setIsLoading(true);
		const resp = await axios.get(`${API_URL}/oauth/google/login`);
		if (resp) {
			window.location.href = resp.data;
		}
		// window.location.href = `${API_URL}/oauth/google/login`;
	};

	const bgStyles = {
		backdropFilter: 'blur(20px)',
		WebkitBackdropFilter: 'blur(20px)',
		zIndex: 2,
	};

	useEffect(() => {
		const token = Cookies.get('token');
		if (token) {
			navigate('/app/dashboard');
		}
	}, []);

	return (
		<>
			<h1 className="text-2xl font-semibold text-purple-100 pt-10 px-10 ">
				Irame.ai
			</h1>
			<div className="flex items-center justify-center relative">
				<div
					className="relative w-[480px] px-10 rounded-3xl border-[1.4px] h-[704px] flex justify-center flex-col form-bg"
					style={bgStyles}
				>
					{/* Card content */}
					<div className="z-10">
						<div className="mb-8">
							<h1 className="text-primary100 text-[28px] leading-10 font-bold">
								Let's Start
							</h1>
							<p className="text-sm text-primary100 font-normal">
								Continue with your email
							</p>
						</div>

						<Button
							disabled={isLoading}
							onClick={handleLogin}
							className={`w-full border border-black/5 hover:text-black hover:bg-white hover:opacity-90 bg-white text-black  ${
								isLoading ? 'cursor-not-allowed opacity-60' : ''
							}`}
						>
							<img
								src="/assets/icons/google-icon.svg"
								className="size-[18px] mr-2"
							/>
							Continue with Google
						</Button>
					</div>
				</div>
				{/* Top Left Circle */}
				<div
					className="absolute -top-8  bg-custom-gradient left-[25%]"
					style={{
						width: '218px',
						height: '218px',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>

				{/* Bottom Right Circle */}
				<div
					className="absolute -bottom-8 right-[27%] bg-custom-gradient"
					style={{
						width: '218px',
						height: '218px',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>
			</div>
		</>
	);
};

export default SignInSignUp;
