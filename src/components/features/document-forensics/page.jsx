import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import ForensicsHeader from './components/ForensicsHeader';
import ForensicsTabs from './components/ForensicsTabs';
import AnalyzerTab from './components/analyzer/AnalyzerTab';
import HistoryTab from './components/history/HistoryTab';
import { FORENSICS_TABS } from './constants/forensics.constants';

const DocumentForensicsPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedJobId, setSelectedJobId] = useState(null);

	const activeTab = useMemo(() => {
		const tabParam = searchParams.get('tab');
		return tabParam &&
			Object.values(FORENSICS_TABS)
				?.map((t) => t.value)
				.includes(tabParam)
			? tabParam
			: FORENSICS_TABS.ANALYZER.value;
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
			setSearchParams(
				{ tab: FORENSICS_TABS.ANALYZER.value },
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-2">
			<ForensicsHeader />

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="h-[calc(100%-3rem)]"
			>
				<ForensicsTabs />

				<div className="h-[calc(100%-5rem)] overflow-auto pt-4 pb-6">
					<TabsContent
						value={FORENSICS_TABS.ANALYZER.value}
						className="mt-0"
					>
						<AnalyzerTab
							selectedJobId={selectedJobId}
							onJobIdChange={setSelectedJobId}
						/>
					</TabsContent>

					<TabsContent
						value={FORENSICS_TABS.HISTORY.value}
						className="mt-0"
					>
						<HistoryTab onViewJob={handleViewJob} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};

export default DocumentForensicsPage;
