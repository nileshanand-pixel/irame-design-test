import { useState, useEffect } from 'react';
import {
	X,
	ChevronLeft,
	IndianRupee,
	Users,
	ShieldCheck,
	RefreshCw,
	Lock,
	FileText,
	BookOpen,
	LayoutGrid,
	Sparkles,
	ClipboardList,
} from 'lucide-react';

// ── Domain + Task data ──────────────────────────────────────────────────────

const DOMAINS = [
	{
		id: 'finance',
		label: 'Finance & Accounting',
		Icon: IndianRupee,
		iconColor: 'text-violet-600',
		iconBg: 'bg-violet-50',
		tasks: [
			{
				id: 'f1',
				name: 'Invoice Verification & AP Audit',
				desc: 'Catch duplicates, fictitious vendors, and coding errors',
				basePrompt:
					'Validate AP invoices against purchase orders and GL trial balance to detect duplicates and unapproved vendors',
			},
			{
				id: 'f2',
				name: 'T&E Expense Compliance',
				desc: 'Flag policy violations and duplicate expense claims',
				basePrompt:
					'Audit employee travel and expense reports for policy violations, duplicate submissions, and unusual spending patterns',
			},
			{
				id: 'f3',
				name: 'Payroll Integrity Audit',
				desc: 'Detect ghost employees and salary anomalies',
				basePrompt:
					'Cross-validate payroll disbursements against HR master records to detect ghost employees and salary anomalies',
			},
			{
				id: 'f4',
				name: 'GL Reconciliation',
				desc: 'Reconcile ledger entries with bank statements',
				basePrompt:
					'Reconcile general ledger entries with bank statements to flag unrecorded or misposted transactions',
			},
		],
	},
	{
		id: 'hr',
		label: 'Human Resources',
		Icon: Users,
		iconColor: 'text-blue-600',
		iconBg: 'bg-blue-50',
		tasks: [
			{
				id: 'h1',
				name: 'Ghost Employee Detection',
				desc: 'Identify payroll entries with no active headcount match',
				basePrompt:
					'Detect ghost employees in payroll by cross-checking active headcount against biometric or access records',
			},
			{
				id: 'h2',
				name: 'Leave Abuse Audit',
				desc: 'Flag suspicious leave patterns and unverified claims',
				basePrompt:
					'Audit employee leave records for abuse patterns including Monday/Friday clustering and unverified medical certificates',
			},
			{
				id: 'h3',
				name: 'Hiring Compliance Check',
				desc: 'Validate hires against approved headcount and policy',
				basePrompt:
					'Verify hiring records against approved headcount limits and recruitment policy compliance requirements',
			},
		],
	},
	{
		id: 'risk',
		label: 'Risk & Compliance',
		Icon: ShieldCheck,
		iconColor: 'text-rose-600',
		iconBg: 'bg-rose-50',
		tasks: [
			{
				id: 'r1',
				name: 'SoD Breach Detector',
				desc: 'Find segregation of duties conflicts in access rights',
				basePrompt:
					'Detect segregation of duties breaches in user access rights and transaction approval workflows',
			},
			{
				id: 'r2',
				name: 'RACM Gap Analysis',
				desc: 'Identify control gaps against regulatory requirements',
				basePrompt:
					'Analyze risk and control matrix for control gaps and missing coverage against regulatory requirements',
			},
			{
				id: 'r3',
				name: 'AML Transaction Monitor',
				desc: 'Screen transactions for anti-money laundering red flags',
				basePrompt:
					'Screen financial transactions for anti-money laundering red flags including structuring and high-risk counterparties',
			},
		],
	},
	{
		id: 'operations',
		label: 'Operations',
		Icon: RefreshCw,
		iconColor: 'text-amber-600',
		iconBg: 'bg-amber-50',
		tasks: [
			{
				id: 'o1',
				name: 'Inventory Discrepancy Audit',
				desc: 'Reconcile physical stock against system records',
				basePrompt:
					'Reconcile physical inventory counts against system records and flag variances above defined thresholds',
			},
			{
				id: 'o2',
				name: 'Vendor Contract Compliance',
				desc: 'Detect overbilling and SLA breaches against contracts',
				basePrompt:
					'Review vendor invoices and delivery records against contract terms to detect overbilling and SLA violations',
			},
			{
				id: 'o3',
				name: 'Procurement PO Audit',
				desc: 'Validate purchase orders against budgets and policy',
				basePrompt:
					'Audit purchase orders against approved budgets and procurement policy for compliance and approval authority',
			},
		],
	},
	{
		id: 'it',
		label: 'IT & Security',
		Icon: Lock,
		iconColor: 'text-indigo-600',
		iconBg: 'bg-indigo-50',
		tasks: [
			{
				id: 'i1',
				name: 'User Access Review',
				desc: 'Flag terminated users and excess access rights',
				basePrompt:
					'Review active user accounts against HR data to identify excess permissions, dormant accounts, and terminated user access',
			},
			{
				id: 'i2',
				name: 'Privileged Access Audit',
				desc: 'Check admin accounts against least-privilege policy',
				basePrompt:
					'Audit privileged and admin accounts for compliance with least-privilege access policy and detect anomalous activity',
			},
		],
	},
	{
		id: 'legal',
		label: 'Legal',
		Icon: FileText,
		iconColor: 'text-teal-600',
		iconBg: 'bg-teal-50',
		tasks: [
			{
				id: 'l1',
				name: 'Contract Expiry Monitor',
				desc: 'Alert on contracts approaching renewal with no action',
				basePrompt:
					'Monitor contracts for upcoming expiry dates and flag those approaching renewal deadlines without confirmed action',
			},
			{
				id: 'l2',
				name: 'Clause Compliance Check',
				desc: 'Validate contracts against standard clause library',
				basePrompt:
					'Check vendor contracts against the standard clause library to identify missing or non-compliant provisions',
			},
		],
	},
	{
		id: 'training',
		label: 'Training',
		Icon: BookOpen,
		iconColor: 'text-green-600',
		iconBg: 'bg-green-50',
		tasks: [
			{
				id: 'tr1',
				name: 'Training Completion Audit',
				desc: 'Verify mandatory training rates meet regulatory requirements',
				basePrompt:
					'Audit mandatory training completion rates by department against regulatory and policy requirements',
			},
			{
				id: 'tr2',
				name: 'Certification Validity Check',
				desc: 'Flag expired or expiring employee certifications',
				basePrompt:
					'Validate employee certifications for currency and flag those expiring or already lapsed by role requirement',
			},
		],
	},
	{
		id: 'general',
		label: 'General',
		Icon: LayoutGrid,
		iconColor: 'text-slate-600',
		iconBg: 'bg-slate-50',
		tasks: [
			{
				id: 'g1',
				name: 'Data Quality Audit',
				desc: 'Profile datasets for completeness and accuracy issues',
				basePrompt:
					'Audit a dataset for data quality issues including completeness gaps, inaccuracies, and consistency violations',
			},
			{
				id: 'g2',
				name: 'Exception Report Builder',
				desc: 'Build configurable anomaly reports from any dataset',
				basePrompt:
					'Build an exception report from a dataset using threshold-based anomaly detection to surface outliers and breaches',
			},
		],
	},
];

// ── Per-task contextual questions ───────────────────────────────────────────

const QUESTIONS = {
	f1: [
		{
			id: 'freq',
			text: 'How often do you run this audit?',
			options: ['Monthly', 'Quarterly', 'Ad-hoc'],
		},
		{
			id: 'concern',
			text: 'Primary detection goal?',
			options: ['Duplicate invoices', 'Fictitious vendors', 'Coding errors'],
		},
		{
			id: 'threshold',
			text: 'Flag threshold?',
			options: ['Any mismatch', '> ₹10,000', '> ₹1 Lakh'],
		},
	],
	f2: [
		{
			id: 'freq',
			text: 'Audit frequency?',
			options: ['Monthly', 'Quarterly', 'Per trip cycle'],
		},
		{
			id: 'concern',
			text: 'Primary concern?',
			options: ['Policy violations', 'Duplicate claims', 'Unusual patterns'],
		},
		{
			id: 'escalation',
			text: 'Escalation threshold?',
			options: ['Any violation', '> ₹5,000', 'Manager approval required'],
		},
	],
	f3: [
		{
			id: 'period',
			text: 'Payroll period to audit?',
			options: ['Current month', 'Last quarter', 'Full year'],
		},
		{
			id: 'concern',
			text: 'Anomaly most concerned about?',
			options: [
				'Ghost employees',
				'Salary overrides',
				'Duplicate bank accounts',
			],
		},
		{
			id: 'source',
			text: 'Comparison source?',
			options: ['HR master only', 'Biometric only', 'Both'],
		},
	],
	f4: [
		{
			id: 'period',
			text: 'Period to reconcile?',
			options: ['Monthly close', 'Quarterly', 'Year-end'],
		},
		{
			id: 'tolerance',
			text: 'Acceptable mismatch tolerance?',
			options: ['Zero tolerance', '< 0.1%', '< 1%'],
		},
		{
			id: 'output',
			text: 'Output format?',
			options: [
				'Exception list only',
				'Full reconciliation',
				'Summary dashboard',
			],
		},
	],
	h1: [
		{
			id: 'source',
			text: 'Comparison source available?',
			options: ['Biometric records', 'Access card logs', 'Both'],
		},
		{
			id: 'period',
			text: 'Payroll period?',
			options: ['Current month', 'Last 3 months', 'Last 6 months'],
		},
		{
			id: 'threshold',
			text: 'Flag if absent from source for?',
			options: ['1 month', '3 months', '6+ months'],
		},
	],
	h2: [
		{
			id: 'type',
			text: 'Leave type to focus on?',
			options: ['Sick leave', 'Casual leave', 'All types'],
		},
		{
			id: 'pattern',
			text: 'Pattern most concerning?',
			options: [
				'Mon/Fri clustering',
				'Excessive frequency',
				'Unverified medical',
			],
		},
		{
			id: 'scope',
			text: 'Department scope?',
			options: ['All departments', 'High-risk roles only', 'Specific team'],
		},
	],
	h3: [
		{
			id: 'trigger',
			text: 'Audit trigger?',
			options: ['Post-hiring review', 'Annual check', 'Pre-audit'],
		},
		{
			id: 'focus',
			text: 'Most important to verify?',
			options: [
				'Headcount approval',
				'Background checks',
				'Document completeness',
			],
		},
		{
			id: 'volume',
			text: 'Approximate hiring volume?',
			options: ['< 50 hires', '50–200 hires', '200+ hires'],
		},
	],
	r1: [
		{
			id: 'conflict',
			text: 'Most sensitive SoD conflict?',
			options: ['Post & approve', 'Request & approve', 'All conflicts'],
		},
		{
			id: 'scope',
			text: 'User scope?',
			options: ['All users', 'Finance users', 'Admin users only'],
		},
		{
			id: 'erp',
			text: 'ERP system?',
			options: ['SAP', 'Oracle', 'Other / Custom'],
		},
	],
	r2: [
		{
			id: 'framework',
			text: 'Regulatory framework?',
			options: ['SOX', 'ISO 27001', 'Internal policy'],
		},
		{
			id: 'control',
			text: 'Control type focus?',
			options: ['Preventive controls', 'Detective controls', 'All controls'],
		},
		{
			id: 'severity',
			text: 'Gap severity to flag?',
			options: ['Any gap', 'High risk only', 'Critical controls only'],
		},
	],
	r3: [
		{
			id: 'volume',
			text: 'Transaction volume?',
			options: ['< 1,000/day', '1K–10K/day', '10,000+/day'],
		},
		{
			id: 'flag',
			text: 'Primary red flag?',
			options: ['Structuring', 'Rapid movement', 'High-risk countries'],
		},
		{
			id: 'output',
			text: 'Reporting output?',
			options: ['STR format', 'Internal flag list', 'Both'],
		},
	],
	o1: [
		{
			id: 'trigger',
			text: 'Audit trigger?',
			options: ['Monthly count', 'Year-end', 'Post stock movement'],
		},
		{
			id: 'threshold',
			text: 'Variance threshold to flag?',
			options: ['Any variance', '> 1%', '> 5%'],
		},
		{
			id: 'scope',
			text: 'Location scope?',
			options: ['Single warehouse', 'Multi-site', 'All locations'],
		},
	],
	o2: [
		{
			id: 'focus',
			text: 'What are you checking?',
			options: ['Overbilling', 'SLA breaches', 'Both'],
		},
		{
			id: 'volume',
			text: 'Active vendor contracts?',
			options: ['< 50', '50–500', '500+'],
		},
		{
			id: 'output',
			text: 'Output needed?',
			options: ['Exception list', 'Full report', 'Executive summary'],
		},
	],
	o3: [
		{
			id: 'focus',
			text: 'Policy focus?',
			options: ['Approval authority', 'Budget compliance', 'Both'],
		},
		{
			id: 'volume',
			text: 'Monthly PO volume?',
			options: ['< 100', '100–1,000', '1,000+'],
		},
		{
			id: 'threshold',
			text: 'Scrutiny threshold?',
			options: ['All POs', '> ₹1 Lakh', '> ₹10 Lakh'],
		},
	],
	i1: [
		{
			id: 'scope',
			text: 'Access scope?',
			options: ['All systems', 'ERP only', 'Critical apps'],
		},
		{
			id: 'concern',
			text: 'Primary concern?',
			options: ['Terminated user access', 'Excess rights', 'Dormant accounts'],
		},
		{
			id: 'freq',
			text: 'Review frequency?',
			options: ['Quarterly', 'Semi-annual', 'Annual'],
		},
	],
	i2: [
		{
			id: 'type',
			text: 'Privileged account type?',
			options: ['System admins', 'DB admins', 'All privileged'],
		},
		{
			id: 'standard',
			text: 'Compliance standard?',
			options: ['SOX', 'ISO 27001', 'Internal policy'],
		},
		{
			id: 'alert',
			text: 'Alert on?',
			options: ['Any deviation', 'New account additions', 'Role changes'],
		},
	],
	l1: [
		{
			id: 'window',
			text: 'Alert window before expiry?',
			options: ['30 days', '60 days', '90 days'],
		},
		{
			id: 'type',
			text: 'Contract type?',
			options: ['Vendor contracts', 'Customer contracts', 'All contracts'],
		},
		{
			id: 'action',
			text: 'Action to trigger?',
			options: ['Renewal notification', 'Escalation to owner', 'Both'],
		},
	],
	l2: [
		{
			id: 'library',
			text: 'Clause library to check against?',
			options: ['Company standard', 'Regulatory clauses', 'Both'],
		},
		{
			id: 'risk',
			text: 'Risk focus?',
			options: ['Missing clauses', 'Non-standard terms', 'Both'],
		},
		{
			id: 'output',
			text: 'Output format?',
			options: ['Gap report', 'Clause-level detail', 'Executive summary'],
		},
	],
	tr1: [
		{
			id: 'regulator',
			text: 'Regulatory requirement?',
			options: ['SEBI mandated', 'RBI mandated', 'Internal policy'],
		},
		{
			id: 'threshold',
			text: 'Minimum completion target?',
			options: ['100%', '90%+', '80%+'],
		},
		{
			id: 'scope',
			text: 'Department scope?',
			options: ['All departments', 'Compliance team', 'Operations only'],
		},
	],
	tr2: [
		{
			id: 'type',
			text: 'Certification type?',
			options: ['Professional certs', 'Regulatory certs', 'Both'],
		},
		{
			id: 'window',
			text: 'Alert window before expiry?',
			options: ['30 days', '60 days', '90 days'],
		},
		{
			id: 'scope',
			text: 'Employee scope?',
			options: ['All employees', 'Critical roles only', 'New joiners'],
		},
	],
	g1: [
		{
			id: 'dataset',
			text: 'Dataset type?',
			options: ['Transactional data', 'Master data', 'Both'],
		},
		{
			id: 'concern',
			text: 'Primary concern?',
			options: [
				'Completeness gaps',
				'Inaccurate values',
				'Consistency issues',
			],
		},
		{
			id: 'volume',
			text: 'Approximate row count?',
			options: ['< 10K rows', '10K–1M rows', '1M+ rows'],
		},
	],
	g2: [
		{
			id: 'type',
			text: 'Anomaly type?',
			options: ['Threshold breach', 'Statistical outlier', 'Both'],
		},
		{
			id: 'format',
			text: 'Report format?',
			options: [
				'Summary only',
				'Detailed breakdown',
				'Drill-down by category',
			],
		},
		{
			id: 'threshold',
			text: 'Threshold type?',
			options: ['Fixed value', 'Percentage variance', 'Custom formula'],
		},
	],
};

// ── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(domain, task, questions, answers) {
	const detailLines = questions
		.map((q, i) => {
			const ans = answers[i];
			return ans ? `${q.text.replace(/\?$/, '')} — ${ans}` : null;
		})
		.filter(Boolean);

	const detailSuffix = detailLines.length > 0 ? ` ${detailLines.join('. ')}.` : '';
	return `${task.basePrompt}.${detailSuffix}`;
}

// ── Step components ─────────────────────────────────────────────────────────

function DomainStep({ onSelect }) {
	const [search, setSearch] = useState('');
	const filtered = DOMAINS.filter((d) =>
		d.label.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="flex flex-col gap-3">
			<p className="text-[13px] text-slate-500">
				What area does this workflow belong to?
			</p>
			{/* Search */}
			<div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 h-9 bg-white focus-within:border-violet-400 transition-colors">
				<svg
					className="size-3.5 text-slate-400 flex-shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
					/>
				</svg>
				<input
					type="text"
					placeholder="Search domains…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="flex-1 text-[13px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
				/>
				{search && (
					<button
						onClick={() => setSearch('')}
						className="text-slate-400 hover:text-slate-600"
					>
						<X className="size-3" />
					</button>
				)}
			</div>
			<div className="grid grid-cols-2 gap-3">
				{filtered.length > 0 ? (
					filtered.map((d) => (
						<button
							key={d.id}
							onClick={() => onSelect(d)}
							className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white text-left hover:border-violet-400 hover:shadow-sm transition-all duration-150"
						>
							<div
								className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.iconBg}`}
							>
								<d.Icon
									className={`size-4 ${d.iconColor}`}
									strokeWidth={1.75}
								/>
							</div>
							<span className="text-[13px] font-semibold text-slate-800 leading-snug">
								{d.label}
							</span>
						</button>
					))
				) : (
					<div className="col-span-2 text-center text-[13px] text-slate-400 py-8">
						No domains match &ldquo;{search}&rdquo;
					</div>
				)}
			</div>
		</div>
	);
}

function TaskStep({ domain, onBack, onSelect }) {
	return (
		<div>
			<button
				onClick={onBack}
				className="flex items-center gap-1 text-[12px] font-medium text-violet-600 hover:text-violet-700 mb-4 transition-colors"
			>
				<ChevronLeft className="size-3.5" />
				Back
			</button>
			<p className="text-[13px] text-slate-500 mb-1">
				Within{' '}
				<span className="font-semibold text-slate-700">{domain.label}</span>,
				what are you auditing?
			</p>
			<div className="grid grid-cols-2 gap-3 mt-4">
				{domain.tasks.map((t) => (
					<button
						key={t.id}
						onClick={() => onSelect(t)}
						className="flex flex-col items-start gap-1.5 p-4 rounded-xl border border-slate-200 bg-white text-left hover:border-violet-400 hover:shadow-sm transition-all duration-150"
					>
						<span className="text-[13px] font-semibold text-slate-800 leading-snug">
							{t.name}
						</span>
						<span className="text-[12px] text-slate-400 leading-relaxed">
							{t.desc}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

function DetailsStep({
	domain,
	task,
	questions,
	answers,
	onAnswer,
	onBack,
	generatedPrompt,
	onCancel,
	onInsert,
}) {
	const answeredCount = answers.length;

	return (
		<div className="flex flex-col gap-5">
			<button
				onClick={onBack}
				className="flex items-center gap-1 text-[12px] font-medium text-violet-600 hover:text-violet-700 transition-colors self-start"
			>
				<ChevronLeft className="size-3.5" />
				Back to tasks
			</button>

			{/* Questions — reveal progressively */}
			{questions.map((q, idx) => {
				const isVisible = idx <= answeredCount;
				const selectedAns = answers[idx];
				if (!isVisible) return null;

				return (
					<div
						key={q.id}
						className="flex flex-col gap-2.5"
						style={{
							animation: 'fadeSlideIn 200ms ease forwards',
						}}
					>
						{/* Question label */}
						<div className="flex items-center gap-2.5">
							<span className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
								{String.fromCharCode(65 + idx)}
							</span>
							<span className="text-[13px] font-medium text-slate-700 bg-slate-50 rounded-lg px-3 py-2 leading-snug flex-1">
								{q.text}
							</span>
						</div>

						{/* Options */}
						<div className="flex flex-wrap gap-2 pl-8">
							{q.options.map((opt) => (
								<button
									key={opt}
									onClick={() => onAnswer(idx, opt)}
									className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all duration-150 ${
										selectedAns === opt
											? 'bg-violet-600 text-white border-violet-600 shadow-sm'
											: 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
									}`}
								>
									{opt}
								</button>
							))}
						</div>
					</div>
				);
			})}

			{/* Generated Prompt — shown when all answered */}
			{generatedPrompt && (
				<div
					className="rounded-xl border border-violet-100 bg-violet-50/50"
					style={{ animation: 'fadeSlideIn 250ms ease forwards' }}
				>
					<div className="px-4 pt-3 pb-2 border-b border-violet-100">
						<div className="flex items-center gap-1.5">
							<Sparkles className="size-3.5 text-violet-500" />
							<span className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest">
								Your generated prompt
							</span>
						</div>
					</div>
					<div className="px-4 py-3 max-h-[120px] overflow-y-auto">
						<p className="text-[12.5px] text-slate-700 leading-relaxed font-mono">
							{generatedPrompt}
						</p>
					</div>
					<div className="px-4 pb-4 pt-1 flex items-center justify-end gap-2">
						<button
							onClick={onCancel}
							className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={onInsert}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 transition-colors shadow-sm"
						>
							Insert into chat
							<kbd className="text-[10px] bg-violet-500 rounded px-1 py-0.5 font-sans">
								↵
							</kbd>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

// ── Main modal ──────────────────────────────────────────────────────────────

const STEP_DOMAIN = 0;
const STEP_TASK = 1;
const STEP_DETAILS = 2;

const STEP_LABELS = ['Domain', 'Task', 'Specifics'];
const STEP_PROGRESS = [18, 55, 100];

export default function GuidedPromptModal({ isOpen, onClose, onInsert }) {
	const [step, setStep] = useState(STEP_DOMAIN);
	const [domain, setDomain] = useState(null);
	const [task, setTask] = useState(null);
	const [answers, setAnswers] = useState([]);

	useEffect(() => {
		if (isOpen) {
			setStep(STEP_DOMAIN);
			setDomain(null);
			setTask(null);
			setAnswers([]);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const questions = task ? (QUESTIONS[task.id] ?? []) : [];
	const answeredAll = answers.length >= questions.length && questions.length > 0;
	const generatedPrompt = answeredAll
		? buildPrompt(domain, task, questions, answers)
		: null;

	const handleAnswer = (idx, value) => {
		setAnswers((prev) => {
			const next = prev.slice(0, idx);
			next[idx] = value;
			return next;
		});
	};

	const handleSelectDomain = (d) => {
		setDomain(d);
		setTask(null);
		setAnswers([]);
		setStep(STEP_TASK);
	};

	const handleSelectTask = (t) => {
		setTask(t);
		setAnswers([]);
		setStep(STEP_DETAILS);
	};

	return (
		<>
			<style>{`
				@keyframes fadeSlideIn {
					from { opacity: 0; transform: translateY(6px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				.guided-modal-enter {
					animation: fadeSlideIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
				}
			`}</style>

			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				{/* Backdrop */}
				<div
					className="absolute inset-0 bg-[#1A064A]/40 backdrop-blur-sm"
					onClick={onClose}
				/>

				{/* Modal */}
				<div className="guided-modal-enter relative bg-white rounded-2xl shadow-2xl w-full max-w-[540px] h-[600px] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="px-6 pt-5 pb-0 flex-shrink-0">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-2">
								<ClipboardList className="size-4 text-violet-600" />
								<h2 className="text-[15px] font-semibold text-slate-900">
									Guided setup
								</h2>
							</div>
							<button
								onClick={onClose}
								className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
							>
								<X className="size-4" />
							</button>
						</div>

						{/* Step indicators */}
						<div className="mt-4 flex items-center gap-0">
							{STEP_LABELS.map((label, i) => (
								<div key={i} className="flex items-center">
									<div
										className={`flex items-center gap-1.5 ${i < step ? 'text-violet-500' : i === step ? 'text-violet-700' : 'text-slate-400'}`}
									>
										<span
											className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
												i < step
													? 'bg-violet-100 text-violet-600'
													: i === step
														? 'bg-violet-600 text-white'
														: 'bg-slate-100 text-slate-400'
											}`}
										>
											{i + 1}
										</span>
										<span
											className={`text-[11px] font-medium ${i === step ? 'text-violet-700' : i < step ? 'text-violet-500' : 'text-slate-400'}`}
										>
											{label}
										</span>
									</div>
									{i < STEP_LABELS.length - 1 && (
										<div
											className={`mx-2 h-[1px] w-6 flex-shrink-0 ${i < step ? 'bg-violet-400' : 'bg-slate-200'}`}
										/>
									)}
								</div>
							))}
						</div>

						{/* Progress bar */}
						<div className="mt-3 h-[2px] bg-slate-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out"
								style={{ width: `${STEP_PROGRESS[step]}%` }}
							/>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto px-6 py-5">
						{step === STEP_DOMAIN && (
							<DomainStep onSelect={handleSelectDomain} />
						)}
						{step === STEP_TASK && (
							<TaskStep
								domain={domain}
								onBack={() => setStep(STEP_DOMAIN)}
								onSelect={handleSelectTask}
							/>
						)}
						{step === STEP_DETAILS && (
							<DetailsStep
								domain={domain}
								task={task}
								questions={questions}
								answers={answers}
								onAnswer={handleAnswer}
								onBack={() => setStep(STEP_TASK)}
								generatedPrompt={generatedPrompt}
								onCancel={onClose}
								onInsert={() => {
									onInsert(generatedPrompt);
									onClose();
								}}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
