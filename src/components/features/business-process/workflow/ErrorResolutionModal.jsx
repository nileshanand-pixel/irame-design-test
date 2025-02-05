import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import capitalize from 'lodash.capitalize';

/* ------------------ ComboBoxOnFire ------------------ */
const ComboBoxOnFire = ({
	options = [],
	placeholder = 'Select an option...',
	onSelection,
}) => {
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);

	// Filter the groups/headers by query
	const filteredOptions = query
		? options
				.map((group) => ({
					...group,
					items: group.items.filter((item) =>
						item.label.toLowerCase().includes(query.toLowerCase()),
					),
				}))
				.filter((group) => group.items.length > 0)
		: options;

	const handleSelect = (item, groupLabel) => {
		// Pass selected data up to parent
		onSelection?.({
			label: item.label,
			description: item.description,
			fileName: groupLabel,
		});
		setIsOpen(false);
		setQuery(item.label); // display selected label
	};

	return (
		<div className="relative w-full max-w-md bg-white">
			{/* Input Field */}
			<div className="relative">
				<input
					type="text"
					className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2"
					placeholder={placeholder}
					value={query}
					onFocus={() => setIsOpen(true)}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					// Use onBlur with a small timeout so onClick in dropdown can register
					onBlur={() => setTimeout(() => setIsOpen(false), 200)}
				/>
				<button
					type="button"
					className="absolute inset-y-0 right-0 flex items-center pr-2"
					onMouseDown={(e) => {
						// prevent losing focus from input
						e.preventDefault();
						e.stopPropagation();
						setIsOpen((prev) => !prev);
					}}
				>
					<svg
						className="h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
			</div>

			{/* Dropdown */}
			{isOpen && (
				<div className="mt-1 w-full overflow-auto bg-white border transition-all ease-in border-gray-300 rounded shadow-lg">
					{filteredOptions.length > 0 ? (
						filteredOptions.map((group) => (
							<div
								key={group.group}
								className="border-b last:border-b-0"
							>
								<div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
									{capitalize(group?.group)}
								</div>
								{group.items.map((item) => (
									<div
										key={item.value}
										className="cursor-pointer px-8 py-2 hover:bg-purple-4 "
										onMouseDown={() =>
											handleSelect(item, group.group)
										}
									>
										{capitalize(item.label)}
									</div>
								))}
							</div>
						))
					) : (
						<div className="px-3 py-2 text-gray-500">
							No results found.
						</div>
					)}
				</div>
			)}
		</div>
	);
};

/* ------------------ AddFieldModal ------------------ */
const AddFieldModal = ({ isOpen, onClose, dataPoints, onSelect }) => {
	// Build group-based comboBox options from dataPoints
	const comboBoxOptions = (dataPoints || []).map((file) => ({
		group: file.file_name,
		items: file.headers.map((header) => ({
			value: header.name,
			label: header.name,
			description: header.description,
		})),
	}));

	const handleSelection = (selected) => {
		// selected = { label, description, fileName }
		onSelect(selected);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[500px] items-start w-full p-4 overflow-y-auto">
				{' '}
				<DialogHeader>
					<h3 className="text-lg font-semibold mb-2">Select Column</h3>
				</DialogHeader>
				<div className="mx-auto w-[98%] ">
					{' '}
					{/* Added wrapper div */}
					<ComboBoxOnFire
						options={comboBoxOptions}
						placeholder="Search or select a column"
						onSelection={handleSelection}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

/* ------------------ ErrorResolutionModal ------------------ */
export const ErrorResolutionModal = ({
	open,
	onOpenChange,
	workflowRunDetails,
	dataPoints,
}) => {
	const [missingFields, setMissingFields] = useState([]);
	const [mappings, setMappings] = useState({});
	const [clarificationAnswers, setClarificationAnswers] = useState({});
	const [hasChanges, setHasChanges] = useState(false);

	// Track which row index is currently opening the "Add Field" modal
	const [activeFieldIndex, setActiveFieldIndex] = useState(null);

	// Mock data (for brevity)
	const mockDataMappings = [
		{
			file_name: 'file1',
			headers: [{ name: 'header1', column_name: 'col1' }, { name: 'header2' }],
		},
		{
			file_name: 'file2',
			headers: [{ name: 'header3' }, { name: 'header4' }],
		},

	];

	const dataMappings =
		workflowRunDetails?.data?.data_mapping?.length > 0
			? workflowRunDetails.data.data_mapping
			: mockDataMappings;

	// Extract missing fields
	useEffect(() => {
		const missing = dataMappings.flatMap(
			(file) =>
				file.headers
					?.filter((header) => !header.column_name)
					.map((header) => header.name) || [],
		);
		setMissingFields(missing);
	}, [workflowRunDetails]);

	// Mock clarifications
	const mockClarifications = [
		{
			type: 'TEXT_CLARIFICATION',
			description: 'Missing column details required.',
		},
		{
			type: 'TEXT_CLARIFICATION',
			description: 'Explain why this column is missing.',
		},
	];

	const textClarifications =
		workflowRunDetails?.clarification?.filter(
			(c) => c.type === 'TEXT_CLARIFICATION',
		) || mockClarifications;

	// Reset mappings/clarifications whenever the modal opens
	useEffect(() => {
		setMappings(Object.fromEntries(missingFields.map((_, i) => [i, {}])));
		setClarificationAnswers({});
		setHasChanges(false);
		setActiveFieldIndex(null);
	}, [missingFields, workflowRunDetails]);

	const handleClarificationChange = (e, index) => {
		setClarificationAnswers((prev) => ({ ...prev, [index]: e.target.value }));
		setHasChanges(true);
	};

	const handleAddFieldSelection = (selection) => {
		// selection = { label, description, fileName }
		if (activeFieldIndex === null) return;

		setMappings((prev) => ({
			...prev,
			[activeFieldIndex]: {
				column_name: selection.label,
				file_name: selection.fileName,
				description: selection.description,
			},
		}));
		setHasChanges(true);
		setActiveFieldIndex(null);
	};

	const handleContinue = () => {
		// Possibly handle "mappings" or "clarificationAnswers" here
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl rounded-lg p-4 text-primary80 animate-in zoom-in-95">
				<DialogHeader>
					<div className="flex gap-4 items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/file_validation_error_modal_header.svg"
							alt="icon"
						/>
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold text-black/90">
								Validation Errors
							</h2>
							<p className="text-sm text-black/60">
								Missing columns error report
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="max-h-[500px] overflow-y-auto">
					<h3 className="mx-2 text-lg mb-1 font-semibold">
						Missing Columns
					</h3>
					<Separator className="mx-2" />

					<div className="flex mx-2 my-4 flex-col space-y-2">
						<div className="text-state-error flex items-center font-semibold bg-stateBg-inProgress px-3 py-1 rounded-md text-sm">
							<span className="material-symbols-outlined mr-2">
								error
							</span>
							Required Field not found: {missingFields.length}
						</div>
					</div>

					<div className="border-2 mx-2 rounded-lg overflow-hidden">
						<div className="sticky top-0 grid grid-cols-12 bg-gray-100 text-black font-semibold text-sm border-b-2">
							<div className="col-span-2 py-4 px-3 border-r-2">
								S. No.
							</div>
							<div className="col-span-4 py-4 px-3 border-r-2">
								Required Field
							</div>
							<div className="col-span-6 py-4 px-3">Add Field</div>
						</div>

						<div className="max-h-52 min-h-32 overflow-y-auto">
							{missingFields.map((field, index) => (
								<div
									key={index}
									className="grid grid-cols-12 border-b-2"
								>
									<div className="col-span-2 py-1 px-3 border-r-2">
										{index + 1}
									</div>
									<div className="col-span-4 py-1 px-3 border-r-2 font-medium">
										{field}
									</div>
									<div className="col-span-6 py-1 px-3">
										<Button
											variant="outline"
											className={cn(
												'w-full justify-between border-none hover:bg-transparent hover:text-black/50 cursor-pointer',
												mappings[index]?.column_name
													? 'text-black/80'
													: 'text-purple-100',
											)}
											onClick={() =>
												setActiveFieldIndex(index)
											}
										>
											{mappings[index]?.column_name
												? mappings[index].column_name
												: '+ Add Field'}
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>

					{textClarifications.length > 0 && (
						<div className="mx-2 mt-6">
							<h3 className="text-lg mx-2 font-semibold">
								Clarification
							</h3>
							<Separator className="mx-2" />
							<div className="mx-2 mt-4">
								{textClarifications.map((item, index) => (
									<div key={index} className="mb-4">
										<Label
											htmlFor={`clarification_${index}`}
											className="block text-black/80 font-medium text-lg mb-1"
										>
											{item.description}
										</Label>
										<textarea
											id={`clarification_${index}`}
											value={clarificationAnswers[index] || ''}
											onChange={(e) =>
												handleClarificationChange(e, index)
											}
											className="w-full px-3 py-2 border text-black/60 rounded-md bg-purple-4/8 focus:outline-none resize-none h-32 min-h-[8rem]"
											placeholder="Enter your answer..."
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex mx-2 justify-between gap-3 pt-4">
					<Button
						className="w-1/2"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleContinue}
						disabled={!hasChanges}
						className={cn(
							'w-1/2 hover:bg-purple-100 hover:text-white hover:opacity-80',
							!hasChanges && 'opacity-50 cursor-not-allowed',
						)}
					>
						Continue
					</Button>
				</div>
			</DialogContent>

			{/* The small AddFieldModal for the ComboBox */}
			<AddFieldModal
				isOpen={activeFieldIndex !== null}
				onClose={() => setActiveFieldIndex(null)}
				dataPoints={dataPoints}
				onSelect={handleAddFieldSelection}
			/>
		</Dialog>
	);
};
