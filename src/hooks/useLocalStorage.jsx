import { useState } from 'react';

const initialValue = {
	userDetails: {
		userName: '',
		email: '',
		userId: '',
		token: '',
		avatar: '',
	},
	answerRespConfig: {},
	dataSource: {
		id: '',
		name: '',
	},
	questionPrompt: {
		data: '',
	},
};

const useLocalStorage = (key) => {
	const storedValue = localStorage.getItem(key);
	let initial;

	try {
		initial = storedValue ? JSON.parse(storedValue) : initialValue[key] || {};
	} catch (error) {
		initial = initialValue[key] || {};
	}

	const [value, setValue] = useState(initial);

	const updateValue = (newValue) => {
		setValue(newValue);
		localStorage.setItem(key, JSON.stringify(newValue));
	};

	return [value, updateValue];
};

export default useLocalStorage;
