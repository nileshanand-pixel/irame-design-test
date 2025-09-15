import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const Glossary = ({ data, setForm, form, addChangeForTracking }) => {
	const [localForm, setLocalForm] = useState(form?.glossary?.items);

	// Handle input change, update only if there's an actual change
	const handleChange = (index, key, value) => {
		if (localForm[index][key] !== value) {
			const updatedGlossaries = [...localForm];
			updatedGlossaries[index] = {
				...updatedGlossaries[index],
				[key]: value,
				type: 'manual', // Set type to manual when changes occur
			};
			setLocalForm(updatedGlossaries);

			// Update only processed_files.glossary.items in the form, do not rewrite the whole form
			const updatedForm = {
				...form,
				hasChanges: true,
				glossary: {
					...form.glossary,
					items: updatedGlossaries,
				},
			};
			setForm(updatedForm);
		}
	};

	// Add more glossary entries
	const addMoreGlossary = () => {
		trackEvent(
			EVENTS_ENUM.DATASET_GLOSARRY_ADD_MORE_CLICKED,
			EVENTS_REGISTRY.DATASET_GLOSARRY_ADD_MORE_CLICKED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
			}),
		);
		addChangeForTracking('glossary_new');
		const newGlossary = { term: '', meaning: '', type: 'manual' };
		const updatedGlossaries = [...localForm, newGlossary];
		setLocalForm(updatedGlossaries);

		// Update only processed_files.glossary.items in the form when adding a new entry
		const updatedForm = {
			...form,
			hasChanges: true,
			glossary: {
				...form.glossary,
				items: updatedGlossaries,
			},
		};
		setForm(updatedForm);
	};

	// Delete glossary entry
	const deleteGlossary = (index) => {
		const updatedGlossaries = localForm.filter((_, i) => i !== index);
		setLocalForm(updatedGlossaries);

		// Update only processed_files.glossary.items in the form when deleting an entry
		const updatedForm = {
			...form,
			hasChanges: true,
			glossary: {
				...form.glossary,
				items: updatedGlossaries,
			},
		};
		setForm(updatedForm);
		const glossaryData = data?.glossary?.items[index];
		trackEvent(
			EVENTS_ENUM.DATASET_GLOSARRY_DELETED,
			EVENTS_REGISTRY.DATASET_GLOSARRY_DELETED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				glossary_term: glossaryData?.term,
				glossary_desc: glossaryData?.meaning,
			}),
		);
		addChangeForTracking('glossary_delete');
	};

	return (
		<div className="flex flex-col h-full overflow-y-auto gap-4 text-primary80">
			<div className="flex flex-col mb-4">
				<div className="font-semibold">Add Glossary</div>
				<div className="text-primary60 font-medium">
					Add ratios, KPIs, industry jargons in glossary
				</div>
			</div>

			{localForm.map((glossary, index) => (
				<div
					key={index}
					className="flex flex-row gap-4 items-start justify-center"
				>
					<div className="w-1/4 flex flex-col gap-2">
						<Label>Term</Label>
						<div className="flex justify-between items-center">
							<textarea
								placeholder="Enter Word Here"
								defaultValue={glossary.term}
								onChange={(e) => {
									trackEvent(
										EVENTS_ENUM.DATASET_GLOSARRY_TERM_EDITED,
										EVENTS_REGISTRY.DATASET_GLOSARRY_TERM_EDITED,
										() => ({
											dataset_id: data?.datasource_id,
											dataset_name: data?.name,
											old_glossary_term: glossary.term,
											new_glossary_term: e.target.value,
										}),
									);
									addChangeForTracking('glossary_edit_term');
									handleChange(index, 'term', e.target.value);
								}}
								className="w-full border p-2 border-gray-300 rounded-md resize-none"
							/>
							{/* Delete Button next to Word */}
						</div>
						<div className="flex flex-row-reverse  text-purple-80">
							<span
								onClick={() => deleteGlossary(index)}
								className="material-symbols-outlined cursor-pointer text-2xl"
							>
								delete
							</span>
						</div>
					</div>

					<div className="w-full md:w-3/4 flex flex-col gap-2">
						<Label>Definition</Label>
						<textarea
							placeholder="Enter Definition Here"
							defaultValue={glossary.meaning}
							onChange={(e) => {
								trackEvent(
									EVENTS_ENUM.DATASET_GLOSARRY_DESC_EDITED,
									EVENTS_REGISTRY.DATASET_GLOSARRY_DESC_EDITED,
									() => ({
										dataset_id: data?.datasource_id,
										dataset_name: data?.name,
										old_glossary_desc: glossary.meaning,
										new_glossary_desc: e.target.value,
									}),
								);
								addChangeForTracking('glossary_edit_desc');
								handleChange(index, 'meaning', e.target.value);
							}}
							className="w-full border p-2 border-gray-300 rounded-md resize-none"
						/>
						<div className="flex justify-end">
							{glossary.type === 'auto' && (
								<div className="flex items-center shadow-md px-2 py-1 gap-2 w-fit rounded-full bg-purple-8 ">
									<img
										src="https://d2vkmtgu2mxkyq.cloudfront.net/generate_ai.svg"
										className="size-6"
										style={{ strokeWidth: '4' }}
									/>
									<span className="text-xs text-gray-500">
										AI Generated
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			))}

			{localForm?.length === 0 && (
				<h3 className="text-primary80 text-center text-lg">
					No Glossaries Available. Please add one
				</h3>
			)}

			<div className="flex">
				<button
					onClick={addMoreGlossary}
					className="hover:underline text-start text-sm font-semibold text-purple-100"
				>
					+ Add more
				</button>
			</div>
		</div>
	);
};

export default Glossary;
