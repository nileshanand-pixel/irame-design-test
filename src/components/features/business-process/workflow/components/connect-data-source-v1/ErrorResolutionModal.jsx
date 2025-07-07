import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import upperFirst from 'lodash.upperfirst';

// Constants
const COMBO_BOX_PLACEHOLDER = 'Select an option...';

/* ------------------ ComboBoxOnFire ------------------ */
const ComboBoxOnFire = ({
	options = [],
	placeholder = COMBO_BOX_PLACEHOLDER,
	onSelection,
}) => {
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);

	const filteredOptions = useMemo(() => {
		if (!query) return options;

		return options
			.map((group) => ({
				...group,
				items: group.items.filter((item) =>
					item.label.toLowerCase().includes(query.toLowerCase()),
				),
			}))
			.filter((group) => group.items.length > 0);
	}, [options, query]);

	const handleSelect = (item, group) => {
		onSelection?.({
			label: item.label,
			description: item.description,
			type: item.type,
			fileName: group.filename,
			fileId: group.file_id,
		});
		setIsOpen(false);
		setQuery(item.label);
	};

	return (
		<div className="relative w-full max-w-md bg-white">
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
					onBlur={() => setTimeout(() => setIsOpen(false), 200)}
				/>
				<DropdownToggleButton isOpen={isOpen} setIsOpen={setIsOpen} />
			</div>

			<ComboboxDropdown
				isOpen={isOpen}
				filteredOptions={filteredOptions}
				handleSelect={handleSelect}
			/>
		</div>
	);
};

const DropdownToggleButton = ({ isOpen, setIsOpen }) => (
	<button
		type="button"
		className="absolute inset-y-0 right-0 flex items-center pr-2"
		onMouseDown={(e) => {
			e.preventDefault();
			e.stopPropagation();
			setIsOpen((prev) => !prev);
		}}
	>
		<ChevronIcon isOpen={isOpen} />
	</button>
);

const ChevronIcon = ({ isOpen }) => (
	<svg
		className={`h-5 w-5 text-gray-400 transform ${isOpen ? 'rotate-180' : ''}`}
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
);

const ComboboxDropdown = ({ isOpen, filteredOptions, handleSelect }) => {
	if (!isOpen) return null;

	return (
		<div className="mt-1 w-full h-60 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg">
			{filteredOptions.length > 0 ? (
				filteredOptions.map((group, idx) => (
					<OptionGroup
						key={group.file_id || idx}
						group={group}
						handleSelect={handleSelect}
					/>
				))
			) : (
				<div className="px-3 py-2 text-gray-500">No results found.</div>
			)}
		</div>
	);
};

const OptionGroup = ({ group, handleSelect }) => (
	<div className="border-b last:border-b-0">
		<div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
			{upperFirst(group.filename || 'File')}
		</div>
		{group.items.map((item) => (
			<div
				key={item.value}
				className="cursor-pointer px-8 py-2 hover:bg-purple-4"
				onMouseDown={() => handleSelect(item, group)}
			>
				{upperFirst(item.label)}
			</div>
		))}
	</div>
);

/* ------------------ AddFieldModal ------------------ */
const AddFieldModal = ({ isOpen, onClose, files = [], onSelect }) => {
	const comboBoxOptions = useMemo(
		() =>
			files.map((file) => ({
				file_id: file.id,
				filename: file.filename,
				items: (file.columns || []).map((col) => ({
					value: col.name,
					label: col.name,
					description: col.description,
					type: col.type || 'string',
				})),
			})),
		[files],
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[500px] items-start w-full p-4 overflow-y-auto">
				<DialogHeader>
					<h3 className="text-lg font-semibold mb-2">Select Column</h3>
				</DialogHeader>
				<div className="mx-auto w-[98%]">
					<ComboBoxOnFire
						options={comboBoxOptions}
						placeholder="Search or select a column"
						onSelection={onSelect}
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
	onResolutionComplete,
	dataSourceDetails,
}) => {
	const [missingFields, setMissingFields] = useState([]);
	const [mappings, setMappings] = useState({});
	const [clarificationAnswers, setClarificationAnswers] = useState({});
	const [hasChanges, setHasChanges] = useState(false);
	const [activeFieldIndex, setActiveFieldIndex] = useState(null);

	const dataMappings = useMemo(
		() =>
			Array.isArray(workflowRunDetails?.data?.data_mapping) &&
			workflowRunDetails.data.data_mapping.length > 0
				? workflowRunDetails.data.data_mapping
				: [],
		[workflowRunDetails],
	);

	const textClarifications = useMemo(
		() =>
			Array.isArray(workflowRunDetails?.data?.clarification)
				? workflowRunDetails.data.clarification.filter(
						(c) => c.type === 'TEXT_CLARIFICATION',
					)
				: [],
		[workflowRunDetails],
	);

	useEffect(() => {
		const missing = dataMappings.flatMap((file) =>
			(file.headers || [])
				.filter((header) => !header.column_name)
				.map((header) => ({
					file_name: file.file_name,
					header_name: header.name,
				})),
		);
		setMissingFields(missing);
	}, [workflowRunDetails, dataMappings]);

	useEffect(() => {
		setHasChanges(false);
		setActiveFieldIndex(null);
		setMappings({});
		setClarificationAnswers({});
	}, [open, workflowRunDetails]);

	const handleClarificationChange = (e, index) => {
		setClarificationAnswers((prev) => ({
			...prev,
			[index]: e.target.value,
		}));
		setHasChanges(true);
	};

	const handleAddFieldSelection = (selection) => {
		if (activeFieldIndex === null) return;

		setMappings((prev) => ({
			...prev,
			[activeFieldIndex]: {
				column_name: selection.label,
				description: selection.description,
				type: selection.type,
				file_id: selection.fileId,
				file_name: selection.fileName,
			},
		}));
		setHasChanges(true);
		setActiveFieldIndex(null);
	};

	const handleContinue = () => {
		const textClarificationResponses = textClarifications.map((clarification, idx) => ({
			response: clarificationAnswers[idx] || '',
			ira_clarification: {
			  description: clarification.description,
			  metadata: clarification.metadata || {},
			}
		  }));

		const finalDataMapping = dataMappings.map((file) => {
			const updatedHeaders = (file.headers || []).map((header) => {
				if (!header.column_name) {
					const missingIndex = missingFields.findIndex(
						(mf) =>
							mf.file_name === file.file_name &&
							mf.header_name === header.name,
					);
					return mappings[missingIndex]
						? { ...header, ...mappings[missingIndex], comments: null }
						: header;
				}
				return header;
			});

			return {
				...file,
				headers: updatedHeaders,
				file_id:
					file.file_id ||
					Object.values(mappings).find(
						(m) => m.file_name === file.file_name && m.file_id,
					)?.file_id ||
					null,
			};
		});

		onResolutionComplete?.({
			textClarification: textClarificationResponses,
			dataMapping: finalDataMapping,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl rounded-lg p-4 text-primary80 animate-in zoom-in-95">
				<ModalHeader />

				<div className="max-h-[500px] overflow-y-auto">
					{missingFields && missingFields.length > 0 && (
						<MissingColumnsSection
							missingFields={missingFields}
							mappings={mappings}
							setActiveFieldIndex={setActiveFieldIndex}
						/>
					)}

					{textClarifications && textClarifications.length > 0 && (
						<ClarificationSection
							textClarifications={textClarifications}
							clarificationAnswers={clarificationAnswers}
							handleClarificationChange={handleClarificationChange}
							missingFields={missingFields}
						/>
					)}
				</div>

				<ModalFooter
					onCancel={() => onOpenChange(false)}
					onContinue={handleContinue}
					hasChanges={hasChanges}
				/>

				<AddFieldModal
					isOpen={activeFieldIndex !== null}
					onClose={() => setActiveFieldIndex(null)}
					files={dataSourceDetails?.processed_files?.files || []}
					onSelect={handleAddFieldSelection}
				/>
			</DialogContent>
		</Dialog>
	);
};

const ModalHeader = () => (
	<DialogHeader>
		<div className="flex gap-4 items-center">
			<img
				src="https://d2vkmtgu2mxkyq.cloudfront.net/file_validation_error_modal_header.svg"
				alt="error icon"
			/>
			<div className="flex flex-col">
				<h2 className="text-lg font-semibold text-black/90">
					Validation Errors
				</h2>
				<p className="text-sm text-black/60">Missing columns error report</p>
			</div>
		</div>
	</DialogHeader>
);

const MissingColumnsSection = ({ missingFields, mappings, setActiveFieldIndex }) => {
	const hasMissingFields = missingFields && missingFields.length > 0;

	return (
		<>
			<h3 className="mx-2 text-lg mb-1 font-semibold">Missing Columns</h3>
			<Separator className="mx-2" />

			{hasMissingFields ? (
				<>
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
							{missingFields.map((mf, index) => (
								<div
									key={index}
									className="grid grid-cols-12 border-b-2"
								>
									<div className="col-span-2 py-1 px-3 border-r-2">
										{index + 1}
									</div>
									<div className="col-span-4 py-1 px-3 border-r-2 font-medium">
										{upperFirst(mf.header_name)}
									</div>
									<div className="col-span-6 py-1 px-3">
										<FieldButton
											index={index}
											mappings={mappings}
											onClick={() =>
												setActiveFieldIndex(index)
											}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			) : (
				<div className="flex justify-center items-center h-32">
					No missing column found.
				</div>
			)}
		</>
	);
};

const FieldButton = ({ index, mappings, onClick }) => (
	<Button
		variant="outline"
		className={cn(
			'w-full justify-between border-none hover:bg-transparent hover:text-black/50 cursor-pointer',
			mappings[index]?.column_name ? 'text-black/80' : 'text-purple-100',
		)}
		onClick={onClick}
	>
		{mappings[index]?.column_name
			? upperFirst(mappings[index].column_name)
			: '+ Add Field'}
	</Button>
);

const ClarificationSection = ({
	textClarifications,
	clarificationAnswers,
	handleClarificationChange,
	missingFields
}) => {
	const hasClarifications = textClarifications && textClarifications.length > 0;

	if (!hasClarifications) {
		return (
			<div className="mx-2 mt-6">
				<h3 className="text-lg mx-2 font-semibold">Clarification</h3>
				<Separator className="mx-2" />
				<div className="flex justify-center items-center h-32">
					No clarifications required.
				</div>
			</div>
		);
	}

	return (
		<div className={`mx-2 ${missingFields?.length > 0 && 'mt-6'}`}>
			<h3 className="text-lg mx-2 font-semibold">Clarification</h3>
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
							onChange={(e) => handleClarificationChange(e, index)}
							className="w-full px-3 py-2 border text-black/60 rounded-md bg-purple-4/8 focus:outline-none resize-none h-32 min-h-[8rem]"
							placeholder="Enter your answer..."
						/>
					</div>
				))}
			</div>
		</div>
	);
};

const ModalFooter = ({ onCancel, onContinue, hasChanges }) => (
	<div className="flex mx-2 justify-between gap-3 pt-4">
		<Button className="w-1/2" variant="outline" onClick={onCancel}>
			Cancel
		</Button>
		<Button
			onClick={onContinue}
			disabled={!hasChanges}
			className={cn(
				'w-1/2 hover:bg-purple-100 hover:text-white hover:opacity-80',
				!hasChanges && 'opacity-50 cursor-not-allowed',
			)}
		>
			Continue
		</Button>
	</div>
);
