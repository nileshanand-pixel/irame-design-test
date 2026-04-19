import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import WorkflowHome from './components/WorkflowHome';
import WorkflowRun from './components/WorkflowRun';
import WorkflowAnalytics from './components/WorkflowAnalytics';

const WorkflowBuilderPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const view = searchParams.get('view') || 'home';
	const [saveDraftFn, setSaveDraftFn] = useState(null);
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
	const { setGuard, clearGuard } = useNavigationGuard();

	const handleSaveDraftChange = useCallback((fn) => {
		setSaveDraftFn(() => fn);
	}, []);

	// Register/unregister the navigation guard based on whether we have unsaved work
	useEffect(() => {
		if (saveDraftFn) {
			setGuard((targetPath, proceed) => {
				setPendingNavigationPath({ path: targetPath, proceed });
				setShowExitDialog(true);
			});
		} else {
			clearGuard();
		}
		return () => clearGuard();
	}, [saveDraftFn, setGuard, clearGuard]);

	const handleBackClick = () => {
		if (view === 'home') {
			if (saveDraftFn) {
				setPendingNavigationPath({ path: '/app/ai-concierge' });
				setShowExitDialog(true);
			} else {
				navigate('/app/ai-concierge');
			}
		} else if (view === 'analytics') {
			goTo({ view: 'run', id: searchParams.get('id') });
		} else {
			goTo({ view: 'home' });
		}
	};

	const handleSaveDraft = async () => {
		if (saveDraftFn) await saveDraftFn();
		proceedNavigation();
	};

	const handleExitAnyway = () => {
		proceedNavigation();
	};

	const proceedNavigation = () => {
		setShowExitDialog(false);
		clearGuard();
		if (pendingNavigationPath?.proceed) {
			pendingNavigationPath.proceed();
		} else if (pendingNavigationPath?.path) {
			navigate(pendingNavigationPath.path);
		}
		setPendingNavigationPath(null);
	};

	const cancelNavigation = () => {
		setShowExitDialog(false);
		setPendingNavigationPath(null);
	};

	const goTo = (params) => setSearchParams(params, { replace: false });

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-2 bg-gradient-to-br from-[rgba(249,245,255,1)] via-[rgba(238,232,248,0.5)] to-[rgba(249,250,251,1)] rounded-lg">
			<div className="flex items-center justify-between mb-3">
				<button
					onClick={handleBackClick}
					className="inline-flex items-center gap-1 text-sm text-primary40 hover:text-purple-100 transition-colors w-fit"
				>
					<ChevronLeft className="size-4" />
					{view === 'home'
						? 'Back to AI Concierge'
						: view === 'analytics'
							? 'Back to Run Results'
							: 'Back to Workflow Builder'}
				</button>
			</div>

			{/* Exit Confirmation Dialog */}
			<Dialog
				open={showExitDialog}
				onOpenChange={(open) => {
					if (!open) cancelNavigation();
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg font-semibold text-gray-900">
							Save your progress?
						</DialogTitle>
						<DialogDescription className="text-sm text-gray-500 mt-1">
							You have unsaved changes. Would you like to save them as
							a draft before leaving?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 flex gap-3">
						<button
							onClick={handleExitAnyway}
							className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors"
						>
							Exit Anyway
						</button>
						<button
							onClick={handleSaveDraft}
							className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm"
						>
							<span className="inline-flex items-center gap-2">
								<Save className="size-4" /> Save as Draft
							</span>
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="bg-white/55 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(106,18,205,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/70 overflow-hidden flex-1 flex flex-col min-h-0">
				{view === 'home' && (
					<WorkflowHome
						onRun={(id) => goTo({ view: 'run', id })}
						onSaveDraftChange={handleSaveDraftChange}
					/>
				)}
				{view === 'run' && (
					<WorkflowRun
						workflowId={searchParams.get('id')}
						onBack={() => goTo({ view: 'home' })}
						onViewAnalytics={() =>
							goTo({ view: 'analytics', id: searchParams.get('id') })
						}
					/>
				)}
				{view === 'analytics' && (
					<WorkflowAnalytics
						workflowId={searchParams.get('id')}
						onBack={() =>
							goTo({ view: 'run', id: searchParams.get('id') })
						}
					/>
				)}
			</div>
		</div>
	);
};

export default WorkflowBuilderPage;
