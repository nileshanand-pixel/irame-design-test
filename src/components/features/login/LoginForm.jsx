import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { LoginFormSchema } from './schema';

const LoginForm = ({ onContinue }) => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
		watch,
	} = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		resolver: zodResolver(LoginFormSchema),
		mode: 'all',
	});

	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword((prevState) => !prevState);
	};

	const onSubmit = (data) => {
		if (!data.email || !data.password) {
			return;
		}
		onContinue(data);
	};

	// Watch form values to trigger re-renders on change
	const email = watch('email');
	const password = watch('password');

	useEffect(() => {
		const handleEnterKey = (event) => {
			if (event.key === 'Enter' && !isSubmitting && isValid) {
				handleSubmit(onSubmit)();
			}
		};

		window.addEventListener('keydown', handleEnterKey);

		return () => {
			window.removeEventListener('keydown', handleEnterKey);
		};
	}, [isSubmitting, isValid, handleSubmit, onSubmit]);

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div>
				<label
					htmlFor="email"
					className="block text-sm font-medium text-gray-700"
				>
					Email
				</label>
				<input
					required
					id="email"
					type="email"
					{...register('email', { required: true })}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
				{errors.email && (
					<p className="mt-2 text-sm text-red-600" id="email-error">
						{errors.email.message}
					</p>
				)}
			</div>

			<div>
				<label
					htmlFor="password"
					className="block text-sm font-medium text-gray-700"
				>
					Password
				</label>
				<div className="relative mt-1">
					<input
						required
						id="password"
						type={showPassword ? 'text' : 'password'}
						{...register('password', { required: true })}
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
					{password && (
						<button
							type="button"
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
							onClick={togglePasswordVisibility}
							tabIndex={-1} // Prevent the button from gaining focus
						>
							<i
								className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
							></i>
						</button>
					)}
				</div>
				{errors.password && (
					<p className="mt-2 text-sm text-red-600" id="password-error">
						{errors.password.message}
					</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={isSubmitting || !isValid || !email || !password}
				className={`w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
					isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
				}`}
			>
				Continue
			</Button>
		</form>
	);
};

export default LoginForm;
