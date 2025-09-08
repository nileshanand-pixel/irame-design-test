export const pxToRem = (value) => {
	const baseFontSize = 16;
	if (typeof value === 'string') {
		value = value.trim().toLowerCase();
		if (value.endsWith('px')) {
			value = value.slice(0, -2);
		}
		value = parseFloat(value);
	}
	return `${Number(value) / baseFontSize}rem`;
};
