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
