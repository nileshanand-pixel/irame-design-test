import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

export default function SingleChoice({ data, addClarificationQuery, canClarify }) {
	const toolData = data?.tool_data;
	const is_clarified = data?.is_clarified;

	const [options, setOptions] = useState(
		toolData?.options ||
			[
				// {
				// 	text: 'Option 1',
				// 	response_type: 'radio',
				// 	selected: false,
				// },
				// {
				// 	text: 'Option 2',
				// 	response_type: 'radio',
				// 	selected: false,
				// },
				// {
				// 	text: 'Other: ',
				// 	response_type: 'text',
				// 	response_text: 'something',
				// 	selected: false,
				// },
			],
	);

	const handleSelectOption = (text) => {
		if (is_clarified) return;

		setOptions(
			options.map((option) => ({
				...option,
				selected: option?.text === text,
			})),
		);
	};

	const handleTextValueChange = (e, text) => {
		setOptions(
			options.map((option) => ({
				...option,
				response_text:
					option?.text === text ? e.target.value : option?.response_text,
			})),
		);
	};

	const handleSendClick = async () => {
		if (is_clarified) return;

		if (!options?.find((opt) => opt.selected)) {
			toast.error('Please select an option');
			return;
		}

		if (options?.find((opt) => opt.selected && opt.response_type === 'text')) {
			if (!options?.find((opt) => opt.selected)?.response_text) {
				toast.error('Please enter a value');
				return;
			}
		}

		try {
			await addClarificationQuery({
				...data,
				tool_data: {
					...data?.tool_data,
					options: [...options],
				},
			});
		} catch (error) {
			// Error is handled in addClarificationQuery
			console.error('Failed to send clarification:', error);
		}
	};

	return (
		<div className="">
			<p
				className="text-primary80 font-medium cursor-default mb-5"
				style={{ whiteSpace: 'pre-wrap' }}
				dangerouslySetInnerHTML={{
					__html: toolData?.text,
				}}
			></p>

			<div className="max-h-[18.75rem] overflow-y-auto">
				<RadioGroup
					value={options?.find((opt) => opt.selected)?.text}
					onValueChange={handleSelectOption}
					className="flex flex-col gap-4"
					disabled={is_clarified}
				>
					{options?.map((option) => (
						<div
							key={option?.text}
							className={`flex flex-col gap-2 py-4 px-2 rounded-lg border transition-all cursor-pointer ${
								option.selected
									? 'border-[#6A12CD80] bg-[#6A12CD0A] text-[#26064ACC]'
									: 'border-[#6A12CD1A] hover:border-gray-300 text-[#26064ACC]'
							}`}
							onClick={() => handleSelectOption(option?.text)}
						>
							<div className="flex items-center gap-2 ">
								<RadioGroupItem
									value={option?.text}
									id={option?.text}
									className={
										option.selected
											? 'border-purple-600 text-purple-600'
											: ''
									}
								/>
								<Label
									htmlFor={option?.text}
									className="cursor-pointer flex-1 text-sm leading-relaxed"
								>
									{option.text}
								</Label>
							</div>
							{option?.response_type === 'text' && option.selected && (
								<Input
									type="text"
									value={option?.response_text}
									onChange={(e) =>
										handleTextValueChange(e, option?.text)
									}
									className="mt-1 w-[98%] disabled:cursor-auto"
									onClick={(e) => e.stopPropagation()}
									disabled={is_clarified}
								/>
							)}
						</div>
					))}
				</RadioGroup>
			</div>

			<div className="flex justify-end">
				<Button
					variant="outline"
					className="mt-4"
					onClick={handleSendClick}
					disabled={is_clarified || !canClarify}
				>
					Send
				</Button>
			</div>
		</div>
	);
}
