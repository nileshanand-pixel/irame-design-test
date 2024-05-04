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
	'gAAAAABmNcBrWk7qMbFMp3SXe66MZD-TZGdil9AEXabcC3SivUsHvENLBKr3IpCDQgwRnwtZUtxp6ALgFMDTqu1ncX0ZFTD03gCZEG-cf_2l7Ff7VUIjvnCQOSo1dSLQLcPoecU88s43Q2EvayVVk480hf7LWeA7qw==';

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

export const getInitials = (userName) => {
	const words = userName.split(' ');

	const initials = words.map((word) => word.charAt(0).toUpperCase());

	const abbreviation = initials.join('');

	return abbreviation;
};
