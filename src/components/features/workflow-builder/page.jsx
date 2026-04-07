import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import WorkflowHome from './components/WorkflowHome';
import WorkflowRun from './components/WorkflowRun';

const WorkflowBuilderPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const view = searchParams.get('view') || 'home';

	const goTo = (params) => setSearchParams(params, { replace: false });

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-2 bg-gradient-to-br from-[rgba(249,245,255,1)] via-[rgba(238,232,248,0.5)] to-[rgba(249,250,251,1)] rounded-lg">
			<button
				onClick={() => {
					if (view === 'home') navigate('/app/ai-concierge');
					else goTo({ view: 'home' });
				}}
				className="inline-flex items-center gap-1 text-sm text-primary40 hover:text-purple-100 transition-colors mb-3 w-fit"
			>
				<ChevronLeft className="size-4" />
				{view === 'home'
					? 'Back to AI Concierge'
					: 'Back to Workflow Builder'}
			</button>

			<div className="bg-white/55 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(106,18,205,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/70 overflow-hidden flex-1 flex flex-col min-h-0">
				{view === 'home' && (
					<WorkflowHome onRun={(id) => goTo({ view: 'run', id })} />
				)}
				{view === 'run' && (
					<WorkflowRun
						workflowId={searchParams.get('id')}
						onBack={() => goTo({ view: 'home' })}
					/>
				)}
			</div>
		</div>
	);
};

export default WorkflowBuilderPage;
