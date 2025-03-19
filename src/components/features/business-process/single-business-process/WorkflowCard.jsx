import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import capitalize from 'lodash.capitalize';
import { useNavigate, useParams } from 'react-router-dom';

const WorkflowCard = ({ workflow }) => {
	const isActive = workflow.status === 'ACTIVE';
	const { businessProcessId } = useParams();
	const cardClass = isActive
		? 'bg-purple-2 text-primary80'
		: 'bg-misc-black4 text-black/80';
	const badgeClass = isActive
		? 'bg-primary4 text-primary60'
		: 'bg-misc-black4 text-black60';
	const navigate = useNavigate();

	const handleCardClick = (externalId) => {
		navigate(
			`/app/business-process/${businessProcessId}/workflows/${externalId}`,
		); 
	};

	return (
		<Card
			className={`mb-4 ${cardClass}  hover:bg-[#F9F6FD]/80 border-primary16/0 hover:border-primary16 border-[1.5px] cursor-pointer`}
			onClick={() => handleCardClick(workflow.external_id)} 
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					<span className="material-symbols-outlined text-3xl">
						splitscreen_add
					</span>
					<div className="flex flex-col gap-1">
						<p className="text-base font-medium">
							{capitalize(workflow.name)}
						</p>
						<p className="mb-1 text-sm">{capitalize(workflow.description)}</p>
						<div className="flex gap-2">
							{workflow.tags.map((tag, index) => (
								<Badge
									key={index}
									variant="outline"
									className={`px-2 py-[2px] text-xs font-medium ${badgeClass} border-none`}
								>
									{capitalize(tag)}
								</Badge>
							))}
							<Badge
								variant="outline"
								className={`flex justify-center text-xs items-center border-none font-medium ${badgeClass}`}
							>
								{capitalize(workflow.status.toLowerCase())}
								<span className="material-symbols-outlined text-base">
									keyboard_arrow_down
								</span>
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default WorkflowCard;
