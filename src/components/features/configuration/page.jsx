import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import DismissibleBanner from '@/components/elements/dismissible-banner';
import CreateDatasource from './components/create-datasource';
import ExistingDataSources from './components/existing-datasources';

const Configuration = () => {
	const [showForm, setShowForm] = useState(false);

	const { query } = useRouter();

	useEffect(() => {
		trackEvent(
			EVENTS_ENUM.CONFIG_PAGE_LOADED,
			EVENTS_REGISTRY.CONFIG_PAGE_LOADED,
			() => ({
				source: query?.source || 'url',
			}),
		);
	}, [query]);

	return (
		<div className="flex flex-col gap-4  w-full h-full">
			{/* Upload Section */}
			<div className="px-8 flex-none mt-2">
				<div className="text-primary80 gap-2">
					<span className="text-2xl font-semibold">Configuration</span>
					<span className="text-sm font-medium">
						&gt; Connect New Dataset
					</span>
				</div>
				<div className=" mt-2">
					<DismissibleBanner
						id="talk-to-documents"
						title="Talk to your documents!"
						description="Click 'Upload Dataset' and add your documents (PDFs) to get started"
					/>
				</div>
				<div className={cn('mt-6', showForm ? 'flex-1' : '')}>
					<CreateDatasource
						showForm={showForm}
						onShowFormChange={setShowForm}
					/>
				</div>
			</div>

			{/* Right Section Manage Data Source */}
			{!showForm && <ExistingDataSources showForm={showForm} />}
		</div>
	);
};

export default Configuration;
