import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import DismissibleBanner from '@/components/elements/dismissible-banner';
import CreateDatasource from './components/create-datasource';
import ExistingDataSources from './components/existing-datasources';
import { Database } from '@phosphor-icons/react';
import { ChevronRight } from 'lucide-react';

const BreadCrumbs = ({ items }) => {
	return (
		<div className="flex items-center gap-2">
			{items.map((item, index) => (
				<div key={index} className="flex items-center gap-2">
					{item.icon}
					<span
						className={cn(
							index === items.length - 1 &&
								'text-[#6A12CD] font-medium',
						)}
					>
						{item.label}
					</span>

					{index < items.length - 1 && (
						<ChevronRight className="size-5 text-[#26064ACC]" />
					)}
				</div>
			))}
		</div>
	);
};

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
		<div className="flex flex-col gap-4 w-full h-full">
			{/* Upload Section */}
			<div className={cn('flex flex-col px-8 mt-2', showForm && 'h-full')}>
				<BreadCrumbs
					items={[
						{
							label: 'Configuration',
							icon: <Database className="size-5" />,
						},
						{
							label: 'Connect New Dataset',
						},
					]}
				/>
				<div className="mt-2">
					<DismissibleBanner
						id="talk-to-documents"
						title="Talk to your documents!"
						description="Click 'Upload Dataset' and add your documents (PDFs) to get started"
					/>
				</div>
				<div className={cn('mt-6 mb-3', showForm ? 'flex-1' : '')}>
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
