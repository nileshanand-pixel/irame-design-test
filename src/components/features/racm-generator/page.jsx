import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import RACMHeader from './components/RACMHeader';
import RACMTabs from './components/RACMTabs';
import GeneratorTab from './components/generator/GeneratorTab';
import HistoryTab from './components/history/HistoryTab';
import { RACM_TABS } from './constants/racm.constants';

const RACMGeneratorPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedJobId, setSelectedJobId] = useState(null);

	const activeTab = useMemo(() => {
		const tabParam = searchParams.get('tab');
		return tabParam &&
			Object.values(RACM_TABS)
				?.map((t) => t.value)
				.includes(tabParam)
			? tabParam
			: RACM_TABS.GENERATOR.value;
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
			setSearchParams({ tab: RACM_TABS.GENERATOR.value }, { replace: true });
		},
		[setSearchParams],
	);

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-1">
			<RACMHeader />

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="h-[calc(100%-3rem)]"
			>
				<RACMTabs />

				<div className="h-[calc(100%-5rem)] overflow-auto pt-4">
					<TabsContent value={RACM_TABS.GENERATOR.value} className="mt-0">
						<GeneratorTab
							selectedJobId={selectedJobId}
							onJobIdChange={setSelectedJobId}
						/>
					</TabsContent>

					<TabsContent value={RACM_TABS.HISTORY.value} className="mt-0">
						<HistoryTab onViewJob={handleViewJob} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};

export default RACMGeneratorPage;
