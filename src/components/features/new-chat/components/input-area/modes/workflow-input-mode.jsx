import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const WorkflowInputMode = ({
	queries,
	handleQueryChange,
	setQueries,
	onSaveTemplate,
	disabled,
	onSwitchToSimpleMode,
}) => {
	const inputRefs = useRef([]);

	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, queries.length);
	}, [queries]);

	const handleKeyDown = (e, id) => {
		const currentQueryIndex = queries.findIndex((query) => query.id === id);
		const currentQuery = queries[currentQueryIndex];

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (currentQuery.text.trim() === '') return;

			const newQuery = { id: currentQuery.id + 1, text: '' };

			setQueries((prev) => {
				const newQueries = [];
				prev.forEach((q, index) => {
					if (index < currentQueryIndex) {
						newQueries.push({ ...q });
					} else if (index === currentQueryIndex) {
						newQueries.push({ ...q });
						newQueries.push(newQuery);
					} else {
						newQueries.push({ ...q, id: q.id + 1 });
					}
				});
				return [...newQueries];
			});

			setTimeout(() => {
				inputRefs.current[currentQueryIndex + 1]?.focus();
			}, 0);
		}

		if (
			(e.key === 'Backspace' || e.key === 'Delete') &&
			currentQuery.text.trim() === ''
		) {
			e.preventDefault();

			if (queries.length > 1) {
				const updatedQueries = queries.filter((query) => query.id !== id);
				setQueries(updatedQueries);

				setTimeout(() => {
					const focusIndex = Math.min(
						currentQueryIndex,
						updatedQueries.length - 1,
					);
					inputRefs.current[focusIndex]?.focus();
				}, 0);
			} else {
				// If it's the last query, switch to simple mode
				onSwitchToSimpleMode();
			}
		}
	};

	const autoResize = (e) => {
		e.target.style.height = 'auto';
		const newHeight = e.target.scrollHeight;
		const maxHeight = 128;
		const clampedHeight = newHeight > maxHeight ? maxHeight : newHeight;
		e.target.style.height = `${clampedHeight}px`;
	};

	return (
		<div className="w-[90%] flex flex-col gap-2 pr-2">
			<div className="flex flex-col gap-2 rounded-lg max-h-48 w-full overflow-y-auto">
				{queries.map((query, index) => (
					<div
						key={query.id}
						className="flex items-start p-1 bg-[#6A12CD0A] gap-1"
					>
						<label className="text-gray-500 mr-1">
							{`Step ${index < 9 ? '0' : ''}${index + 1}:`}
						</label>
						<Textarea
							rows={1}
							className="outline-none text-xs xl:text-sm 2xl:text-base rounded-xl bg-transparent border-none px-2 py-1 flex-1 resize-none overflow-y-auto max-h-32"
							value={query.text}
							onChange={(e) =>
								handleQueryChange(query.id, e.target.value)
							}
							onKeyDown={(e) => handleKeyDown(e, query.id)}
							onInput={autoResize}
							placeholder="Enter your step here..."
							ref={(el) => (inputRefs.current[index] = el)}
							autoFocus={index === queries.length - 1}
							disabled={disabled}
						/>
					</div>
				))}
			</div>
			<div className="flex justify-between items-center">
				<p className="text-sm flex items-baseline text-gray-500">
					Press Enter &#8617; to add another step
				</p>
				<Button
					variant="secondary"
					className="w-fit bg-transparent rounded-lg text-sm font-normal text-purple border-2 border-[#26064A1A]"
					onClick={onSaveTemplate}
				>
					Save as template
				</Button>
			</div>
		</div>
	);
};

export default WorkflowInputMode;
