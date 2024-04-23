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
	'gAAAAABmJx_j9ob87zrqRMkRfZzJP2fEUtv2oJDitPdi6l9grmREtl-9MINSE4d2wv0NqI3K4q2bLHGevcskJXvwGdwexjJaimc68fXKkj9kMLBhk35IqEytpWN0XWibP9F7V7_x0yZFUXHPjUN0dYrH0Wg-wOiI_Q==';


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

//TODO: make a generic function to get data from cookies
