import React, { useState, useRef } from 'react';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { intent as intentMap } from '../configuration.content';
import PreviewTable from './PreviewTable';


const DataCard = ({data, form, setForm }) => {
	const [isEditingDescription, setIsEditingDescription] = useState(false); // To manage the editing state
	const [description, setDescription] = useState(form?.processed_files?.description); // Current description
	const [originalDescription, setOriginalDescription] = useState(description); // Save the original description
	const editRef = useRef(null); // Ref to manage the contentEditable div

	// Toggle the description into edit mode
	const handleDescriptionEdit = () => {
		setIsEditingDescription(true);
		setOriginalDescription(description); // Save the current state in case of cancel
	};

	// Save the edited description
	const handleDescriptionSave = () => {
		setIsEditingDescription(false); // Exit edit mode
		const updatedDescription = editRef.current.innerText; // Get content from the contentEditable div
		setDescription(updatedDescription); // Update the description in state
		setForm({
			...form,
			hasChanges: true,
			processed_files: {
				...form.processed_files,
				description: updatedDescription,
			},
		});
	};

	// Cancel the editing and revert changes
	const handleCancel = () => {
		setIsEditingDescription(false); // Exit edit mode
		setDescription(originalDescription); // Revert to the original description
	};

	return (
		<div className="col-span-4 h-full overflow-y-auto text-primary80">
			{/* Dataset description */}
			<div className="font-medium w-full flex flex-col gap-2">
				<div className="text-xl font-semibold">About Dataset</div>
				{isEditingDescription ? (
					<div>
						{/* ContentEditable div for inline editing */}
						<div
							ref={editRef}
							contentEditable
							autoFocus
							className="border-none bg-transparent"
							style={{ whiteSpace: 'pre-wrap' }}
						>
							{description}
						</div>
						{/* Save and Cancel buttons */}
						<div className="mt-4 flex gap-4">
							<Button
								variant="outline"
								onClick={handleCancel}
								className="text-sm font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
							>
								Cancel
							</Button>
							<Button
								onClick={handleDescriptionSave}
								className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
							>
								Save
							</Button>
						</div>
					</div>
				) : (
					<div>
						{/* Display the description */}
						<p className="whitespace-pre-wrap">{description || 'No Description Added, Please Add description'}</p>
						{/* Edit button */}
						<Button
							variant="outline"
							onClick={handleDescriptionEdit}
							className="text-sm mt-4 font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
						>
							{description ? 'Edit Description' : 'Add Description'}
						</Button>
					</div>
				)}
			</div>

			{/* Display chosen analysis type */}
			<div className="my-4">
				<div className="text-xl font-semibold">Chosen Analysis Type</div>
				<div className="flex flex-wrap gap-2 mt-2">
					{Array.isArray(data?.intent) &&
						data?.intent?.map((useCase, index) => (
							<span
								key={useCase}
								className="text-sm font-normal px-3 py-1.5 rounded-[30px] cursor-default hover:bg-purple-8 bg-purple-8 text-purple-100 border-[1.2px] border-primary"
							>
								{intentMap.find((item) => item.value === useCase).label}
							</span>
						))}
				</div>
			</div>

			{/* Accordion for processed files */}
			<Accordion type="single" className='border-none' defaultValue={form?.processed_files?.files[0]?.id} collapsible>
				{form?.processed_files?.files.map((file, fileIndex) => (
					<AccordionItem key={file?.id} value={file?.id}>
						<AccordionTrigger className="bg-purple-4 rounded-lg py-2 pl-4 pr-2 mt-2 border-none no-underline" >{file.filename}</AccordionTrigger>
						<AccordionContent>
							<div className="overflow-x-auto mt-4">
								<PreviewTable form={form} setForm={setForm} data={file}/>
							</div>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};

export default DataCard;
