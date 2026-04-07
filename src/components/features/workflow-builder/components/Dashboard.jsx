import { useState, useEffect } from 'react';
import { Plus, Search, Play, Settings, Trash2, LayoutGrid, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkflows, deleteWorkflow } from '../lib/storage';

const RISK_COLOR = {
	low: 'bg-emerald-100 text-emerald-700',
	medium: 'bg-amber-100 text-amber-700',
	high: 'bg-orange-100 text-orange-700',
	critical: 'bg-red-100 text-red-700',
};

const Dashboard = ({ onNew, onEdit, onRun }) => {
	const [workflows, setWorkflows] = useState([]);
	const [search, setSearch] = useState('');

	useEffect(() => {
		setWorkflows(getWorkflows());
	}, []);

	const filtered = workflows.filter(
		(w) =>
			w.name.toLowerCase().includes(search.toLowerCase()) ||
			w.category?.toLowerCase().includes(search.toLowerCase()) ||
			w.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
	);

	function handleDelete(id) {
		deleteWorkflow(id);
		setWorkflows(getWorkflows());
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Header */}
			<div className="px-6 py-5 border-b border-white/60 flex items-center justify-between gap-4 flex-shrink-0">
				<div>
					<div className="flex items-center gap-2 mb-0.5">
						<h2 className="text-lg font-semibold text-primary100">
							Workflow Builder
						</h2>
						<span className="text-[10px] font-semibold bg-[rgba(106,18,205,0.08)] text-purple-100 px-2 py-0.5 rounded-full border border-[rgba(106,18,205,0.12)]">
							BETA
						</span>
					</div>
					<p className="text-sm text-primary60">
						Design and run custom AI-powered audit workflows
					</p>
				</div>
				<Button
					onClick={onNew}
					className="bg-purple-100 hover:bg-[#5a0fb0] text-white rounded-xl gap-2 shadow-[0_4px_12px_rgba(106,18,205,0.25)] flex-shrink-0"
				>
					<Plus className="size-4" />
					New Workflow
				</Button>
			</div>

			{/* Search */}
			<div className="px-6 py-4 flex-shrink-0">
				<div className="relative max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary40" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search workflows…"
						className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(106,18,205,0.2)] focus:border-[rgba(106,18,205,0.3)] placeholder:text-primary40 text-primary100"
					/>
				</div>
			</div>

			{/* Grid */}
			<div className="flex-1 overflow-auto px-6 pb-6">
				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 gap-3">
						<div className="w-12 h-12 rounded-2xl bg-[rgba(106,18,205,0.06)] flex items-center justify-center">
							<LayoutGrid className="size-6 text-purple-100 opacity-50" />
						</div>
						<p className="text-sm text-primary40">
							{search
								? 'No workflows match your search'
								: 'No workflows yet — create your first one'}
						</p>
						{!search && (
							<Button
								onClick={onNew}
								variant="outline"
								className="rounded-xl gap-2 border-[rgba(106,18,205,0.2)] text-purple-100 hover:bg-[rgba(106,18,205,0.04)]"
							>
								<Plus className="size-4" /> New Workflow
							</Button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{filtered.map((wf) => (
							<div
								key={wf.id}
								className="group bg-white/60 hover:bg-white/80 border border-white/70 hover:border-[rgba(106,18,205,0.15)] rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(106,18,205,0.10)] cursor-pointer"
								onClick={() => onRun(wf.id)}
							>
								{/* Top */}
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-primary40 uppercase tracking-wide mb-1">
											{wf.category}
										</p>
										<h3 className="font-semibold text-primary100 text-sm leading-snug line-clamp-2">
											{wf.name}
										</h3>
									</div>
									<div
										className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
										onClick={(e) => e.stopPropagation()}
									>
										<button
											onClick={() => onEdit(wf.id)}
											className="p-1.5 rounded-lg hover:bg-[rgba(106,18,205,0.06)] text-primary40 hover:text-purple-100 transition-colors"
										>
											<Settings className="size-3.5" />
										</button>
										<button
											onClick={() => handleDelete(wf.id)}
											className="p-1.5 rounded-lg hover:bg-red-50 text-primary40 hover:text-red-500 transition-colors"
										>
											<Trash2 className="size-3.5" />
										</button>
									</div>
								</div>

								<p className="text-xs text-primary60 line-clamp-2 leading-relaxed">
									{wf.description}
								</p>

								{/* Tags */}
								<div className="flex flex-wrap gap-1.5">
									{wf.tags?.slice(0, 3).map((tag) => (
										<Badge
											key={tag}
											variant="outline"
											className="text-[10px] px-2 py-0.5 bg-white/50 border-white/60 text-primary60 rounded-full font-medium"
										>
											{tag}
										</Badge>
									))}
								</div>

								{/* Footer */}
								<div className="flex items-center justify-between pt-1 border-t border-white/60">
									<div className="flex items-center gap-1.5 text-xs text-primary40">
										<Zap className="size-3" />
										{wf.runCount ?? 0} runs
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											onRun(wf.id);
										}}
										className="flex items-center gap-1.5 text-xs font-medium text-purple-100 bg-[rgba(106,18,205,0.06)] hover:bg-[rgba(106,18,205,0.12)] px-3 py-1.5 rounded-lg transition-colors"
									>
										<Play className="size-3" /> Run
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
