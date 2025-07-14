import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import upperFirst from 'lodash.upperfirst';

const BusinessProcessCard = ({ process, onClick }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleCaretClick = (e) => {
		e.stopPropagation();
		setIsExpanded(!isExpanded);
	};

	return (
		<Card
			key={process.external_id}
			className="hover:bg-[#F9F6FD]/80 hover:border-primary16 cursor-pointer "
			onClick={onClick}
		>
			<CardHeader>
				<div className="flex text-primary100 gap-2">
					<span className="material-symbols-outlined w-fit rounded-lg bg-white p-2 border border-primary10">
						family_history
					</span>
				</div>
			</CardHeader>
			<CardContent className="text-primary100">
				<div className="flex justify-between items-start">
					<CardTitle className="text-base font-semibold">
						{upperFirst(process.name)}
					</CardTitle>
					<span
						className="material-symbols-outlined text-primary60 cursor-pointer"
						onClick={handleCaretClick}
					>
						{isExpanded ? 'expand_less' : 'expand_more'}
					</span>
				</div>

				<p className="text-primary80 text-sm mb-4 line-clamp-2 h-10">
					{process.description}
				</p>

				<div className="flex flex-wrap items-end gap-2">
					{process?.tags?.map((tag, index) => (
						<Badge
							key={index}
							variant="outline"
							className="px-2 py-1 bg-primary4 text-primary80 font-medium border-none"
						>
							{upperFirst(tag)}
						</Badge>
					))}
				</div>

				{isExpanded ? (
					<div className="flex flex-col gap-1 mt-4">
						{process.workflows.map((workflow) => (
							<div
								key={workflow.external_id}
								className=" flex items-start gap-2 text-primary60 text-sm py-1 rounded"
							>
								<span className="material-symbols-outlined rotate-180 text-primary40 ">
									reply
								</span>
								<span className="font-medium">
									{upperFirst(workflow.name)}
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="flex text-primary60 items-center gap-2 text-sm mt-4">
						<span className="material-symbols-outlined rotate-180 text-primary40 ">
							reply
						</span>
						<span>
							{process.workflow_count} workflow
							{process.workflow_count !== 1 ? 's' : ''}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default BusinessProcessCard;
