export const setLocalStorage = (key, value) => {
	const storedValue = typeof value === 'object' ? JSON.stringify(value) : value;
	localStorage.setItem(key, storedValue);
};

export const getLocalStorage = (key) => {
	const value = localStorage.getItem(key);

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};

export const removeFromLocalStorage = (key) => {
	localStorage.removeItem(key);
};
