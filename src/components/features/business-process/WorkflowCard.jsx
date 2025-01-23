import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import capitalize from 'lodash.capitalize';
import { useNavigate, useParams } from 'react-router-dom';

const WorkflowCard = ({ workflow }) => {
	const isActive = workflow.status === 'ACTIVE';
	const { businessProcessId } = useParams();
	const cardClass = isActive
		? 'bg-purple-4 text-primary80'
		: 'bg-misc-black4 text-black/80';
	const badgeClass = isActive
		? 'bg-primary8 text-primary60'
		: 'bg-misc-black4 text-black60';
	const navigate = useNavigate(); // Initialize useNavigate

	// Handle card click
	const handleCardClick = (externalId) => {
		navigate(
			`/app/business-process/${businessProcessId}/workflows/${externalId}`,
		); // Navigate to the new route
	};

	return (
		<Card
			className={`mb-4 ${cardClass} border-none hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
			onClick={() => handleCardClick(workflow.external_id)} // Add onClick handler
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					<span className="material-symbols-outlined text-3xl">
						splitscreen_add
					</span>
					<div className="flex flex-col">
						<p className="text-lg font-semibold">
							{capitalize(workflow.name)}
						</p>
						<p className="mb-3">{capitalize(workflow.description)}</p>
						<div className="flex gap-2">
							{workflow.tags.map((tag, index) => (
								<Badge
									key={index}
									variant="outline"
									className={`px-2 py-1 font-medium ${badgeClass} border-none`}
								>
									{capitalize(tag)}
								</Badge>
							))}
							<Badge
								variant="outline"
								className={`flex justify-center items-center font-medium ${badgeClass}`}
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
