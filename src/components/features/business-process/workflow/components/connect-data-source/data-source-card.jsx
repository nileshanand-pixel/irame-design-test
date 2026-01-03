import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ConnectDatasourceButton from './connect-datasource-button';

const CARD_CONFIG = {
	SQL_WORKFLOW: {
		title: 'Execute Workflow',
		description: 'Run the workflow with the selected filters',
		buttonText: 'Execute Workflow',
	},
	DEFAULT: {
		title: 'Data Source',
		description: 'Securely connect to a data source',
		buttonText: 'Connect Data Source',
	},
};

const DataSourceCard = ({ workflowDetails, workflowId }) => {
	const workflowType = workflowDetails?.data?.type?.toUpperCase();

	const cardConfig = useMemo(() => {
		return CARD_CONFIG[workflowType] || CARD_CONFIG.DEFAULT;
	}, [workflowType]);

	return (
		<Card className="text-primary80 border rounded-xl shadow-none">
			<CardHeader>
				<div className="flex justify-between">
					<div>
						<CardTitle className="text-base font-semibold text-primary80 mb-1">
							{cardConfig.title}
						</CardTitle>
						<CardDescription className="text-sm text-primary40">
							{cardConfig.description}
						</CardDescription>
					</div>

					<ConnectDatasourceButton
						workflowId={workflowId}
						buttonText={cardConfig.buttonText}
					/>
				</div>
			</CardHeader>
		</Card>
	);
};

export default DataSourceCard;
