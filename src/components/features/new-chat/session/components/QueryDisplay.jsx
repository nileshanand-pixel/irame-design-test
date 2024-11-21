import { SelectSeparator } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { useSelector } from 'react-redux';

const QueryDisplay = ({ bulkPrompt = [], mode, prompt, workflowTitle }) => {
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	if (!bulkPrompt || !prompt) {
		return <Skeleton className="h-6 w-full bg-purple-8 ms-1" />;
	}
	if (mode === 'single' && prompt) {
		return (
			<p className="max-w-[90%] ms-2 bg-purple-4 text-primary80 font-medium px-4 py-2 rounded-tl-[80px] rounded-tr-[6px] rounded-br-[80px] rounded-bl-[80px] min-h-6">
				{prompt}
			</p>
		);
	}

	const getLabel = (index) => {
		const labelNumber = ` ${String(index + 1).padStart(2, '0')}`;
		switch (mode) {
			case 'bulk':
				return 'Query' + labelNumber;
			case 'workflow':
				return 'Step' + labelNumber;
			default:
				return;
		}
	};

	return (
		<div className="space-y-4 bg-[#6A12CD0A] px-2 py-4 rounded-lg w-2/5">
			{bulkPrompt?.map((query, index) => (
				<>
					{mode === 'workflow' && index === 0 && (
						<>
							<span className="text-sm px-2 font-medium  text-primary40 ">
								{workflowTitle || 'Untitled Workflow'}
							</span>
							<Separator className="!mt-1 !ml-2 w-9/10" />
						</>
					)}
					<div key={query.id} className="px-2 rounded-lg">
						<h2 className="text-xs font-semibold text-[#26064A66] ">
							{getLabel(index) + ':'}
						</h2>
						<p className="text-[#26064A] ">{query.text}</p>
					</div>
					{index !== bulkPrompt.length - 1 && <Separator />}
				</>
			))}
		</div>
	);
};

export default QueryDisplay;
