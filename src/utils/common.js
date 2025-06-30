export const getUserInitials = (username) => {
	if (!username) return 'AU';
	const words = username.trim().split(/\s+/); // split by spaces, handle multiple spaces
	return words
		.slice(0, 2)
		.map((word) => word[0])
		.join('')
		.toUpperCase();
};

export function getDarkColorFromString(str) {
	if (!str) return '';
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
