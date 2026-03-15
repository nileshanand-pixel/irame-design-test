import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import ForensicsHeader from './components/ForensicsHeader';
import ForensicsTabs from './components/ForensicsTabs';
import AnalyzerTab from './components/analyzer/AnalyzerTab';
import HistoryTab from './components/history/HistoryTab';
import { FORENSICS_TABS } from './constants/forensics.constants';

const DocumentForensicsPage = () => {
	const navigate = useNavigate();
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
			<button
				onClick={() => navigate('/app/ai-concierge')}
				className="inline-flex items-center gap-1 text-sm text-primary40 hover:text-purple-100 transition-colors mb-3"
			>
				<ChevronLeft className="size-4" />
				Back to AI Concierge
			</button>

			<div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
				<ForensicsHeader />

				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="flex-1 flex flex-col min-h-0"
				>
					<ForensicsTabs />

					<div className="flex-1 overflow-auto px-6 pt-4 pb-6">
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
		</div>
	);
};

export default DocumentForensicsPage;
