import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ConnectDatasourceButton from '../connect-data-source/connect-datasource-button';

const DataSourceCard = () => {
	return (
		<>
			<Card className="mb-8 text-primary80 border rounded-xl shadow-none">
				<CardHeader>
					<div className="flex justify-between">
						<div>
							<CardTitle className="text-lg font-semibold">
								Data Source
							</CardTitle>
							<CardDescription className="text-sm text-primary60">
								Securely connect to a datasource
							</CardDescription>
						</div>
						<ConnectDatasourceButton />
					</div>
				</CardHeader>
			</Card>
		</>
	);
};

export default DataSourceCard;
