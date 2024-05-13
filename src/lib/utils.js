import { clsx } from 'clsx';
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
	'gAAAAABmQkfz3f3TnkmDUhLh8vWPWAzXSBi81HTTM7lMxgOrASyz1475oiIETz_V37kQF4zG8jkOE-mOg_Y3L7_01XcLJG8-vmWdTm_su9kjlrXTNQhqBadw7G-Bu1XGrHS7UWgGrp-Nw4zwhw3PS0VJm9iHVLDAQA==';

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
