import { useState } from 'react';

export const useInputModes = () => {
	const [mode, setMode] = useState('single');
	const [queries, setQueries] = useState([{ id: 1, text: '' }]);

	const handleQueryChange = (id, newText) => {
		const updatedQueries = queries.map((query) =>
			query.id === id ? { ...query, text: newText } : query,
		);
		setQueries(updatedQueries);
	};

	const resetQueries = () => {
		setQueries([{ id: 1, text: '' }]);
	};

	return {
		mode,
		setMode,
		queries,
		setQueries,
		handleQueryChange,
		resetQueries,
	};
};
