import { useState, useCallback } from 'react';
import { logError } from '@/lib/logger';

const initialValue = {
	userDetails: {
		user_name: '',
		email: '',
		user_id: '',
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
		logError(error, {
			feature: 'localStorage',
			action: 'parseStoredValue',
			extra: {
				key,
				errorMessage: error.message,
			},
		});
		initial = initialValue[key] || {};
	}

	const [value, setValue] = useState(initial);

	const updateValue = useCallback(
		(newValue) => {
			setValue(newValue);
			localStorage.setItem(key, JSON.stringify(newValue));
		},
		[key],
	);

	return [value, updateValue];
};

export default useLocalStorage;
