import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { LoginFormSchema } from './schema';


const LoginForm = ({ onContinue }) => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		clearErrors,
	} = useForm({
		resolver: zodResolver(LoginFormSchema),
		mode: 'all',
	});

	const onSubmit = (data) => {
		onContinue(data);
	};

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
					id="email"
					type="email"
					{...register('email')}
					onChange={(e) => {
						if (e.target.value === '') {
							clearErrors('email');
						}
					}}
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
				<input
					id="password"
					type="password"
					{...register('password')}
					onChange={(e) => {
						if (e.target.value === '') {
							clearErrors('password');
						}
					}}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
				{errors.password && (
					<p className="mt-2 text-sm text-red-600" id="password-error">
						{errors.password.message}
					</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={isSubmitting}
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
