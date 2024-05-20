import { getDataSources } from '@/components/features/configuration/service/configuration.service';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const formatFileSize = (size) => {
	if (size < 1024) {
		return size + ' B';
	} else if (size < 1024 * 1024) {
		return (size / 1024).toFixed(2) + ' KB';
	} else if (size < 1024 * 1024 * 1024) {
		return (size / (1024 * 1024)).toFixed(2) + ' MB';
	} else {
		return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}
};

export const tokenCookie =
	'gAAAAABmSY6_eG5joJsXgmdrwWDk4lLg08C79RHunPsLxFLhbDZL00ZvX77XT4qkvGzXb0c4TAq7jTJhLmB2V_t3M8jRXfOT2YHyRQTZs98W3BGwZkzvf3DGibjFMukxhgfRbL8QbJlK1tcPvnyAQjWjjFKS8wjTrA==';

export const getToken = () => {
	const cookieString = document.cookie;

	const cookies = cookieString.split(';').map((cookie) => cookie.trim());

	for (const cookie of cookies) {
		if (cookie.startsWith('token')) {
			let tokenMatch = cookie.match(/token="([^"]+)"/);
			let tokenValue = tokenMatch ? tokenMatch[1] : null;
			return tokenValue;
		}
	}
	return tokenCookie;
};

export const getInitials = (userName) => {
	const words = userName.split(' ');

	const initials = words.map((word) => word.charAt(0).toUpperCase());

	const abbreviation = initials.join('');

	return abbreviation;
};
