import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateWorkflow } from '../lib/mock-api';
import { saveWorkflow, getWorkflow } from '../lib/storage';

const STEP_ICONS = {
	extract: '📤',
	analyze: '🔍',
	compare: '⚖️',
	flag: '🚩',
	summarize: '📌',
	calculate: '🧮',
	validate: '✅',
};
const TYPE_COLOR = {
	csv: 'bg-emerald-100 text-emerald-700',
	pdf: 'bg-rose-100 text-rose-700',
	image: 'bg-violet-100 text-violet-700',
	sql: 'bg-amber-100 text-amber-700',
};
const SUGGESTIONS = [
	'Build a payroll audit to detect ghost employees',
	'Check vendor invoices against contracts for overbilling',
	'Reconcile GL entries with bank statements',
	'Audit AP invoices for duplicates and fictitious vendors',
];

const Builder = ({ editId, onSaved }) => {
	const [messages, setMessages] = useState([
		{
			role: 'assistant',
			content:
				"Hi! Describe the audit workflow you'd like to build and I'll design it for you.",
		},
	]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [workflow, setWorkflow] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		if (editId) {
			const existing = getWorkflow(editId);
			if (existing) setWorkflow(existing);
		}
	}, [editId]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	async function sendMessage(text) {
		const msg = (text ?? input).trim();
		if (!msg || isLoading) return;
		const next = [...messages, { role: 'user', content: msg }];
		setMessages(next);
		setInput('');
		setIsLoading(true);
		try {
			const data = await generateWorkflow(next);
			setMessages([...next, { role: 'assistant', content: data.message }]);
			if (data.workflow) setWorkflow(data.workflow);
		} catch {
			setMessages([
				...next,
				{
					role: 'assistant',
					content: 'Something went wrong. Please try again.',
				},
			]);
		} finally {
			setIsLoading(false);
		}
	}

	async function handleSave() {
		if (!workflow) return;
		setIsSaving(true);
		try {
			const saved = saveWorkflow({
				...workflow,
				id: editId || undefined,
				status: 'active',
			});
			setSaved(true);
			setTimeout(() => onSaved(saved.id), 600);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="flex h-full min-h-0">
			{/* Left: Chat */}
			<div className="w-[380px] flex-shrink-0 flex flex-col border-r border-white/60 min-h-0">
				{/* Header — dark AI bar */}
				<div className="px-5 py-4 bg-[#0b0b12] border-b border-white/[0.06] flex-shrink-0">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/10 ring-1 ring-violet-500/30 flex items-center justify-center flex-shrink-0">
							<Sparkles className="size-3.5 text-violet-400" />
						</div>
						<h2 className="font-medium text-white text-sm">
							Workflow Builder
						</h2>
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Describe your audit and Ira will design the workflow
					</p>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-auto px-4 py-4 space-y-3 min-h-0">
					{messages.map((m, i) => (
						<div
							key={i}
							className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
						>
							{m.role === 'assistant' && (
								<div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0 mt-0.5">
									AI
								</div>
							)}
							<div
								className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
									m.role === 'user'
										? 'bg-gray-900 text-white rounded-tr-sm'
										: 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
								}`}
							>
								{m.content}
							</div>
						</div>
					))}
					{isLoading && (
						<div className="flex gap-2">
							<div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
								<Loader2 className="size-3 text-white animate-spin" />
							</div>
							<div className="bg-gray-50 border border-gray-100 px-3.5 py-2.5 rounded-xl rounded-tl-sm">
								<div className="flex gap-1 items-center h-4">
									{[0, 1, 2].map((i) => (
										<span
											key={i}
											className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
											style={{
												animationDelay: `${i * 0.15}s`,
											}}
										/>
									))}
								</div>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Suggestions */}
				{messages.length === 1 && (
					<div className="px-4 pb-3 flex-shrink-0">
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">
							Try asking
						</p>
						<div className="space-y-1.5">
							{SUGGESTIONS.map((s) => (
								<button
									key={s}
									onClick={() => sendMessage(s)}
									className="w-full text-left text-xs text-gray-700 bg-white/60 hover:bg-white/90 border border-white/60 hover:border-violet-200 rounded-xl px-3 py-2 transition-all duration-150"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Input */}
				<div className="px-4 pb-4 pt-3 flex-shrink-0 border-t border-white/60">
					<div className="flex gap-2 items-end">
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									sendMessage();
								}
							}}
							placeholder="Describe your audit workflow…"
							rows={2}
							className="flex-1 text-xs bg-white/70 border border-white/70 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-200 focus:border-violet-300 resize-none placeholder:text-gray-400 text-gray-800 transition-all duration-200"
						/>
						<button
							onClick={() => sendMessage()}
							disabled={!input.trim() || isLoading}
							className="p-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 flex-shrink-0"
						>
							<Send className="size-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Right: Preview */}
			<div className="flex-1 flex flex-col min-h-0 min-w-0">
				{!workflow ? (
					<div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
						<div className="w-14 h-14 rounded-2xl bg-[rgba(106,18,205,0.06)] flex items-center justify-center">
							<Sparkles className="size-7 text-purple-100 opacity-40" />
						</div>
						<p className="text-sm text-primary40 max-w-xs">
							Your workflow preview will appear here once you describe
							the audit
						</p>
					</div>
				) : (
					<div className="flex-1 overflow-auto px-6 py-5 space-y-5 min-h-0">
						{/* Workflow header */}
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs text-primary40 font-medium uppercase tracking-wide">
										{workflow.category}
									</span>
								</div>
								<h2 className="text-lg font-semibold text-primary100">
									{workflow.name}
								</h2>
								<p className="text-sm text-primary60 mt-1 leading-relaxed">
									{workflow.description}
								</p>
								<div className="flex flex-wrap gap-1.5 mt-2">
									{workflow.tags?.map((tag) => (
										<Badge
											key={tag}
											variant="outline"
											className="text-[10px] px-2 py-0.5 bg-white/50 border-white/60 text-primary60 rounded-full"
										>
											#{tag}
										</Badge>
									))}
								</div>
							</div>
							<Button
								onClick={handleSave}
								disabled={isSaving || saved}
								className="flex-shrink-0 bg-purple-100 hover:bg-[#5a0fb0] text-white rounded-xl gap-2 shadow-[0_4px_12px_rgba(106,18,205,0.25)]"
							>
								{saved ? (
									<CheckCircle2 className="size-4" />
								) : isSaving ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Save className="size-4" />
								)}
								{saved ? 'Saved!' : 'Save & Run'}
							</Button>
						</div>

						<hr className="border-white/60" />

						{/* Inputs */}
						<div>
							<h3 className="text-xs font-semibold text-primary40 uppercase tracking-wide mb-3">
								Input Files
							</h3>
							<div className="space-y-2">
								{workflow.inputs?.map((inp) => (
									<div
										key={inp.id}
										className="flex items-center gap-3 bg-white/50 border border-white/60 rounded-xl px-4 py-3"
									>
										<span
											className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${TYPE_COLOR[inp.type] ?? 'bg-slate-100 text-slate-600'}`}
										>
											{inp.type}
										</span>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-primary100 truncate">
												{inp.name}
											</p>
											<p className="text-xs text-primary40 truncate">
												{inp.description}
											</p>
										</div>
										{inp.required && (
											<span className="text-[10px] text-purple-100 font-medium flex-shrink-0">
												Required
											</span>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Steps */}
						<div>
							<h3 className="text-xs font-semibold text-primary40 uppercase tracking-wide mb-3">
								Processing Steps
							</h3>
							<div className="space-y-2">
								{workflow.steps?.map((step, i) => (
									<div
										key={step.id}
										className="flex items-start gap-3"
									>
										<div className="flex flex-col items-center flex-shrink-0">
											<div className="w-7 h-7 rounded-full bg-[rgba(106,18,205,0.08)] text-purple-100 flex items-center justify-center text-xs font-bold">
												{i + 1}
											</div>
											{i < workflow.steps.length - 1 && (
												<div className="w-px h-3 bg-[rgba(106,18,205,0.15)] my-0.5" />
											)}
										</div>
										<div className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span>
													{STEP_ICONS[step.type] ?? '⚡'}
												</span>
												<p className="text-sm font-medium text-primary100">
													{step.name}
												</p>
												<span className="ml-auto text-[10px] text-primary40 bg-white/60 px-1.5 py-0.5 rounded border border-white/50">
													{step.type}
												</span>
											</div>
											<p className="text-xs text-primary60 mt-1">
												{step.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Output */}
						{workflow.output && (
							<div>
								<h3 className="text-xs font-semibold text-primary40 uppercase tracking-wide mb-3">
									Output
								</h3>
								<div className="bg-white/50 border border-white/60 rounded-xl px-4 py-3">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-xs font-bold text-purple-100 uppercase bg-[rgba(106,18,205,0.08)] px-2 py-0.5 rounded">
											{workflow.output.type}
										</span>
										<p className="text-sm font-medium text-primary100">
											{workflow.output.title}
										</p>
									</div>
									<p className="text-xs text-primary60">
										{workflow.output.description}
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Builder;
