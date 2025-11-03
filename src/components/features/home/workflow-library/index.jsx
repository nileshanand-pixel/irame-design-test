import { Button } from '@/components/ui/button';
import libarayIcon from '@/assets/icons/library.svg';
import Tabs from '../shared/tabs';
import { useState } from 'react';
import FeaturedTabContent from './tab-content/featured-tab-content';
import BuildWorkflowTabContent from './tab-content/build-workflow-tab-content';
import { useNavigate } from 'react-router-dom';

const TABS = [
	{
		label: 'Featured',
		component: FeaturedTabContent,
		// tooltip: 'Browse our curated collection of featured workflows',
	},
	{
		label: 'Build Workflows',
		isCommingSoon: true,
		component: BuildWorkflowTabContent,
		// tooltip: 'Create custom workflows tailored to your needs',
	},
];

export default function WorkflowLibrary() {
	const [activeTabData, setActiveTabData] = useState(TABS[0]);

	const ActiveComponent = activeTabData?.component;
	const navigate = useNavigate();

	return (
		<div className="w-[70%] p-4 rounded-2xl border border-[#00000014]">
			<div className="flex justify-between mb-4">
				<div>
					<div className="text-[#000000CC] font-semibold">
						Workflow Library
					</div>

					<div className="text-[#00000066] text-xs font-medium">
						Automate audit processes in just a few clicks
					</div>
				</div>

				<Button
					variant="outline"
					className="text-[#6A12CD] hover:text-[#6A12CD]"
					onClick={() => navigate('/app/business-process')}
				>
					<img src={libarayIcon} className="size-5" />

					<span>View Workflow Library</span>
				</Button>
			</div>

			<Tabs
				items={TABS}
				isActive={(item) => {
					return item.label === activeTabData.label;
				}}
				onChange={(item) => {
					setActiveTabData(item);
				}}
			/>

			{ActiveComponent && <ActiveComponent />}
		</div>
	);
}
