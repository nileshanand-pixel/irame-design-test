export const capitalizeWords = (str) => {
	if (!str) return '';
	return str
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

export const getUserInitials = (username) => {
	const words = username.trim().split(/\s+/); // split by spaces, handle multiple spaces
	return words
		.slice(0, 2)
		.map((word) => word[0])
		.join('')
		.toUpperCase();
};

export function getDarkColorFromString(str) {
	// Simple hash function
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Map hash to HSL
	const hue = Math.abs(hash) % 360; // 0 - 359
	const saturation = 40 + (Math.abs(hash) % 20); // 40% - 60%
	const lightness = 20 + (Math.abs(hash) % 10); // 20% - 30%

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function areStringObjectsEqual(obj1, obj2) {
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	// Check if number of keys is different
	if (keys1.length !== keys2.length) return false;

	// Check if all keys and values match
	for (const key of keys1) {
		if (obj1[key] !== obj2[key]) {
			return false;
		}
	}

	return true;
}

/**
 * Format time ago string from ISO date string
 * Includes weeks support and handles null/undefined
 */
export const formatTimeAgo = (dateString) => {
	if (!dateString) return 'Unknown';

	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
	if (diffMonths < 12)
		return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
	return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
};

/**
 * Get time ago string - accepts both Date object and date string
 * Returns 'Recently' for null/undefined
 */
export const getTimeAgo = (dateInput) => {
	if (!dateInput) return 'Recently';

	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
	return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};
