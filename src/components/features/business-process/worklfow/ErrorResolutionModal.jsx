import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn, getFileIcon } from '@/lib/utils';
import DividerWithText from '@/components/elements/DividerWithText';
import { Label } from '@/components/ui/label';

const gradientStyle = {
	background: `
linear-gradient(180deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.04) 100%)`,
};

export const ErrorResolutionModal = ({
	open,
	onOpenChange,
	file,
	onResolutionComplete,
}) => {
	const [mappings, setMappings] = useState({});
	const [clarification, setClarification] = useState('');
	const [hasChanges, setHasChanges] = useState(false);

	// Mock columns data
	const availableColumns = [
		'Name',
		'Address',
		'Phone',
		'Company',
		'JobTitle',
		...Array.from(
			{ length: 43 },
			(_, i) => `Column_${(i + 1).toString().padStart(2, '0')}`,
		),
	];

	const missingFields = file?.missingFields || ['Email', 'Name', 'Job', 'City'];

	useEffect(() => {
		const initialMappings = {};
		missingFields.forEach((_, index) => {
			initialMappings[index] = '';
		});
		setMappings(initialMappings);
		setClarification('');
		setHasChanges(false);
	}, [file]);

	const handleMappingChange = (fieldIndex, selectedColumn) => {
		setMappings((prev) => ({
			...prev,
			[fieldIndex]: selectedColumn,
		}));
		setHasChanges(true);
	};

	const handleClarificationChange = (e) => {
		setClarification(e.target.value);
		setHasChanges(true);
	};

	const handleContinue = () => {
		onResolutionComplete({
			fileName: file.fileName,
			mappings,
			clarification,
		});
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

				<div className="flex mx-2 flex-col space-y-2 gap-4">
					<div
						className="p-2 border-[1.5px] border-purple-1 rounded-lg hover:bg-gray-50 flex justify-between items-center"
						style={gradientStyle}
					>
						<div className="flex gap-2 items-center">
							<img
								src={getFileIcon(file?.fileName)}
								alt="file-icon"
								className="size-6"
							/>
							<h3 className="font-medium">{file?.fileName}</h3>
						</div>
						<div>{availableColumns.length} Columns</div>
					</div>
					<div className="text-state-error gap-2 items-center font-semibold flex w-fit bg-stateBg-inProgress px-3 py-1 rounded-md text-sm">
						<span className="material-symbols-outlined">error</span>
						Required Field not found: {file?.missingFields?.length || 0}
					</div>
				</div>

				{/* Scrollable Table Section */}
				<div className="border-2 mx-2 rounded-lg overflow-hidden">
					<div className="sticky top-0 grid grid-cols-12 bg-gray-100 text-black font-semibold text-sm border-b-2 z-10">
						<div className="col-span-2 flex items-center py-4 px-3 border-r-2">
							S. No.
						</div>
						<div className="col-span-4 flex py-4 px-3 items-center border-r-2">
							Required Field
						</div>
						<div className="col-span-6 flex py-4 px-3 items-center">
							Add Field
						</div>
					</div>

					<div className="max-h-52 overflow-y-auto">
						{file?.missingFields?.map((field, index) => (
							<div
								key={index}
								className={`grid grid-cols-12 ${index === file?.missingFields?.length - 1 ? '' : 'border-b-2'}`}
							>
								<div className="col-span-2 hover:bg-gray-100 flex items-center py-1 px-3 border-r-2">
									{index + 1}
								</div>
								<div className="col-span-4 flex hover:bg-gray-100 items-center py-1 px-3 border-r-2 font-medium">
									{field}
								</div>
								<div className="col-span-6 flex items-center py-1 px-3">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className={cn(
													'w-full justify-between border-none hover:bg-transparent hover:text-black/50 cursor-pointer outline-none',
													mappings[index]
														? 'text-black/80'
														: 'text-purple-100',
												)}
											>
												{mappings[index] || '+ Add Field'}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="max-h-60 w-64 overflow-y-auto p-0">
											{availableColumns.map((column) => (
												<DropdownMenuItem
													key={column}
													onSelect={() =>
														handleMappingChange(
															index,
															column,
														)
													}
													className="hover:bg-purple-4 text-primary80 px-4 py-2 flex justify-between items-center"
												>
													<span>{column}</span>
													{mappings[index] === column && (
														<span className="material-symbols-outlined text-purple-100">
															check
														</span>
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))}
					</div>
				</div>

				<DividerWithText className="-my-2" text="Or" />

				{/* Scrollable Textarea */}
				<div className="mx-2 flex flex-col">
					<Label
						htmlFor="clarification_text"
						className="block font-medium text-lg mb-1"
					>
						Write Clarification
					</Label>
					<textarea
						id="clarification_text"
						value={clarification}
						onChange={handleClarificationChange}
						className="w-full px-3 py-2 border text-black/60 rounded-md bg-purple-4/8 focus:outline-none 
                     resize-none max-h-48 overflow-y-auto h-32 min-h-[8rem]"
						placeholder="Enter your clarification..."
					/>
				</div>

				{/* Footer Buttons */}
				<div className="flex justify-between gap-3 pt-4">
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
							'w-1/2',
							!hasChanges && 'opacity-50 cursor-not-allowed',
						)}
					>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
