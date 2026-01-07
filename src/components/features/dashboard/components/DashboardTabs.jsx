import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DASHBOARD_TABS } from '../constants/dashboard.constants';

const DashboardTabs = () => {
	return (
		<div className="mb-6">
			<TabsList className="bg-transparent p-0 rounded-none border-none gap-8">
				{Object.values(DASHBOARD_TABS).map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						className={cn(
							'pb-[0.375rem] text-sm px-0 font-medium border-b-[0.1875rem] border-transparent data-[state=active]:border-[#6A12CD] data-[state=active]:text-primary100 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all data-[state=inactive]:text-[#26064ACC]',
						)}
					>
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>
			<div className="border-b border-gray-200 mt-[-3px]"></div>
		</div>
	);
};

export default DashboardTabs;
