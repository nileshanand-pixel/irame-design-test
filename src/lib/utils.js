import { clsx } from 'clsx';
import Cookies from 'js-cookie';
import capitalize from 'lodash.capitalize';
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

export const tokenCookie = '';

export const getToken = () => {
	const token = Cookies.get('id_token');
	return token ? token : tokenCookie;
};

export const getInitials = (userName) => {
	if (!userName) return;
	const words = userName.split(' ');

	const initials = words.map((word) => word.charAt(0).toUpperCase());

	const abbreviation = initials.join('');

	return abbreviation;
};

export function toTitleCase(str) {
	if (!str) return str;
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}
export const getShortHandName = (fullName) => {
	if (fullName.length > 0) {
		const splits = fullName.split(' ');
		const firstLetter = splits[0].charAt(0);
		const lastLetter = splits[splits.length - 1][0];
		return capitalize(firstLetter + lastLetter);
	} else return '--';
};

export const capitalizeFirstLetterFullText = (text) => {
	if (!text) return;
	return text
		.split(' ')
		.map((sentence) => capitalize(sentence))
		.join(' ');
};

export const chatCommandInitiator = (str) =>{
    const regex = /^\/$/;
    return regex.test(str);
}
