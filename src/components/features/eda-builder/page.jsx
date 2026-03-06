import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import EDAHeader from './components/EDAHeader';
import EDATabs from './components/EDATabs';
import GeneratorTab from './components/generator/GeneratorTab';
import HistoryTab from './components/history/HistoryTab';
import { EDA_TABS } from './constants/eda.constants';

const EDABuilderPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedJobId, setSelectedJobId] = useState(null);

	const activeTab = useMemo(() => {
		const tabParam = searchParams.get('tab');
		return tabParam &&
			Object.values(EDA_TABS)
				?.map((t) => t.value)
				.includes(tabParam)
			? tabParam
			: EDA_TABS.GENERATOR.value;
	}, [searchParams]);

	useEffect(() => {
		if (!searchParams.get('tab')) {
			setSearchParams({ tab: activeTab }, { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleTabChange = useCallback(
		(value) => {
			setSearchParams({ tab: value }, { replace: true });
		},
		[setSearchParams],
	);

	const handleViewJob = useCallback(
		(jobId) => {
			setSelectedJobId(jobId);
			setSearchParams({ tab: EDA_TABS.GENERATOR.value }, { replace: true });
		},
		[setSearchParams],
	);

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-1">
			<EDAHeader />

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="h-[calc(100%-3rem)]"
			>
				<EDATabs />

				<div className="h-[calc(100%-5rem)] overflow-auto pt-4">
					<TabsContent value={EDA_TABS.GENERATOR.value} className="mt-0">
						<GeneratorTab
							selectedJobId={selectedJobId}
							onJobIdChange={setSelectedJobId}
						/>
					</TabsContent>

					<TabsContent value={EDA_TABS.HISTORY.value} className="mt-0">
						<HistoryTab onViewJob={handleViewJob} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};

export default EDABuilderPage;
