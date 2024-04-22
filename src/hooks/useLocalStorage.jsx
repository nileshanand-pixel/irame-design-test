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
	prompt: {
		data: '',
	},
};

const useLocalStorage = (key) => {
	const storedValue = localStorage.getItem(key);
	const initial = storedValue ? JSON.parse(storedValue) : initialValue[key];

	const [value, setValue] = useState(initial);

	const updateValue = (newValue) => {
		setValue(newValue);
		localStorage.setItem(key, JSON.stringify(newValue));
	};

	return [value, updateValue];
};

export default useLocalStorage;
