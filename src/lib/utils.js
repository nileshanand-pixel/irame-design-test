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

export const getToken = () => {
	const cookieString = document.cookie;

	const cookies = cookieString.split(';').map((cookie) => cookie.trim());

	for (const cookie of cookies) {
		if (cookie.startsWith('token')) {
			return cookie.split('=')[1];
		}
	}
	return null;
};

//TODO: make a generic function to get data from cookies

export const tokenCookie =
	'gAAAAABmJrJvBltB0ZsP4dV2wn9bDoyRQENF1Dl3jKaDI509UdIUA4mL8Ppowyv00Wq5OSw2xIx5OgjFMW6pDKXtc9OzI9e6BelfntHv8UWHrh1CDgCzd4BdkIV69XDzcAZNJPbntAxLGB34i-hpoJWRepUW7157cg==';
