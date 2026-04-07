import { useState, useRef, useEffect, Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import {
	Paperclip,
	Plus,
	Send,
	Sparkles,
	CheckCircle2,
	Link2,
	Play,
	Upload,
	Pencil,
	MoreHorizontal,
	Trash2,
	Clock,
	FileInput,
	FileOutput,
	Settings2,
	ArrowRight,
	PanelRightClose,
	Table2,
	FileText,
	Database,
	Image as ImageIcon,
	CloudUpload,
	ShieldCheck,
	ChevronDown,
	RefreshCw,
	AlertTriangle,
	Info,
	Check,
	X,
	Loader2,
	ChevronRight,
	Minus,
	LayoutDashboard,
	Columns2,
	ListChecks,
	Download,
	Filter,
	Search,
	BarChart3,
	Zap,
	Users,
	Building2,
	Lock,
	BookOpen,
	LayoutGrid,
	ChevronUp,
	Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateWorkflow } from '../lib/mock-api';
import { getWorkflows, saveWorkflow, deleteWorkflow } from '../lib/storage';
import GuidedPromptModal from './GuidedPromptModal';
import { useDataSources } from '@/hooks/useDataSources';

const VSTEPS = [
	{ num: 1, label: 'Write Prompt', icon: Pencil },
	{ num: 2, label: 'Upload Files', icon: Upload },
	{ num: 3, label: 'Map Data', icon: Link2 },
	{ num: 4, label: 'Review & Run', icon: Play },
];

const HSTEPS = [
	{ label: 'Write Prompt' },
	{ label: 'Upload Files' },
	{ label: 'Map Files' },
	{ label: 'Map Columns' },
	{ label: 'Review & Run' },
];

const STEP_COLORS = {
	extract: {
		bg: 'bg-blue-100',
		text: 'text-blue-700',
		dot: 'bg-blue-500',
		badge: 'INGESTION',
	},
	analyze: {
		bg: 'bg-purple-100',
		text: 'text-purple-700',
		dot: 'bg-purple-500',
		badge: 'ANALYSIS',
	},
	compare: {
		bg: 'bg-violet-100',
		text: 'text-violet-700',
		dot: 'bg-violet-500',
		badge: 'COMPARISON',
	},
	flag: {
		bg: 'bg-rose-100',
		text: 'text-rose-700',
		dot: 'bg-rose-500',
		badge: 'FLAGGING',
	},
	summarize: {
		bg: 'bg-emerald-100',
		text: 'text-emerald-700',
		dot: 'bg-emerald-500',
		badge: 'SUMMARY',
	},
	calculate: {
		bg: 'bg-amber-100',
		text: 'text-amber-700',
		dot: 'bg-amber-500',
		badge: 'CALCULATION',
	},
	validate: {
		bg: 'bg-cyan-100',
		text: 'text-cyan-700',
		dot: 'bg-cyan-500',
		badge: 'VALIDATION',
	},
};

const FILE_TYPE_ICON = {
	csv: <Table2 className="size-4 text-emerald-600" />,
	pdf: <FileText className="size-4 text-rose-500" />,
	sql: <Database className="size-4 text-amber-500" />,
	image: <ImageIcon className="size-4 text-violet-500" />,
};

const FILE_TYPE_BADGE = {
	csv: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	pdf: 'bg-rose-50 text-rose-700 border-rose-200',
	sql: 'bg-amber-50 text-amber-700 border-amber-200',
	image: 'bg-violet-50 text-violet-700 border-violet-200',
};

const RIGHT_ICONS = [
	{ key: 'plan', icon: ListChecks, title: 'Plan' },
	{ key: 'input', icon: Table2, title: 'Input Config' },
	{ key: 'output', icon: FileOutput, title: 'Output Config' },
];

// Deterministic confidence% per column index
function colConfPct(j) {
	return j === 0 ? 96 : j === 1 ? 78 : j === 2 ? 93 : 62 + ((j * 11) % 30);
}

function matchDisplay(pct) {
	if (pct >= 90)
		return {
			label: `${pct}% MATCH`,
			bg: 'text-emerald-700',
		};
	if (pct >= 70)
		return {
			label: `${pct}% MATCH`,
			bg: 'text-amber-700',
		};
	return { label: `${pct}% MATCH`, bg: 'text-red-600' };
}

function fileMappedName(inp, uploadedFiles, idx) {
	if (uploadedFiles[idx]) return uploadedFiles[idx].name;
	return inp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_sample.csv';
}

const BAR_CHART_DATA = [
	{ airline: 'Air India', value: 75, color: 'bg-blue-500' },
	{ airline: 'Cathaway', value: 55, color: 'bg-violet-500' },
	{ airline: 'Emirates', value: 90, color: 'bg-emerald-500' },
	{ airline: 'Singapore', value: 65, color: 'bg-amber-500' },
	{ airline: 'Qatar', value: 80, color: 'bg-rose-500' },
	{ airline: 'Asiana', value: 40, color: 'bg-purple-500' },
];

const DONUT_DATA = [
	{ label: 'MTOW Mismatch', pct: 45, color: 'bg-rose-500', stroke: '#f43f5e' },
	{ label: 'Invalid ID', pct: 25, color: 'bg-amber-500', stroke: '#f59e0b' },
	{ label: 'Excess Charge', pct: 30, color: 'bg-violet-500', stroke: '#6366f1' },
];

const AUDIT_TABLE_DATA = [
	{
		id: 'INV-001',
		date: '2024-03-15',
		vendor: 'Air India',
		amount: '$12,450.00',
		status: 'FLAGGED',
		reason: 'MTOW Mismatch',
	},
	{
		id: 'INV-002',
		date: '2024-03-16',
		vendor: 'Emirates',
		amount: '$8,920.00',
		status: 'CLEAN',
		reason: '—',
	},
	{
		id: 'INV-003',
		date: '2024-03-16',
		vendor: 'Singapore Airlines',
		amount: '$15,200.00',
		status: 'FLAGGED',
		reason: 'Excess Charge',
	},
	{
		id: 'INV-004',
		date: '2024-03-17',
		vendor: 'Cathay Pacific',
		amount: '$6,780.00',
		status: 'CLEAN',
		reason: '—',
	},
	{
		id: 'INV-005',
		date: '2024-03-17',
		vendor: 'Qatar Airways',
		amount: '$22,100.00',
		status: 'FLAGGED',
		reason: 'Invalid ID',
	},
];

const ANOMALY_DATA = [
	{
		id: 'INV-4521',
		type: 'Duplicate',
		vendor: 'Acme Corp',
		expected: '$12,400',
		actual: '$12,400',
		deviation: '100%',
		severity: 'critical',
	},
	{
		id: 'INV-3890',
		type: 'MTOW Outlier',
		vendor: 'GlobalFlight',
		expected: '156,000 kg',
		actual: '198,500 kg',
		deviation: '+27.2%',
		severity: 'critical',
	},
	{
		id: 'INV-2917',
		type: 'Rate Mismatch',
		vendor: 'AirConnect',
		expected: '$8,200',
		actual: '$11,340',
		deviation: '+38.3%',
		severity: 'critical',
	},
	{
		id: 'INV-5102',
		type: 'MTOW Outlier',
		vendor: 'Acme Corp',
		expected: '142,000 kg',
		actual: '165,800 kg',
		deviation: '+16.8%',
		severity: 'warning',
	},
	{
		id: 'INV-3204',
		type: 'Timing',
		vendor: 'SkyPartners',
		expected: '>48h gap',
		actual: '4h gap',
		deviation: 'Suspicious',
		severity: 'warning',
	},
	{
		id: 'INV-4788',
		type: 'Rate Mismatch',
		vendor: 'GlobalFlight',
		expected: '$6,150',
		actual: '$7,820',
		deviation: '+27.2%',
		severity: 'warning',
	},
	{
		id: 'INV-1056',
		type: 'MTOW Outlier',
		vendor: 'JetFreight',
		expected: '89,000 kg',
		actual: '94,200 kg',
		deviation: '+5.8%',
		severity: 'info',
	},
];

function formatDate(iso) {
	if (!iso) return '';
	return new Date(iso).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function makeDummyFile(input) {
	const name = input.name.toLowerCase().replace(/\s+/g, '_');
	const ext = input.type === 'pdf' ? 'pdf' : 'csv';
	return { name: `${name}_sample.${ext}`, type: input.type, inputId: input.id };
}

const TEMPLATE_CATEGORIES = [
	{
		id: 'finance',
		label: 'Finance',
		count: 24,
		icon: LayoutDashboard,
		iconBg: 'bg-violet-100',
		iconCls: 'text-violet-600',
		description: 'Specialized auditing modules for financial integrity.',
		templates: [
			{
				id: 'f1',
				name: 'Invoice Verification & AP Audit',
				desc: 'Validates AP invoices against POs and GL to catch duplicates, fictitious vendors, and coding errors.',
				inputs: 4,
				steps: 6,
				updatedAt: '2026-03-30',
				status: 'active',
				prompt: 'Validate AP invoices against purchase orders and GL trial balance to detect duplicates and unapproved vendors',
			},
			{
				id: 'f2',
				name: 'T&E Expense Compliance',
				desc: 'Analyzes employee expense reports for policy violations, duplicate filings, and unusual spending patterns.',
				inputs: 2,
				steps: 5,
				updatedAt: '2026-03-28',
				status: 'active',
				prompt: 'Audit employee travel and expense reports for policy violations and duplicate submissions',
			},
			{
				id: 'f3',
				name: 'Vendor Master File Cleanse',
				desc: 'Scans vendor records for duplicates, incomplete data, and high-risk entities against sanctions lists.',
				inputs: 1,
				steps: 4,
				updatedAt: '2026-03-25',
				status: 'active',
				prompt: 'Cleanse vendor master file to identify duplicates, data gaps, and sanctioned entities',
			},
			{
				id: 'f4',
				name: 'Payroll Integrity Audit',
				desc: 'Cross-validates payroll disbursements against HR master records to detect ghost employees and anomalies.',
				inputs: 3,
				steps: 5,
				updatedAt: '2026-03-22',
				status: 'active',
				prompt: 'Cross-validate payroll disbursements against HR records to detect ghost employees and salary anomalies',
			},
			{
				id: 'f5',
				name: 'GL Reconciliation',
				desc: 'Reconciles general ledger entries against bank statements to catch unrecorded or misposted transactions.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-20',
				status: 'active',
				prompt: 'Reconcile general ledger entries with bank statements to flag unrecorded transactions',
			},
			{
				id: 'f6',
				name: 'Fixed Asset Audit',
				desc: 'Verifies fixed asset register against physical verification records and depreciation schedules.',
				inputs: 3,
				steps: 5,
				updatedAt: '2026-03-18',
				status: 'draft',
				prompt: 'Audit fixed asset register for completeness and depreciation accuracy',
			},
		],
	},
	{
		id: 'hr',
		label: 'Human R.',
		count: 12,
		icon: Users,
		iconBg: 'bg-blue-100',
		iconCls: 'text-blue-600',
		description: 'Workforce and HR compliance audit templates.',
		templates: [
			{
				id: 'h1',
				name: 'Ghost Employee Detection',
				desc: 'Identifies employees in payroll not present in active headcount or biometric records.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-29',
				status: 'active',
				prompt: 'Detect ghost employees in payroll by cross-checking against active headcount records',
			},
			{
				id: 'h2',
				name: 'Leave Abuse Audit',
				desc: 'Flags suspicious leave patterns including excess leaves and unverified medical certificates.',
				inputs: 2,
				steps: 3,
				updatedAt: '2026-03-27',
				status: 'active',
				prompt: 'Audit employee leave records for abuse patterns and policy violations',
			},
			{
				id: 'h3',
				name: 'Hiring Compliance Check',
				desc: 'Validates recruitment records against approved headcount and policy requirements.',
				inputs: 3,
				steps: 4,
				updatedAt: '2026-03-24',
				status: 'active',
				prompt: 'Verify hiring records against approved headcount and recruitment policy compliance',
			},
		],
	},
	{
		id: 'risk',
		label: 'Risk & C.',
		count: 18,
		icon: ShieldCheck,
		iconBg: 'bg-rose-100',
		iconCls: 'text-rose-600',
		description: 'Risk assessment and regulatory compliance checks.',
		templates: [
			{
				id: 'r1',
				name: 'RACM Gap Analysis',
				desc: 'Identifies control gaps in Risk and Control Matrices against regulatory requirements.',
				inputs: 2,
				steps: 5,
				updatedAt: '2026-03-28',
				status: 'active',
				prompt: 'Analyze risk and control matrix for control gaps and regulatory compliance issues',
			},
			{
				id: 'r2',
				name: 'SoD Breach Detector',
				desc: 'Detects segregation of duties conflicts in user access rights and transaction approvals.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-26',
				status: 'active',
				prompt: 'Detect segregation of duties breaches in user access rights and transaction logs',
			},
			{
				id: 'r3',
				name: 'AML Transaction Monitor',
				desc: 'Screens transactions for anti-money laundering red flags and unusual patterns.',
				inputs: 2,
				steps: 6,
				updatedAt: '2026-03-23',
				status: 'active',
				prompt: 'Screen financial transactions for anti-money laundering red flags and structuring patterns',
			},
		],
	},
	{
		id: 'operations',
		label: 'Operations',
		count: 31,
		icon: Building2,
		iconBg: 'bg-amber-100',
		iconCls: 'text-amber-600',
		description: 'Operational efficiency and process compliance audits.',
		templates: [
			{
				id: 'o1',
				name: 'Inventory Discrepancy Audit',
				desc: 'Reconciles physical stock count against system records and flags variances above threshold.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-30',
				status: 'active',
				prompt: 'Reconcile physical inventory counts against system records and flag material discrepancies',
			},
			{
				id: 'o2',
				name: 'Vendor Contract Compliance',
				desc: 'Reviews vendor invoices and POs against contracts to detect overbilling and SLA breaches.',
				inputs: 3,
				steps: 5,
				updatedAt: '2026-03-27',
				status: 'active',
				prompt: 'Review vendor invoices against contracts to detect overbilling and SLA violations',
			},
			{
				id: 'o3',
				name: 'Procurement PO Audit',
				desc: 'Validates purchase orders against approved budgets and procurement policy requirements.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-25',
				status: 'active',
				prompt: 'Audit purchase orders against approved budgets and procurement compliance policies',
			},
		],
	},
	{
		id: 'it',
		label: 'IT & Sec',
		count: 11,
		icon: Lock,
		iconBg: 'bg-indigo-100',
		iconCls: 'text-indigo-600',
		description: 'IT access, security, and data integrity audits.',
		templates: [
			{
				id: 'i1',
				name: 'User Access Review',
				desc: 'Audits active user accounts against HR data to flag terminated or excess access rights.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-29',
				status: 'active',
				prompt: 'Review user access rights against HR records to identify excess or unauthorized access',
			},
			{
				id: 'i2',
				name: 'Privileged Access Audit',
				desc: 'Reviews admin and privileged accounts for policy compliance and access anomalies.',
				inputs: 2,
				steps: 5,
				updatedAt: '2026-03-26',
				status: 'active',
				prompt: 'Audit privileged user accounts for compliance with least privilege access policy',
			},
		],
	},
	{
		id: 'legal',
		label: 'Legal',
		count: 5,
		icon: FileText,
		iconBg: 'bg-teal-100',
		iconCls: 'text-teal-600',
		description: 'Contract review and legal compliance auditing.',
		templates: [
			{
				id: 'l1',
				name: 'Contract Expiry Monitor',
				desc: 'Tracks contract expiry dates and flags contracts approaching renewal with no action taken.',
				inputs: 1,
				steps: 3,
				updatedAt: '2026-03-28',
				status: 'active',
				prompt: 'Monitor contract expiry dates and flag contracts approaching renewal deadlines',
			},
			{
				id: 'l2',
				name: 'Clause Compliance Check',
				desc: 'Validates vendor contracts against standard clause library for missing or non-standard provisions.',
				inputs: 2,
				steps: 4,
				updatedAt: '2026-03-22',
				status: 'active',
				prompt: 'Check vendor contracts against standard clause library for missing or non-compliant provisions',
			},
		],
	},
	{
		id: 'training',
		label: 'Training',
		count: 7,
		icon: BookOpen,
		iconBg: 'bg-green-100',
		iconCls: 'text-green-600',
		description: 'Training compliance and certification audit templates.',
		templates: [
			{
				id: 'tr1',
				name: 'Training Completion Audit',
				desc: 'Verifies mandatory training completion rates against regulatory requirements by department.',
				inputs: 2,
				steps: 3,
				updatedAt: '2026-03-27',
				status: 'active',
				prompt: 'Audit mandatory training completion against regulatory requirements by department',
			},
			{
				id: 'tr2',
				name: 'Certification Validity Check',
				desc: 'Validates employee certifications for currency and role-specific compliance requirements.',
				inputs: 2,
				steps: 3,
				updatedAt: '2026-03-24',
				status: 'active',
				prompt: 'Validate employee certifications for currency and role compliance',
			},
		],
	},
	{
		id: 'general',
		label: 'General',
		count: 11,
		icon: LayoutGrid,
		iconBg: 'bg-slate-100',
		iconCls: 'text-slate-600',
		description: 'General purpose audit and data quality workflows.',
		templates: [
			{
				id: 'g1',
				name: 'Data Quality Audit',
				desc: 'Profiles datasets for completeness, accuracy, and consistency issues before analysis.',
				inputs: 1,
				steps: 4,
				updatedAt: '2026-03-29',
				status: 'active',
				prompt: 'Audit dataset for data quality issues including completeness, accuracy, and consistency',
			},
			{
				id: 'g2',
				name: 'Exception Report Builder',
				desc: 'Builds configurable exception reports from any dataset with threshold-based anomaly detection.',
				inputs: 1,
				steps: 3,
				updatedAt: '2026-03-26',
				status: 'active',
				prompt: 'Build an exception report from a dataset with configurable anomaly detection thresholds',
			},
		],
	},
];

const TOTAL_TEMPLATES = TEMPLATE_CATEGORIES.reduce(
	(sum, c) => sum + c.templates.length,
	0,
);

export default function WorkflowHome({ onRun }) {
	const dispatch = useDispatch();

	// Landing
	const [mode, setMode] = useState('landing');
	const [prompt, setPrompt] = useState('');
	const [workflows, setWorkflows] = useState(() => getWorkflows());
	const [openMenu, setOpenMenu] = useState(null);

	// Builder
	const [messages, setMessages] = useState([]);
	const [chatInput, setChatInput] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [workflow, setWorkflow] = useState(null);
	const [activeStep, setActiveStep] = useState(1);
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [rightTab, setRightTab] = useState('plan');
	const [rightOpen, setRightOpen] = useState(true);
	const [showPlanModal, setShowPlanModal] = useState(false);
	const [isEditingPlan, setIsEditingPlan] = useState(false);
	const [editableSteps, setEditableSteps] = useState([]);

	// Map Data step
	const [expandedSchemas, setExpandedSchemas] = useState({});
	const [openJustification, setOpenJustification] = useState(null);
	const [manualColMappings, setManualColMappings] = useState({});
	const [changingInputId, setChangingInputId] = useState(null);
	const changeFileRef = useRef(null);
	const [previewFile, setPreviewFile] = useState(null); // { file, name, schemaName }

	// Review & Run step
	const [isExecuting, setIsExecuting] = useState(false);
	const [showOutput, setShowOutput] = useState(false);
	const [outputTab, setOutputTab] = useState('output');
	const [clarifyOptions, setClarifyOptions] = useState(null); // string[] | null
	const clarifyResolveRef = useRef(null);

	// Output Config
	const [outputLayout, setOutputLayout] = useState('dashboard');
	const [kpiChecks, setKpiChecks] = useState({
		total: true,
		duplicates: true,
		amount: true,
		comparison: false,
		trend: false,
	});
	const [suggChecks, setSuggChecks] = useState({
		trend_col: true,
		variance: true,
		resolution: false,
		autogroup: false,
	});

	// Guided prompt modal
	const [guidedOpen, setGuidedOpen] = useState(false);
	const [guidedTarget, setGuidedTarget] = useState('landing'); // 'landing' | 'builder'

	// Required files expand/collapse
	const [isRequiredFilesExpanded, setIsRequiredFilesExpanded] = useState(false);

	// Data source search
	const [dsSearch, setDsSearch] = useState('');
	const [debouncedDsSearch, setDebouncedDsSearch] = useState('');

	// Landing — template categories
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [templatePage, setTemplatePage] = useState(0);
	const [templateSearch, setTemplateSearch] = useState('');

	const chatEndRef = useRef(null);
	const fileInputRef = useRef(null);
	const chatFileInputRef = useRef(null);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Debounce data source search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedDsSearch(dsSearch), 300);
		return () => clearTimeout(timer);
	}, [dsSearch]);

	// Auto-switch right panel to Output Config on step 4
	useEffect(() => {
		if (activeStep === 4) {
			setRightTab('output');
			setRightOpen(true);
		}
	}, [activeStep]);

	const closeSidebar = () =>
		dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]));

	const addMsg = (role, content) =>
		setMessages((prev) => [...prev, { role, content }]);

	const refresh = () => setWorkflows(getWorkflows());

	// Data sources for "Select from existing" section
	const {
		dataSources,
		isLoading: dsLoading,
		Sentinel: DsSentinel,
	} = useDataSources({
		enabled: activeStep === 2,
		search: debouncedDsSearch || undefined,
	});
	const filteredDs = (dataSources || []).sort((a, b) => {
		if (a.status === 'active' && b.status !== 'active') return -1;
		if (a.status !== 'active' && b.status === 'active') return 1;
		return 0;
	});

	// ── Builder transition ─────────────────────────────────────────────
	const enterBuilder = async (text) => {
		closeSidebar();
		setMode('builder');
		setMessages([{ role: 'user', content: text }]);
		setIsGenerating(true);
		setWorkflow(null);
		setActiveStep(1);
		setUploadedFiles([]);
		setExpandedSchemas({});
		setManualColMappings({});
		setShowOutput(false);
		setClarifyOptions(null);
		try {
			const { workflow: wf, message } = await generateWorkflow([
				{ role: 'user', content: text },
			]);
			setWorkflow(wf);
			setActiveStep(2);
			// Expand first input by default for Map Data step
			setExpandedSchemas({ [wf.inputs[0]?.id]: true });
			addMsg(
				'assistant',
				`I've analyzed your prompt and built the **${wf.name}**.\nNow, please upload the required data files in the centre section so I can begin the mapping process.`,
			);
		} catch {
			addMsg('assistant', 'Something went wrong. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const LUCKY_PROMPTS = [
		'Audit vendor invoices against POs for overbilling and duplicate payments',
		'Cross-validate payroll disbursements against HR records to detect ghost employees',
		'Review AP invoices against the GL trial balance for miscoding and SoD breaches',
		'Verify terminal charges against the rate master for excess billing',
	];

	const handleLandingSubmit = () => {
		const text = prompt.trim();
		if (!text) return;
		enterBuilder(text);
		setPrompt('');
	};

	// ── Builder chat ───────────────────────────────────────────────────
	const handleBuilderSend = async () => {
		const text = chatInput.trim();
		if (!text || isGenerating) return;
		setChatInput('');
		addMsg('user', text);
		setIsGenerating(true);
		try {
			const { workflow: wf, message } = await generateWorkflow([
				...messages,
				{ role: 'user', content: text },
			]);
			setWorkflow(wf);
			setActiveStep(2);
			setUploadedFiles([]);
			setExpandedSchemas({ [wf.inputs[0]?.id]: true });
			setManualColMappings({});
			addMsg('assistant', message);
		} catch {
			addMsg('assistant', 'Something went wrong. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	// ── File handling ──────────────────────────────────────────────────
	const autoFillFiles = () => {
		if (!workflow) return;
		const files = workflow.inputs.map(makeDummyFile);
		setUploadedFiles(files);
		addMsg('user', 'Auto-fill sample files');
		addMsg(
			'assistant',
			'Sample files have been auto-populated for all expected inputs. Click **Verify with Ira** to proceed.',
		);
	};

	const handleFileInput = (e) => {
		const files = Array.from(e.target.files ?? []).map((f) => ({
			name: f.name,
			type: f.name.endsWith('.pdf') ? 'pdf' : 'csv',
			inputId: null,
		}));
		setUploadedFiles((prev) => [...prev, ...files]);
		addMsg('user', `Uploaded ${files.length} file(s)`);
	};

	const handleChangeFile = (inputId) => {
		setChangingInputId(inputId);
		changeFileRef.current?.click();
	};

	const handleChangeFileSelected = (e) => {
		const file = e.target.files?.[0];
		if (!file || !changingInputId) return;
		const mapped = {
			name: file.name,
			type: file.name.endsWith('.pdf') ? 'pdf' : 'csv',
			inputId: changingInputId,
		};
		setUploadedFiles((prev) => {
			const filtered = prev.filter((f) => f.inputId !== changingInputId);
			return [...filtered, mapped];
		});
		setChangingInputId(null);
		e.target.value = '';
	};

	const handleDrop = (e) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files).map((f) => ({
			name: f.name,
			type: f.name.endsWith('.pdf') ? 'pdf' : 'csv',
			inputId: null,
		}));
		setUploadedFiles((prev) => [...prev, ...files]);
	};

	const handleVerify = () => {
		addMsg(
			'assistant',
			"Files verified successfully! All required inputs are matched. Moving to Data Mapping — I've suggested column alignments using AI. Review and confirm each mapping.",
		);
		setActiveStep(3);
	};

	const handleConfirmMapping = () => {
		addMsg(
			'assistant',
			"Mappings confirmed! Here's the full execution plan for the **" +
				workflow?.name +
				'**. Review the steps and click **Run Workflow** when ready.',
		);
		setActiveStep(4);
	};

	// Returns a promise that resolves when the user picks a clarification option
	const askClarify = (question, options) => {
		addMsg('assistant', question);
		setClarifyOptions(options);
		return new Promise((resolve) => {
			clarifyResolveRef.current = resolve;
		});
	};

	const handleClarifySelect = (option) => {
		setClarifyOptions(null);
		addMsg('user', option);
		if (clarifyResolveRef.current) {
			clarifyResolveRef.current(option);
			clarifyResolveRef.current = null;
		}
	};

	const handleSaveAndRun = async () => {
		if (!workflow || isExecuting) return;
		setIsExecuting(true);
		addMsg('user', 'Run Workflow');
		try {
			saveWorkflow(workflow);
			await new Promise((r) => setTimeout(r, 700));
			addMsg(
				'assistant',
				`Initiating test run for **${workflow.name}**. I'm processing the ${uploadedFiles.length || 1} uploaded file(s) and applying the audit logic…`,
			);
			await new Promise((r) => setTimeout(r, 800));

			const choice = await askClarify(
				"I've encountered a slight ambiguity in the **MTOW Master** data. Some entries have multiple weight categories. How should I handle these?",
				[
					'Use the maximum weight',
					'Use the average weight',
					'Flag for manual review',
				],
			);

			await new Promise((r) => setTimeout(r, 500));
			addMsg(
				'assistant',
				`Got it. Applying the **${choice.toLowerCase()}** logic. Finalising the audit report…`,
			);
			await new Promise((r) => setTimeout(r, 900));
			setShowOutput(true);
			setOutputTab('output');
		} catch {
			addMsg(
				'assistant',
				'Something went wrong while running the workflow. Please try again.',
			);
			setClarifyOptions(null);
		} finally {
			setIsExecuting(false);
		}
	};

	const handleRunTemplate = (wf) => onRun(wf.id);

	const handleDeleteTemplate = (id) => {
		deleteWorkflow(id);
		setOpenMenu(null);
		refresh();
	};

	const toggleSchema = (id) =>
		setExpandedSchemas((prev) => ({ ...prev, [id]: !prev[id] }));

	/* ══════════════════════════════════════════════════════════════════ */
	/* LANDING MODE                                                        */
	/* ══════════════════════════════════════════════════════════════════ */
	if (mode === 'landing') {
		const searchLower = templateSearch.toLowerCase();
		const searchResults = templateSearch.trim()
			? TEMPLATE_CATEGORIES.flatMap((c) =>
					c.templates
						.filter(
							(t) =>
								t.name.toLowerCase().includes(searchLower) ||
								t.desc.toLowerCase().includes(searchLower) ||
								c.label.toLowerCase().includes(searchLower),
						)
						.map((t) => ({
							...t,
							categoryLabel: c.label,
							categoryIcon: c.icon,
							categoryIconBg: c.iconBg,
							categoryIconCls: c.iconCls,
						})),
				)
			: [];

		const activeCat = selectedCategory
			? TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)
			: null;
		const ITEMS_PER_PAGE = 3;
		const totalPages = activeCat
			? Math.ceil(activeCat.templates.length / ITEMS_PER_PAGE)
			: 0;
		const pageTemplates = activeCat
			? activeCat.templates.slice(
					templatePage * ITEMS_PER_PAGE,
					(templatePage + 1) * ITEMS_PER_PAGE,
				)
			: [];

		const TemplateCard = ({ tpl }) => (
			<div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col hover:border-violet-200 hover:shadow-[0_2px_16px_rgba(139,92,246,0.08)] transition-all duration-200 group">
				<div className="flex items-start justify-between mb-3">
					<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
						<Zap className="size-4 text-violet-600" />
					</div>
					<Badge
						className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tpl.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
					>
						{tpl.status === 'active' ? 'Active' : 'Draft'}
					</Badge>
				</div>
				<h4 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
					{tpl.name}
				</h4>
				<p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3 font-normal">
					{tpl.desc}
				</p>
				<div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1.5">
					<span className="flex items-center gap-1">
						<Plus className="size-3" />
						{tpl.inputs} inputs
					</span>
					<span className="flex items-center gap-1">
						<FileOutput className="size-3" />
						{tpl.steps} steps
					</span>
				</div>
				<div className="flex items-center gap-1 text-[11px] text-gray-400 mb-4">
					<Clock className="size-3" />
					<span>Updated {formatDate(tpl.updatedAt)}</span>
				</div>
				<button
					onClick={() => enterBuilder(tpl.prompt)}
					className="w-full py-2 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
				>
					<Sparkles className="size-3.5 text-violet-400" /> Run Workflow
				</button>
			</div>
		);

		return (
			<div className="flex flex-col h-full overflow-hidden bg-[#FBFBFD]">
				{/* ── Page header: title + horizontal stepper ── */}
				<div className="flex-shrink-0 bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-6">
					<div className="flex items-center gap-2.5 flex-shrink-0">
						<div className="w-8 h-8 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
							<Sparkles className="size-4 text-violet-600" />
						</div>
						<span className="text-sm font-semibold text-gray-900">
							Workflow Builder
						</span>
					</div>

					<div className="flex items-center gap-0 ml-auto">
						{HSTEPS.map((step, i) => (
							<div key={step.label} className="flex items-center">
								<div
									className="flex flex-col items-center"
									style={{ minWidth: 60 }}
								>
									<div
										className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border transition-all duration-200 ${
											i === 0
												? 'bg-violet-600 border-violet-600 text-white'
												: 'bg-white border-gray-300 text-gray-400'
										}`}
									>
										{i + 1}
									</div>
									<span
										className={`text-[9px] mt-1 text-center uppercase tracking-wide font-semibold whitespace-nowrap ${i === 0 ? 'text-violet-600' : 'text-gray-400'}`}
									>
										{step.label}
									</span>
								</div>
								{i < HSTEPS.length - 1 && (
									<div className="w-6 h-px bg-gray-200 mx-0.5 mb-3 flex-shrink-0" />
								)}
							</div>
						))}
					</div>
				</div>

				{/* ── Scrollable body ── */}
				<div className="flex-1 overflow-y-auto">
					{/* Hero */}
					<div className="px-10 pt-10 pb-6 text-center">
						<h1 className="text-6xl font-extrabold leading-tight mb-3 tracking-tight">
							<span className="text-slate-900">Audit smarter. </span>
							<span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
								Not harder.
							</span>
						</h1>
						<p className="text-base text-gray-400">
							Your AI copilot already knows what to look for. Just ask.
						</p>
					</div>

					{/* Input card */}
					<div className="px-[20%] pb-8">
						<div className="ai-glow bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
							<textarea
								value={prompt}
								onChange={(e) => {
									setPrompt(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleLandingSubmit();
									}
								}}
								placeholder="Describe a workflow and let Auditify do the rest…"
								rows={3}
								className="w-full bg-transparent resize-none text-sm text-slate-800 placeholder:text-slate-400 outline-none leading-relaxed font-normal"
							/>
							<div className="flex items-center justify-between pt-1 border-t border-gray-100">
								<div className="flex items-center gap-1">
									<button className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-200">
										<Paperclip className="size-4" />
									</button>
									<button className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-200">
										<Plus className="size-4" />
									</button>
									<button
										onClick={() => {
											setGuidedTarget('landing');
											setGuidedOpen(true);
										}}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-all duration-200"
									>
										<Sparkles className="size-3.5" />
										Guide me
									</button>
								</div>
								<button
									onClick={handleLandingSubmit}
									disabled={!prompt.trim()}
									className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 shadow-none"
								>
									<Sparkles className="size-4" /> Audit on Chat
								</button>
							</div>
						</div>
					</div>

					{/* Recent Workflows section */}
					<div className="px-[20%] pb-10">
						{/* Section header */}
						<div className="flex items-start justify-between mb-4">
							<div>
								<h2 className="text-base font-semibold text-gray-900">
									Recent Workflows
								</h2>
								<p className="text-sm text-gray-400 mt-0.5">
									Pick up where you left off
								</p>
							</div>
							{workflows.length > 0 && (
								<span className="text-xs text-gray-400 mt-1">
									{workflows.length} workflow
									{workflows.length !== 1 ? 's' : ''}
								</span>
							)}
						</div>

						{/* Empty state */}
						{workflows.length === 0 ? (
							<div className="border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 py-14 flex flex-col items-center justify-center text-center">
								<div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
									<LayoutGrid className="size-7 text-violet-400" />
								</div>
								<p className="text-sm font-semibold text-gray-800 mb-1">
									No recent workflows yet
								</p>
								<p className="text-xs text-gray-400">
									Start by describing a workflow above
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{workflows.map((wf) => {
									const relTime = (() => {
										const diffMs =
											Date.now() -
											new Date(wf.updatedAt).getTime();
										const m = Math.floor(diffMs / 60000);
										const h = Math.floor(m / 60);
										const d = Math.floor(h / 24);
										if (m < 1) return 'Just now';
										if (m < 60) return `${m}m ago`;
										if (h < 24) return `${h}h ago`;
										if (d === 1) return 'Yesterday';
										if (d < 7) return `${d} days ago`;
										return new Date(
											wf.updatedAt,
										).toLocaleDateString();
									})();
									return (
										<div
											key={wf.id}
											className="group flex items-center gap-4 bg-white border border-gray-200 hover:border-violet-200 hover:shadow-md rounded-2xl px-5 py-4 transition-all duration-200 hover:-translate-y-px"
										>
											{/* Icon */}
											<div className="w-9 h-9 rounded-lg bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center flex-shrink-0 transition-colors">
												<FileText className="size-4 text-violet-500" />
											</div>

											{/* Content */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap mb-0.5">
													<span className="text-sm font-semibold text-gray-900 truncate">
														{wf.name}
													</span>
													<Badge
														variant="secondary"
														className={
															wf.status === 'active'
																? 'bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-0 font-medium'
																: 'bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0 font-medium'
														}
													>
														{wf.status === 'active'
															? 'Active'
															: 'Draft'}
													</Badge>
												</div>
												<p className="text-xs text-gray-500 truncate mb-1.5">
													{wf.description}
												</p>
												<div className="flex items-center gap-3 text-[11px] text-gray-400">
													<span className="flex items-center gap-1">
														<Clock className="size-3" />
														{relTime}
													</span>
													<span className="flex items-center gap-1">
														<FileInput className="size-3" />
														{wf.inputs?.length ?? 0}{' '}
														input
														{(wf.inputs?.length ?? 0) !==
														1
															? 's'
															: ''}
													</span>
													{wf.runCount > 0 && (
														<span className="flex items-center gap-1">
															<BarChart3 className="size-3" />
															{wf.runCount} run
															{wf.runCount !== 1
																? 's'
																: ''}
														</span>
													)}
												</div>
											</div>

											{/* Actions */}
											<div className="flex items-center gap-2 flex-shrink-0">
												<button
													onClick={() =>
														enterBuilder(wf.name)
													}
													className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-colors"
												>
													<Settings2 className="size-3.5" />
													Configure
												</button>
												<button
													onClick={() =>
														handleRunTemplate(wf)
													}
													className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
												>
													<Play className="size-3.5 fill-current" />
													Run
												</button>
												<button
													onClick={() =>
														handleDeleteTemplate(wf.id)
													}
													className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
												>
													<Trash2 className="size-3.5" />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	/* ══════════════════════════════════════════════════════════════════ */
	/* BUILDER MODE — 3-panel layout                                       */
	/* ══════════════════════════════════════════════════════════════════ */
	const isStepCompleted = (n) => {
		if (n === 1) return !!workflow;
		if (n === 2) return activeStep > 2;
		if (n === 3) return activeStep > 3;
		return false;
	};

	const filesReady = uploadedFiles.length > 0;

	return (
		<>
			<div className="flex h-full min-h-0 overflow-hidden">
				{/* ══════════════════════════════════════════════════════════
			    LEFT PANEL — AI Assistant
			══════════════════════════════════════════════════════════ */}
				<aside className="w-[30%] flex-shrink-0 flex flex-col bg-white border-r border-gray-100">
					{/* Header — dark AI bar */}
					<div className="px-5 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
						<div className="flex items-center gap-2 mb-3">
							<div className="w-7 h-7 rounded-lg bg-violet-50 ring-1 ring-violet-200/50 flex items-center justify-center flex-shrink-0">
								<Sparkles className="size-3.5 text-violet-600" />
							</div>
							<span className="text-sm font-medium text-gray-900 flex-1">
								AI Assistant
							</span>
							<span className="text-xs text-gray-400 font-medium">
								Step {activeStep} of {VSTEPS.length}
							</span>
						</div>

						{/* Dot–line progress bar */}
						<div className="flex items-center w-full">
							{VSTEPS.map((step, idx) => {
								const completed = isStepCompleted(step.num);
								const active = activeStep === step.num;
								return (
									<Fragment key={step.num}>
										<button
											onClick={() => {
												if (step.num <= activeStep)
													setActiveStep(step.num);
											}}
											title={step.label}
											className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 focus:outline-none ${
												completed
													? 'bg-emerald-500'
													: active
														? 'bg-violet-500'
														: 'bg-violet-500/25'
											} ${step.num <= activeStep ? 'cursor-pointer' : 'cursor-default'}`}
										/>
										{idx < VSTEPS.length - 1 && (
											<div
												className={`h-px flex-1 ${completed ? 'bg-emerald-500/40' : 'bg-violet-500/20'}`}
											/>
										)}
									</Fragment>
								);
							})}
							<span className="ml-4 text-xs font-semibold text-violet-600 flex-shrink-0">
								{VSTEPS.find((s) => s.num === activeStep)?.label}
							</span>
						</div>
					</div>

					{/* Chat messages */}
					<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
						{messages.map((m, i) => (
							<div
								key={i}
								className={`flex gap-2 wf-msg-enter ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
							>
								<div
									className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold mt-0.5 ${
										m.role === 'user'
											? 'bg-gray-900 text-white'
											: 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'
									}`}
								>
									{m.role === 'user' ? 'U' : 'AI'}
								</div>
								<div
									className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
										m.role === 'user'
											? 'bg-gray-900 text-white rounded-tr-sm'
											: 'bg-gray-50 text-gray-700 rounded-tl-sm border border-gray-100'
									}`}
									dangerouslySetInnerHTML={{
										__html: m.content.replace(
											/\*\*(.*?)\*\*/g,
											'<strong class="font-semibold text-violet-600">$1</strong>',
										),
									}}
								/>
							</div>
						))}

						{/* Auto-fill buttons */}
						{workflow &&
							activeStep === 2 &&
							uploadedFiles.length === 0 &&
							!isGenerating && (
								<div className="flex gap-2 mt-1">
									<button
										onClick={autoFillFiles}
										className="flex-1 text-xs bg-violet-50 text-violet-700 border border-violet-200/70 rounded-xl px-3 py-2 hover:bg-violet-100 transition-all duration-200 font-medium"
									>
										Auto-fill sample files
									</button>
									<button
										onClick={() => fileInputRef.current?.click()}
										className="flex-1 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-100 transition-all duration-200 font-medium"
									>
										I'll upload them myself
									</button>
									<input
										ref={fileInputRef}
										type="file"
										multiple
										className="hidden"
										onChange={handleFileInput}
									/>
								</div>
							)}

						{isGenerating && !clarifyOptions && (
							<div className="flex gap-2">
								<div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-[9px] font-semibold text-white mt-0.5">
									AI
								</div>
								<div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
									<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
									<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
								</div>
							</div>
						)}

						{/* Clarification option pills */}
						{clarifyOptions && (
							<div className="flex flex-col gap-1.5 mt-1">
								{clarifyOptions.map((option) => (
									<button
										key={option}
										onClick={() => handleClarifySelect(option)}
										className="w-full text-left text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all duration-150"
									>
										{option}
									</button>
								))}
							</div>
						)}

						<div ref={chatEndRef} />
					</div>

					{/* Chat input */}
					<div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
						<div className="flex gap-2 items-end">
							<textarea
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleBuilderSend();
									}
								}}
								placeholder="Describe what you need…"
								rows={2}
								className="flex-1 resize-none text-xs rounded-xl px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-all duration-200 leading-relaxed"
							/>
							<button
								onClick={handleBuilderSend}
								disabled={
									!chatInput.trim() ||
									isGenerating ||
									!!clarifyOptions
								}
								className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl h-9 w-9 flex items-center justify-center flex-shrink-0 transition-all duration-200"
							>
								<Send className="size-3.5" />
							</button>
						</div>
						<div className="flex items-center gap-1.5 mt-2">
							<button
								onClick={() => chatFileInputRef.current?.click()}
								className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
								title="Attach files"
							>
								<Paperclip className="size-3.5" />
							</button>
							<input
								ref={chatFileInputRef}
								type="file"
								multiple
								className="hidden"
								onChange={handleFileInput}
							/>
							<button
								onClick={() => {
									setGuidedTarget('builder');
									setGuidedOpen(true);
								}}
								className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-all duration-200"
							>
								<Sparkles className="size-3" />
								Guide me
							</button>
							<span className="text-[10px] text-gray-400 ml-auto">
								Try: &ldquo;Add validation step&rdquo; or
								&ldquo;Change output to table&rdquo;
							</span>
						</div>
					</div>
				</aside>

				{/* ══════════════════════════════════════════════════════════
			    CENTER PANEL — Canvas (flexible)
			══════════════════════════════════════════════════════════ */}
				<main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FBFBFD]">
					{/* ── No workflow yet — empty state ── */}
					{!workflow && (
						<div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
							<div className="w-20 h-20 rounded-2xl bg-[rgba(106,18,205,0.08)] border border-[rgba(106,18,205,0.12)] flex items-center justify-center">
								<Sparkles className="size-10 text-[#6A12CD]" />
							</div>
							<div className="text-center">
								<h2 className="text-2xl font-bold text-slate-800">
									Let's build your workflow
								</h2>
								<p className="text-base text-slate-400 mt-2 max-w-sm leading-relaxed">
									Describe your audit process in the chat on the
									left to get started.
								</p>
							</div>
						</div>
					)}

					{/* ── Step 2: Upload Files ── */}
					{workflow && activeStep === 2 && (
						<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
							{/* Upload header */}
							<div className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-xl bg-violet-50 ring-1 ring-violet-200/50 flex items-center justify-center">
										<CloudUpload className="size-4 text-violet-600" />
									</div>
									<div>
										<h2 className="text-sm font-semibold text-gray-900">
											Upload Data Files
										</h2>
										<p className="text-xs text-gray-400 mt-0.5">
											Upload the files required for this
											workflow, then verify with Ira
										</p>
									</div>
								</div>
							</div>

							<div className="flex-1 overflow-y-auto p-6 space-y-4">
								{/* Required Files collapsible */}
								<div className="border border-black/10 rounded-lg bg-white">
									<div className="flex items-center justify-between px-4 py-2 border-b border-black/10">
										<div className="flex items-center gap-2">
											<FileText className="size-5" />
											<h3 className="text-sm font-medium text-gray-900">
												Required Files
											</h3>
										</div>
										<button
											onClick={() =>
												setIsRequiredFilesExpanded(
													!isRequiredFilesExpanded,
												)
											}
											className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
										>
											{isRequiredFilesExpanded
												? 'Click to Collapse'
												: 'Click to Expand'}
											{isRequiredFilesExpanded ? (
												<ChevronUp className="size-4" />
											) : (
												<ChevronDown className="size-4" />
											)}
										</button>
									</div>

									{!isRequiredFilesExpanded ? (
										<div className="px-4 py-3">
											<div className="flex flex-wrap items-center gap-4">
												{workflow.inputs?.map((inp) => (
													<div
														key={inp.id}
														className="flex items-center gap-2 px-2 py-2 border border-[#F0F1F3] rounded-lg"
													>
														<span className="text-sm font-medium truncate max-w-[180px]">
															{inp.name}
														</span>
														<span className="text-xs text-[#344054] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
															{inp.type?.toUpperCase()}
														</span>
													</div>
												))}
											</div>
										</div>
									) : (
										<div className="py-4 px-4 max-h-48 overflow-y-auto">
											<div className="grid grid-cols-2 gap-4">
												{workflow.inputs?.map((inp) => (
													<div
														key={inp.id}
														className="border border-slate-200 rounded-lg px-3 py-2 bg-white space-y-1"
													>
														<div className="flex items-center gap-2">
															<h4 className="text-sm text-gray-900">
																{inp.name}
															</h4>
															<span className="text-xs text-[#344054] bg-[#F2F4F7] px-2 py-0.5 rounded-full">
																{inp.type?.toUpperCase()}
															</span>
														</div>
														{inp.description && (
															<p className="text-xs text-[#6B7280]">
																{inp.description}
															</p>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</div>

								{/* Drop zone */}
								<div
									onDragOver={(e) => e.preventDefault()}
									onDrop={handleDrop}
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed border-[#E5E7EB] hover:border-violet-400 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-white hover:bg-violet-50/30 group"
								>
									<div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
										<CloudUpload className="size-6 text-slate-400 group-hover:text-violet-600 transition-colors" />
									</div>
									<div className="text-center">
										<p className="text-sm font-semibold text-slate-700">
											Drop files here or click to upload
										</p>
										<p className="text-xs text-slate-400 mt-1">
											CSV, PDF, images — any data files for
											this workflow
										</p>
									</div>
									<input
										ref={fileInputRef}
										type="file"
										multiple
										className="hidden"
										onChange={handleFileInput}
									/>
								</div>

								{/* Uploaded file pills */}
								{filesReady && (
									<div className="flex flex-wrap gap-2">
										{uploadedFiles.map((f, i) => (
											<span
												key={i}
												className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full"
											>
												<CheckCircle2 className="size-3" />{' '}
												{f.name}
											</span>
										))}
									</div>
								)}

								{/* OR separator */}
								<div className="flex items-center gap-3 py-1">
									<div className="flex-1 border-t border-gray-200" />
									<span className="text-sm text-gray-400 font-medium px-1">
										OR
									</span>
									<div className="flex-1 border-t border-gray-200" />
								</div>

								{/* Select from existing data source */}
								<div>
									<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
										Select From Existing Data Source
									</p>

									{/* Search */}
									<div className="relative mb-4">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search data source..."
											value={dsSearch}
											onChange={(e) =>
												setDsSearch(e.target.value)
											}
											className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
										/>
									</div>

									{/* Grid */}
									{dsLoading ? (
										<div className="grid grid-cols-2 gap-3">
											{Array.from({ length: 4 }).map(
												(_, i) => (
													<div
														key={i}
														className="h-16 bg-gray-100 animate-pulse rounded-lg"
													/>
												),
											)}
										</div>
									) : filteredDs.length === 0 ? (
										<p className="text-center py-8 text-sm text-gray-400">
											No data sources found
										</p>
									) : (
										<>
											<div className="grid grid-cols-2 gap-3">
												{filteredDs.map((ds) => (
													<div
														key={ds.datasource_id}
														className="border border-gray-200 hover:bg-violet-50 rounded-lg py-2 px-3 flex items-center gap-3 cursor-pointer transition-all"
													>
														<Database className="size-4 text-violet-600 flex-shrink-0" />
														<div className="flex-1 truncate">
															<div className="text-sm font-medium truncate">
																{ds.name}
															</div>
															<div className="text-xs text-gray-400">
																Last synced:{' '}
																{ds.updated_at
																	? new Date(
																			ds.updated_at,
																		).toLocaleString()
																	: 'N/A'}
															</div>
														</div>
													</div>
												))}
											</div>
											<DsSentinel />
										</>
									)}
								</div>
							</div>

							{/* Verify button */}
							<div className="px-6 py-4 border-t-2 border-slate-200 bg-white flex-shrink-0">
								<button
									onClick={handleVerify}
									disabled={!filesReady}
									className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-violet-700 hover:bg-violet-800 text-white shadow-sm"
								>
									<ShieldCheck className="size-4" /> Verify with
									Ira
								</button>
							</div>
						</div>
					)}

					{/* ── Step 3: Map Data ── */}
					{workflow && activeStep === 3 && (
						<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
							{/* Header */}
							<div className="px-6 py-5 bg-white border-b-2 border-slate-200 flex items-center justify-between flex-shrink-0">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
										<Link2 className="size-5 text-emerald-600" />
									</div>
									<div>
										<h2 className="text-lg font-bold text-slate-900">
											Data Mapping
										</h2>
										<p className="text-sm text-slate-400 mt-0.5">
											Map files and align columns in one
											unified step
										</p>
									</div>
								</div>
								<span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
									<Sparkles className="size-3" /> AI SUGGESTED
									MAPPINGS
								</span>
							</div>

							{/* Hidden file input for changing a mapped file */}
							<input
								ref={changeFileRef}
								type="file"
								className="hidden"
								onChange={handleChangeFileSelected}
							/>

							<div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
								{/* Mapping cards per input */}
								{workflow.inputs?.map((inp, inputIdx) => {
									const fallbackMappedFile = fileMappedName(
										inp,
										uploadedFiles,
										inputIdx,
									);
									const isMultiFileDemo =
										inputIdx === 0 ||
										inp?.name?.includes('Invoice');
									const mappedFilesArr = isMultiFileDemo
										? [
												'Jan_Invoices.csv',
												'Feb_Invoices.csv',
												'Mar_Invoices.csv',
											]
										: [fallbackMappedFile];
									const mappedFile = mappedFilesArr[0];
									const rawPct = 90 + ((inputIdx * 3) % 10); // high confidence for auto-filled
									const md = matchDisplay(rawPct);
									const expanded =
										expandedSchemas[inp.id] ?? inputIdx === 0;
									const visibleCols = (inp.columns ?? []).slice(
										0,
										5,
									);

									return (
										<div
											key={inp.id}
											className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
										>
											{/* Card header — click to expand/collapse */}
											<div
												className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
												onClick={() => toggleSchema(inp.id)}
											>
												<div className="flex items-start justify-between gap-4">
													{/* Left: Expected Schema */}
													<div className="flex items-center gap-3 flex-1 min-w-0">
														<div
															className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
														>
															<ChevronDown className="size-4 text-slate-400" />
														</div>
														<div>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
																Expected Schema
															</p>
															<p className="text-base font-semibold text-slate-800">
																{inp.name}
															</p>
															<p className="text-sm text-slate-400 mt-0.5">
																{inp.description}
															</p>
														</div>
													</div>

													{/* Right: Mapped Source */}
													<div
														className="flex-1 min-w-0"
														onClick={(e) =>
															e.stopPropagation()
														}
													>
														<div className="flex items-center justify-between mb-1.5">
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
																Mapped Source{' '}
																{mappedFilesArr.length >
																	1 &&
																	`(Bundle of ${mappedFilesArr.length})`}
															</p>
															<span
																className={`inline-flex items-center gap-1 text-xs font-bold ${md.bg}`}
															>
																<Check className="size-3" />{' '}
																{md.label}
															</span>
														</div>

														{mappedFilesArr.length >
														1 ? (
															<div className="flex flex-col relative pl-4 mt-2">
																{/* Union Bracket Visualization */}
																<div className="absolute left-[3px] top-[14px] bottom-[14px] w-2 border-l-2 border-y-2 border-slate-300 rounded-l-md opacity-70"></div>
																<div className="absolute left-[-2px] top-1/2 -translate-y-1/2 bg-white text-slate-400 p-0.5">
																	<Link2 className="size-3.5" />
																</div>

																<div className="flex flex-col gap-1.5 z-10 relative mt-0.5">
																	{mappedFilesArr.map(
																		(
																			fName,
																			i,
																		) => (
																			<div
																				key={
																					i
																				}
																				className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] group"
																			>
																				<div className="flex items-center gap-2 min-w-0">
																					<FileText className="size-3.5 text-slate-400 shrink-0" />
																					<span className="text-sm text-slate-700 font-medium truncate max-w-[140px]">
																						{
																							fName
																						}
																					</span>
																				</div>
																				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																					<button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
																						<RefreshCw className="size-3" />
																					</button>
																					<button className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
																						<X className="size-3" />
																					</button>
																				</div>
																			</div>
																		),
																	)}

																	<div className="flex items-center gap-2 mt-1 ml-1">
																		<button
																			onClick={() =>
																				handleChangeFile(
																					inp.id,
																				)
																			}
																			className="inline-flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-800 font-medium whitespace-nowrap transition-colors py-1 pl-1 pr-2 hover:bg-violet-50 rounded-md"
																		>
																			<Plus className="size-3.5" />{' '}
																			Add File
																		</button>
																		<button
																			onClick={(
																				e,
																			) => {
																				e.stopPropagation();
																				setPreviewFile(
																					{
																						file: null,
																						name: mappedFilesArr[0],
																						schemaName:
																							inp.name,
																					},
																				);
																			}}
																			className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-700 font-medium whitespace-nowrap transition-colors py-1 px-2 hover:bg-slate-50 rounded-md ml-auto"
																		>
																			<Eye className="size-3.5" />{' '}
																			Preview
																			Union
																		</button>
																	</div>
																</div>
															</div>
														) : (
															<div className="flex items-center justify-between gap-2">
																<div className="flex items-center gap-2 min-w-0">
																	<span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-medium truncate max-w-[160px]">
																		<FileText className="size-3.5 text-slate-400 shrink-0" />
																		{
																			mappedFilesArr[0]
																		}
																	</span>
																	<button
																		onClick={() =>
																			handleChangeFile(
																				inp.id,
																			)
																		}
																		className="text-xs text-violet-700 hover:text-violet-800 font-medium whitespace-nowrap transition-colors"
																	>
																		Change
																	</button>
																	<button className="text-slate-400 hover:text-slate-600 transition-colors">
																		<RefreshCw className="size-3.5" />
																	</button>
																</div>
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		const fileEntry =
																			uploadedFiles.find(
																				(
																					f,
																				) =>
																					f.inputId ===
																					inp.id,
																			) ??
																			uploadedFiles[
																				inputIdx
																			];
																		setPreviewFile(
																			{
																				file:
																					fileEntry?.file ??
																					null,
																				name: mappedFilesArr[0],
																				schemaName:
																					inp.name,
																			},
																		);
																	}}
																	className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors flex-shrink-0"
																	title="Preview data"
																>
																	<Eye className="size-3.5" />
																</button>
															</div>
														)}
													</div>
												</div>
											</div>

											{/* Column alignment — shown when expanded */}
											{expanded && visibleCols.length > 0 && (
												<div className="px-5 pb-5 border-t border-slate-100">
													<div className="flex items-center justify-between py-3">
														<p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
															Column Alignment
														</p>
														<span className="text-sm text-slate-400">
															{visibleCols.length} /{' '}
															{visibleCols.length}{' '}
															Fields
														</span>
													</div>
													<div className="bg-slate-50 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
														{/* Table header */}
														<div className="grid grid-cols-4 gap-4 px-4 py-2.5 border-b border-slate-200">
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
																Source Column{' '}
																{mappedFilesArr.length >
																	1 &&
																	'(Combined)'}
															</p>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
																Mapping
															</p>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
																Target Schema
															</p>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
																Confidence
															</p>
														</div>
														{visibleCols.map(
															(col, j) => {
																const confPct =
																	colConfPct(j);
																const cd =
																	matchDisplay(
																		confPct,
																	);
																const shortCode = col
																	.substring(0, 2)
																	.toUpperCase();
																const targetName =
																	col
																		.replace(
																			/_/g,
																			' ',
																		)
																		.replace(
																			/\b\w/g,
																			(c) =>
																				c.toUpperCase(),
																		)
																		.replace(
																			/ /g,
																			'',
																		);
																const targetType =
																	col.includes(
																		'date',
																	)
																		? 'TIMESTAMP'
																		: col.includes(
																					'amount',
																			  ) ||
																			  col.includes(
																					'pay',
																			  ) ||
																			  col.includes(
																					'rate',
																			  )
																			? 'DECIMAL'
																			: 'STRING';
																const key = `${inp.id}:${col}`;

																// Parameter bars for popover
																const nameSimScore =
																	confPct >= 90
																		? 90 +
																			((j *
																				3) %
																				10)
																		: confPct >=
																			  70
																			? 55 +
																				((j *
																					13) %
																					25)
																			: 25 +
																				((j *
																					9) %
																					20);
																const typeCompatScore =
																	confPct >= 90
																		? 92 +
																			((j *
																				5) %
																				8)
																		: confPct >=
																			  70
																			? 85 +
																				((j *
																					7) %
																					12)
																			: 45 +
																				((j *
																					11) %
																					25);
																const statProfileScore =
																	confPct >= 90
																		? 88 +
																			((j *
																				7) %
																				12)
																		: confPct >=
																			  70
																			? 70 +
																				((j *
																					9) %
																					18)
																			: 35 +
																				((j *
																					7) %
																					20);
																const semanticSimScore =
																	confPct >= 90
																		? 85 +
																			((j *
																				9) %
																				15)
																		: confPct >=
																			  70
																			? 60 +
																				((j *
																					11) %
																					20)
																			: 20 +
																				((j *
																					13) %
																					25);
																const paramBars = [
																	{
																		label: 'Name Similarity',
																		score: nameSimScore,
																		weight: '35%',
																		desc: 'Fuzzy string matching & token comparison',
																	},
																	{
																		label: 'Type Compatibility',
																		score: typeCompatScore,
																		weight: '25%',
																		desc: 'Data type inference & format alignment',
																	},
																	{
																		label: 'Statistical Profile',
																		score: statProfileScore,
																		weight: '20%',
																		desc: 'Value distribution, cardinality & null ratio',
																	},
																	{
																		label: 'Semantic Similarity',
																		score: semanticSimScore,
																		weight: '20%',
																		desc: 'Embedding-based meaning comparison',
																	},
																];
																const justification =
																	confPct >= 90
																		? 'Strong match — field names share common terminology and data patterns are consistent across sample rows.'
																		: confPct >=
																			  70
																			? 'Partial match — field names share some overlap but data patterns show divergence. Review recommended.'
																			: 'Low confidence — name similarity is weak and patterns are inconsistent. Manual selection required.';

																return (
																	<div
																		key={j}
																		className="grid grid-cols-4 gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0 items-center"
																	>
																		{/* Source column */}
																		<div className="flex items-center gap-2">
																			<span className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
																				{
																					shortCode
																				}
																			</span>
																			<span className="text-sm font-medium text-slate-700 truncate">
																				{col}
																			</span>
																		</div>

																		{/* Arrow */}
																		<div className="flex justify-center">
																			<ArrowRight className="size-4 text-slate-300" />
																		</div>

																		{/* Target schema — dropdown */}
																		<div className="relative">
																			<select
																				value={
																					manualColMappings[
																						key
																					] ??
																					(confPct <
																					70
																						? ''
																						: targetName)
																				}
																				onChange={(
																					e,
																				) =>
																					setManualColMappings(
																						(
																							p,
																						) => ({
																							...p,
																							[key]: e
																								.target
																								.value,
																						}),
																					)
																				}
																				className={`w-full appearance-none bg-transparent pr-5 outline-none cursor-pointer font-semibold text-sm leading-tight ${
																					!manualColMappings[
																						key
																					] &&
																					confPct <
																						70
																						? 'text-red-400 italic'
																						: 'text-violet-700'
																				}`}
																			>
																				{confPct <
																					70 &&
																					!manualColMappings[
																						key
																					] && (
																						<option
																							value=""
																							disabled
																						>
																							Select
																							mapping…
																						</option>
																					)}
																				<option
																					value={
																						targetName
																					}
																				>
																					{
																						targetName
																					}
																				</option>
																				{inp.columns
																					?.filter(
																						(
																							c,
																						) =>
																							c !==
																							col,
																					)
																					.map(
																						(
																							c,
																						) => {
																							const optName =
																								c
																									.replace(
																										/_/g,
																										' ',
																									)
																									.replace(
																										/\b\w/g,
																										(
																											ch,
																										) =>
																											ch.toUpperCase(),
																									)
																									.replace(
																										/ /g,
																										'',
																									);
																							return (
																								<option
																									key={
																										c
																									}
																									value={
																										optName
																									}
																								>
																									{
																										optName
																									}
																								</option>
																							);
																						},
																					)}
																			</select>
																			<ChevronDown className="size-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
																			<p className="text-xs text-slate-400 uppercase mt-0.5">
																				{
																					targetType
																				}
																			</p>
																		</div>

																		{/* Confidence + info popover */}
																		<div className="flex items-center justify-end gap-1.5 relative">
																			<span
																				className={`text-xs font-bold ${cd.bg}`}
																			>
																				{
																					cd.label
																				}
																			</span>
																			<button
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																					setOpenJustification(
																						openJustification ===
																							key
																							? null
																							: key,
																					);
																				}}
																				className="flex-shrink-0"
																			>
																				<Info
																					className={`size-3.5 cursor-pointer transition-colors ${openJustification === key ? 'text-violet-600' : 'text-slate-300 hover:text-slate-500'}`}
																				/>
																			</button>

																			{openJustification ===
																				key && (
																				<>
																					<div
																						className="fixed inset-0 z-[99]"
																						onClick={(
																							e,
																						) => {
																							e.stopPropagation();
																							setOpenJustification(
																								null,
																							);
																						}}
																					/>
																					<div
																						className="absolute right-0 top-7 z-[100] w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-4"
																						onClick={(
																							e,
																						) =>
																							e.stopPropagation()
																						}
																					>
																						<div className="flex items-center justify-between mb-3">
																							<div className="flex items-center gap-1.5">
																								<Sparkles className="size-3 text-violet-600" />
																								<p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">
																									AI
																									Justification
																								</p>
																							</div>
																							<button
																								onClick={() =>
																									setOpenJustification(
																										null,
																									)
																								}
																								className="text-slate-400 hover:text-slate-600"
																							>
																								<X className="size-3" />
																							</button>
																						</div>

																						<div className="space-y-3 mb-3">
																							{paramBars.map(
																								(
																									p,
																								) => (
																									<div
																										key={
																											p.label
																										}
																									>
																										<div className="flex items-center justify-between mb-1">
																											<div className="flex items-center gap-1.5">
																												<span className="text-xs font-semibold text-slate-700">
																													{
																														p.label
																													}
																												</span>
																												<span className="text-[9px] text-slate-400">
																													×
																													{
																														p.weight
																													}
																												</span>
																											</div>
																											<span
																												className={`text-xs font-bold ${p.score >= 90 ? 'text-emerald-600' : p.score >= 70 ? 'text-amber-600' : 'text-red-500'}`}
																											>
																												{
																													p.score
																												}

																												%
																											</span>
																										</div>
																										<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
																											<div
																												className={`h-full rounded-full transition-all ${p.score >= 90 ? 'bg-[#6A12CD]' : p.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
																												style={{
																													width: `${p.score}%`,
																												}}
																											/>
																										</div>
																										<p className="text-[9px] text-slate-400 mt-0.5">
																											{
																												p.desc
																											}
																										</p>
																									</div>
																								),
																							)}
																						</div>

																						<div className="pt-3 border-t border-slate-100">
																							<p className="text-[11px] text-slate-500 leading-relaxed mb-2">
																								{
																									justification
																								}
																							</p>
																							<div className="flex items-center gap-2">
																								<span
																									className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cd.bg}`}
																								>
																									Overall:{' '}
																									{
																										confPct
																									}

																									%
																								</span>
																								<span className="text-[10px] text-slate-400">
																									{
																										col
																									}{' '}
																									→{' '}
																									{
																										targetName
																									}
																								</span>
																							</div>
																						</div>
																					</div>
																				</>
																			)}
																		</div>
																	</div>
																);
															},
														)}
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{/* Footer */}
							<div className="px-6 py-4 border-t-2 border-slate-200 bg-white flex-shrink-0">
								<p className="flex items-center gap-2 text-xs text-slate-400 mb-3">
									<AlertTriangle className="size-3.5 text-slate-300" />
									Review each mapping carefully before proceeding
									to final review
								</p>
								<button
									onClick={handleConfirmMapping}
									className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-[#26064A] hover:bg-[#3a0d6e] text-white shadow-sm"
								>
									Confirm &amp; Proceed{' '}
									<ChevronRight className="size-4" />
								</button>
							</div>
						</div>
					)}

					{/* ── Step 3: Data Preview Modal ── */}
					{previewFile && (
						<div
							className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
							onClick={() => setPreviewFile(null)}
						>
							<div
								className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden mx-4"
								onClick={(e) => e.stopPropagation()}
							>
								{/* Header */}
								<div className="px-6 pt-6 pb-5 flex items-center gap-4 border-b border-slate-100 relative">
									<div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
										<FileText size={18} className="text-white" />
									</div>
									<div>
										<h2 className="text-base font-bold text-slate-900 leading-tight">
											{previewFile.schemaName}
										</h2>
										<p className="text-xs text-slate-400 mt-0.5">
											{previewFile.name}
										</p>
									</div>
									<button
										onClick={() => setPreviewFile(null)}
										className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
									>
										<X size={16} />
									</button>
								</div>

								{/* Body — demo table */}
								<div className="flex-1 overflow-auto px-6 py-5">
									<div className="overflow-x-auto rounded-lg border border-slate-100">
										<table className="text-sm w-full">
											<thead>
												<tr>
													<th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 w-12">
														ROW
													</th>
													{[
														'invoice_no',
														'vendor_id',
														'amount',
														'gl_code',
														'invoice_date',
													].map((h) => (
														<th
															key={h}
															className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 whitespace-nowrap"
														>
															{h}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{[
													[
														'INV-001',
														'V-1042',
														'12,450.00',
														'5010',
														'2024-01-05',
													],
													[
														'INV-002',
														'V-2381',
														'8,200.00',
														'5020',
														'2024-01-12',
													],
													[
														'INV-003',
														'V-1042',
														'3,750.50',
														'5010',
														'2024-01-18',
													],
													[
														'INV-004',
														'V-9901',
														'22,000.00',
														'6030',
														'2024-01-22',
													],
													[
														'INV-005',
														'V-3310',
														'5,600.00',
														'5020',
														'2024-01-29',
													],
												].map((row, i) => (
													<tr
														key={i}
														className={
															i < 4
																? 'border-b border-slate-100'
																: ''
														}
													>
														<td className="px-4 py-3 text-xs text-slate-400 font-medium">
															{i + 1}
														</td>
														{row.map((cell, ci) => (
															<td
																key={ci}
																className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
															>
																{cell}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
									<p className="text-xs text-slate-400 mt-3">
										Previewing first 5 entries
									</p>
								</div>

								{/* Footer */}
								<div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-2xl">
									<button
										onClick={() => setPreviewFile(null)}
										className="px-5 py-2 bg-[#26064A] text-white text-sm font-semibold rounded-xl hover:bg-[#3a0d6e] transition-colors"
									>
										Close Preview
									</button>
								</div>
							</div>
						</div>
					)}

					{/* ── Step 4: Review & Execute ── */}
					{workflow && activeStep === 4 && !showOutput && (
						<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
							{/* Header */}
							<div className="px-6 py-5 bg-white border-b-2 border-slate-200 flex items-center justify-between flex-shrink-0">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
										<Play className="size-5 text-violet-700" />
									</div>
									<div>
										<h2 className="text-lg font-bold text-slate-900">
											Review &amp; Execute
										</h2>
										<p className="text-sm text-slate-400 mt-0.5">
											Review the query execution plan and data
											lineage
										</p>
									</div>
								</div>
								<button
									onClick={handleSaveAndRun}
									disabled={isExecuting}
									className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
								>
									{isExecuting ? (
										<>
											<Loader2 className="size-4 animate-spin" />{' '}
											Running…
										</>
									) : (
										<>
											<Play className="size-4" /> Run Workflow
										</>
									)}
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
								{workflow.steps?.map((step, idx) => {
									const sc =
										STEP_COLORS[step.type] ??
										STEP_COLORS.extract;
									const inputNames = (step.dataFiles ?? []).map(
										(df) => {
											const found = workflow.inputs.find(
												(inp) => inp.id === df,
											);
											return found?.name ?? df;
										},
									);
									return (
										<div
											key={step.id}
											className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
										>
											<div className="flex items-start gap-4">
												<div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white bg-[#26064A]">
													{idx + 1}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h4 className="text-base font-bold text-slate-900">
															{step.name}
														</h4>
														<span
															className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${sc.bg} ${sc.text}`}
														>
															{sc.badge}
														</span>
													</div>
													<p className="text-sm text-slate-500 mb-3">
														{step.description}
													</p>
													{inputNames.length > 0 && (
														<div>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
																Data Sources Used
															</p>
															<div className="flex flex-wrap gap-2">
																{inputNames.map(
																	(name) => (
																		<span
																			key={
																				name
																			}
																			className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600"
																		>
																			<Plus className="size-3.5 text-slate-400" />
																			{name}
																		</span>
																	),
																)}
															</div>
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}
								<div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
									<div className="flex items-start gap-4">
										<div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
											<Check className="size-4 text-white" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="text-base font-bold text-slate-900">
													{workflow.output?.title}
												</h4>
												<span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase bg-emerald-100 text-emerald-700">
													OUTPUT
												</span>
											</div>
											<p className="text-sm text-slate-500">
												{workflow.output?.description}
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between px-6 py-2.5 bg-white border-t-2 border-slate-200 flex-shrink-0">
								<span className="text-xs text-slate-400">
									{workflow.steps?.length ?? 0} execution steps
								</span>
								<div className="flex items-center gap-1">
									<button className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 transition-colors">
										<Minus className="size-3.5" />
									</button>
									<span className="text-xs text-slate-500 font-mono w-10 text-center">
										100%
									</span>
									<button className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 transition-colors">
										<Plus className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					)}

					{/* ── Output View ── */}
					{workflow && showOutput && (
						<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
							{/* Tab bar */}
							<div className="flex items-center gap-1 px-4 py-2 border-b-2 border-slate-200 bg-white flex-shrink-0">
								{['editor', 'output', 'analytics', 'manager'].map(
									(tab) => (
										<button
											key={tab}
											onClick={() => {
												if (tab === 'editor') {
													setShowOutput(false);
													setActiveStep(3);
												} else {
													setOutputTab(tab);
												}
											}}
											className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
												(tab === 'editor' && !showOutput) ||
												(tab !== 'editor' &&
													outputTab === tab)
													? 'bg-violet-100 text-violet-700'
													: 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
											}`}
										>
											{tab}
										</button>
									),
								)}
							</div>

							<div className="flex-1 overflow-y-auto p-6 min-h-0">
								{outputTab === 'output' && (
									<div>
										{/* Output header */}
										<div className="flex items-center justify-between mb-6">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
													<Zap className="size-5 text-violet-700" />
												</div>
												<div>
													<h2 className="text-lg font-bold text-slate-900">
														{workflow.name}
													</h2>
													<div className="flex items-center gap-3 mt-0.5">
														<span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
															<CheckCircle2 className="size-3" />{' '}
															RUN SUCCESSFUL
														</span>
														<span className="text-xs text-slate-400">
															RUN ID: RWF-4407-B
														</span>
														<span className="text-xs text-slate-400">
															28,345,840 records
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
													<Download className="size-4" />
												</button>
												<button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-colors">
													<Download className="size-3.5" />{' '}
													Export Report
												</button>
											</div>
										</div>

										{/* KPI cards */}
										<div className="grid grid-cols-4 gap-4 mb-6">
											{[
												{
													label: 'Total Invoices',
													value: '1,129',
													badge: '+13%',
													badgeCls:
														'bg-emerald-50 text-emerald-600',
													valueCls: 'text-slate-900',
												},
												{
													label: 'Critical Flags',
													value: '3',
													badge: '+2',
													badgeCls:
														'bg-rose-50 text-rose-600',
													valueCls: 'text-rose-600',
												},
												{
													label: 'Audit Accuracy',
													value: '99.4%',
													badge: '+8.2%',
													badgeCls:
														'bg-emerald-50 text-emerald-600',
													valueCls: 'text-emerald-600',
												},
												{
													label: 'Potential Savings',
													value: '$42.5k',
													badge: 'New',
													badgeCls:
														'bg-violet-50 text-violet-700',
													valueCls: 'text-slate-900',
												},
											].map(
												({
													label,
													value,
													badge,
													badgeCls,
													valueCls,
												}) => (
													<div
														key={label}
														className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
													>
														<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
															{label}
														</p>
														<div className="flex items-end gap-2">
															<span
																className={`text-2xl font-bold ${valueCls}`}
															>
																{value}
															</span>
															<span
																className={`text-xs font-bold px-1.5 py-0.5 rounded-full mb-0.5 ${badgeCls}`}
															>
																{badge}
															</span>
														</div>
													</div>
												),
											)}
										</div>

										{/* AI Summary */}
										<div className="bg-violet-50/50 border border-violet-100 rounded-xl p-5 mb-6">
											<div className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-full mb-3">
												<Sparkles className="size-3" /> AI
												SUMMARY
											</div>
											<p className="text-sm text-slate-700 leading-relaxed">
												Scanned{' '}
												<strong className="text-violet-700">
													12,450 invoices
												</strong>{' '}
												against 6-month history. Identified{' '}
												<strong className="text-violet-700">
													8 potential duplicates
												</strong>{' '}
												totalling{' '}
												<strong className="text-violet-700">
													₹6.10L at risk
												</strong>
												. Highest confidence match: INV-4521
												vs INV-3102 (Acme Corp, 96% match).{' '}
												<strong className="text-violet-700">
													3 invoices
												</strong>{' '}
												from the same vendor within 48 hours
												flagged as suspicious. False positive
												rate: 4.2% (down from 6.5% last run).
												Recommend immediate review of the 3
												critical-severity flags before next
												payment batch.
											</p>
										</div>

										{/* Key Observations */}
										<div className="mb-6">
											<h3 className="text-base font-bold text-slate-900 mb-4">
												Key Observations &amp; Insights
											</h3>
											<div className="grid grid-cols-2 gap-4">
												{[
													{
														icon: Sparkles,
														iconBg: 'bg-violet-100',
														iconCls: 'text-violet-700',
														title: 'Duplicate Detection',
														badge: 'High Priority',
														badgeCls:
															'bg-rose-50 text-rose-600',
														body: '<strong class="text-violet-700">8 potential duplicates</strong> identified across 3 vendors. Highest confidence pair: INV-4521 vs INV-3102 (Acme Corp) with 96% field similarity.',
													},
													{
														icon: AlertTriangle,
														iconBg: 'bg-amber-100',
														iconCls: 'text-amber-700',
														title: 'MTOW Weight Discrepancies',
														badge: 'Medium Priority',
														badgeCls:
															'bg-amber-50 text-amber-600',
														body: '<strong class="text-violet-700">12 invoices</strong> show MTOW values exceeding the certified maximum by >5%. Average overcharge per invoice: <strong class="text-violet-700">$3,847</strong>.',
													},
													{
														icon: BarChart3,
														iconBg: 'bg-emerald-100',
														iconCls: 'text-emerald-700',
														title: 'Rate Compliance',
														badge: 'On Track',
														badgeCls:
															'bg-emerald-50 text-emerald-600',
														body: '<strong class="text-violet-700">97.3%</strong> of terminal charges align with the YYZ Rate Master. Remaining 2.7% used outdated rate tiers from Q2 2024.',
													},
													{
														icon: Search,
														iconBg: 'bg-blue-100',
														iconCls: 'text-blue-700',
														title: 'Vendor Concentration Risk',
														badge: 'Insight',
														badgeCls:
															'bg-blue-50 text-blue-600',
														body: '<strong class="text-violet-700">68%</strong> of flagged invoices originate from 2 vendors (Acme Corp, GlobalFlight). Targeted vendor auditing may yield higher returns.',
													},
												].map(
													({
														icon: Icon,
														iconBg,
														iconCls,
														title,
														badge,
														badgeCls,
														body,
													}) => (
														<div
															key={title}
															className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
														>
															<div className="flex items-center gap-2 mb-3">
																<div
																	className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}
																>
																	<Icon
																		className={`size-3.5 ${iconCls}`}
																	/>
																</div>
																<p className="text-sm font-bold text-slate-700">
																	{title}
																</p>
															</div>
															<p
																className="text-sm text-slate-600 leading-relaxed mb-2"
																dangerouslySetInnerHTML={{
																	__html: body,
																}}
															/>
															<span
																className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}
															>
																{badge}
															</span>
														</div>
													),
												)}
											</div>
										</div>

										{/* Anomaly & Outlier Report */}
										<div className="mb-6">
											<h3 className="text-base font-bold text-slate-900 mb-4">
												Anomaly &amp; Outlier Report
											</h3>
											<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
												<div className="grid grid-cols-7 gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200">
													{[
														'Invoice ID',
														'Type',
														'Vendor',
														'Expected',
														'Actual',
														'Deviation',
														'Severity',
													].map((h) => (
														<p
															key={h}
															className="text-xs font-bold text-slate-400 uppercase tracking-widest"
														>
															{h}
														</p>
													))}
												</div>
												{ANOMALY_DATA.map((row) => {
													const typeCls =
														row.type === 'Duplicate'
															? 'bg-rose-50 text-rose-600'
															: row.type ===
																  'MTOW Outlier'
																? 'bg-amber-50 text-amber-600'
																: row.type ===
																	  'Rate Mismatch'
																	? 'bg-violet-50 text-violet-600'
																	: 'bg-blue-50 text-blue-600';
													const sevCls =
														row.severity === 'critical'
															? 'text-rose-600'
															: row.severity ===
																  'warning'
																? 'text-amber-600'
																: 'text-blue-600';
													const sevBadge =
														row.severity === 'critical'
															? 'bg-rose-50 text-rose-600'
															: row.severity ===
																  'warning'
																? 'bg-amber-50 text-amber-600'
																: 'bg-blue-50 text-blue-600';
													return (
														<div
															key={row.id}
															className="grid grid-cols-7 gap-2 px-5 py-3 border-b border-slate-100 last:border-0 items-center"
														>
															<span className="text-sm font-medium text-slate-700">
																{row.id}
															</span>
															<span
																className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${typeCls}`}
															>
																{row.type}
															</span>
															<span className="text-sm text-slate-600">
																{row.vendor}
															</span>
															<span className="text-sm text-slate-500">
																{row.expected}
															</span>
															<span className="text-sm font-medium text-slate-800">
																{row.actual}
															</span>
															<span
																className={`text-sm font-semibold ${sevCls}`}
															>
																{row.deviation}
															</span>
															<span
																className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit uppercase ${sevBadge}`}
															>
																{row.severity}
															</span>
														</div>
													);
												})}
											</div>
										</div>

										{/* Suggested Follow-ups */}
										<div className="mb-6">
											<p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
												Suggested Follow-ups
											</p>
											<div className="flex flex-wrap gap-2">
												{[
													'Show me only excess charges above $5,000',
													"Compare with last month's audit",
													'Export flagged items to Jira',
													'Explain the MTOW calculation logic',
												].map((s) => (
													<button
														key={s}
														className="text-sm bg-white border border-slate-200 rounded-full px-4 py-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
													>
														{s}
													</button>
												))}
											</div>
										</div>

										{/* Audit Report charts */}
										<div className="mb-6">
											<h3 className="text-base font-bold text-slate-900 mb-4">
												Audit Report
											</h3>
											<div className="grid grid-cols-2 gap-4">
												{/* Bar chart */}
												<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
													<p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
														Charges by Airline
													</p>
													<div className="flex items-end gap-3 h-40">
														{BAR_CHART_DATA.map((d) => (
															<div
																key={d.airline}
																className="flex-1 flex flex-col items-center gap-1"
															>
																<div
																	className={`w-full rounded-t-md ${d.color}`}
																	style={{
																		height: `${d.value}%`,
																	}}
																/>
																<span className="text-[10px] text-slate-400 text-center leading-tight">
																	{d.airline}
																</span>
															</div>
														))}
													</div>
												</div>
												{/* Donut chart */}
												<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
													<p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
														Flag Distribution
													</p>
													<div className="flex items-center gap-6">
														<div className="relative w-28 h-28 flex-shrink-0">
															<svg
																viewBox="0 0 36 36"
																className="w-full h-full -rotate-90"
															>
																<circle
																	cx="18"
																	cy="18"
																	r="14"
																	fill="none"
																	stroke={
																		DONUT_DATA[0]
																			.stroke
																	}
																	strokeWidth="4"
																	strokeDasharray="28.27 62.83"
																	strokeDashoffset="0"
																/>
																<circle
																	cx="18"
																	cy="18"
																	r="14"
																	fill="none"
																	stroke={
																		DONUT_DATA[1]
																			.stroke
																	}
																	strokeWidth="4"
																	strokeDasharray="15.71 62.83"
																	strokeDashoffset="-28.27"
																/>
																<circle
																	cx="18"
																	cy="18"
																	r="14"
																	fill="none"
																	stroke={
																		DONUT_DATA[2]
																			.stroke
																	}
																	strokeWidth="4"
																	strokeDasharray="18.85 62.83"
																	strokeDashoffset="-43.98"
																/>
															</svg>
														</div>
														<div className="space-y-2">
															{DONUT_DATA.map((d) => (
																<div
																	key={d.label}
																	className="flex items-center gap-2"
																>
																	<div
																		className={`w-3 h-3 rounded-sm ${d.color}`}
																	/>
																	<span className="text-sm text-slate-600">
																		{d.label}
																	</span>
																	<span className="text-sm font-bold text-slate-800 ml-auto">
																		{d.pct}%
																	</span>
																</div>
															))}
														</div>
													</div>
												</div>
											</div>
										</div>

										{/* Full Audit Data table */}
										<div>
											<div className="flex items-center justify-between mb-4">
												<h3 className="text-base font-bold text-slate-900">
													Full Audit Data
												</h3>
												<div className="flex items-center gap-3">
													<div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
														<Search className="size-3.5 text-slate-400" />
														<input
															type="text"
															placeholder="Search invoices…"
															className="text-sm bg-transparent outline-none w-36"
														/>
													</div>
													<button className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors bg-white">
														<Filter className="size-3.5" />{' '}
														Filter
													</button>
													<span className="text-sm text-slate-400">
														Showing 5 of 1,129 records
													</span>
												</div>
											</div>
											<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
												<div className="grid grid-cols-6 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200">
													{[
														'Invoice ID',
														'Date',
														'Vendor',
														'Amount',
														'Status',
														'Reason',
													].map((h) => (
														<p
															key={h}
															className="text-xs font-bold text-slate-400 uppercase tracking-widest"
														>
															{h}
														</p>
													))}
												</div>
												{AUDIT_TABLE_DATA.map((row) => (
													<div
														key={row.id}
														className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-slate-100 last:border-0 items-center"
													>
														<span className="text-sm font-medium text-slate-700">
															{row.id}
														</span>
														<span className="text-sm text-slate-500">
															{row.date}
														</span>
														<span className="text-sm text-slate-700">
															{row.vendor}
														</span>
														<span className="text-sm font-medium text-slate-800">
															{row.amount}
														</span>
														<span
															className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${row.status === 'FLAGGED' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
														>
															{row.status}
														</span>
														<span className="text-sm text-slate-500">
															{row.reason}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								)}

								{outputTab !== 'output' && (
									<div className="flex flex-col items-center justify-center h-60 gap-3 text-center">
										<Sparkles className="size-10 text-slate-200" />
										<p className="text-base font-semibold text-slate-400 capitalize">
											{outputTab} view coming soon
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</main>

				{/* ══════════════════════════════════════════════════════════
			    RIGHT PANEL — Config (collapsible, ~22% when open)
			══════════════════════════════════════════════════════════ */}
				<aside
					className={`flex-shrink-0 flex flex-col bg-white border-l-2 border-slate-200 transition-all duration-300 ${rightOpen ? 'w-[20%]' : 'w-12'}`}
				>
					{/* ── Collapsed: icon strip ── */}
					{!rightOpen && (
						<div className="flex flex-col items-center pt-3 gap-1">
							{RIGHT_ICONS.map(({ key, icon: Icon, title }) => (
								<button
									key={key}
									title={title}
									onClick={() => {
										setRightTab(key);
										setRightOpen(true);
									}}
									className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
										rightTab === key
											? 'bg-violet-100 text-violet-700'
											: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
									}`}
								>
									<Icon className="size-4" />
								</button>
							))}
							<div className="w-6 h-px bg-slate-200 my-2" />
							<button
								title="Expand panel"
								onClick={() => setRightOpen(true)}
								className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
							>
								<PanelRightClose className="size-4 rotate-180" />
							</button>
						</div>
					)}

					{/* ── Expanded: full panel ── */}
					{rightOpen && (
						<>
							{/* Tabs row */}
							<div className="border-b-2 border-slate-200 flex-shrink-0">
								<div className="flex items-center px-2 pt-2 gap-0.5">
									{[
										{ key: 'plan', label: 'Plan' },
										{ key: 'input', label: 'Input Config' },
										{ key: 'output', label: 'Output Config' },
									].map((tab) => (
										<button
											key={tab.key}
											onClick={() => setRightTab(tab.key)}
											className={`flex-1 text-xs font-semibold px-2 py-2.5 rounded-t-lg transition-all whitespace-nowrap ${
												rightTab === tab.key
													? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/60'
													: 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
											}`}
										>
											{tab.label}
										</button>
									))}
									<button
										onClick={() => setRightOpen(false)}
										title="Collapse panel"
										className="ml-1 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
									>
										<PanelRightClose className="size-4" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3 bg-[#FBFBFD]">
								{!workflow && rightTab !== 'plan' && (
									<div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
										<Settings2 className="size-8 text-slate-300" />
										<p className="text-sm text-slate-400 leading-relaxed">
											Config will appear once the workflow is
											generated.
										</p>
									</div>
								)}

								{/* Plan — Query Execution Plan */}
								{rightTab === 'plan' && workflow && (
									<div className="space-y-4 flex flex-col">
										<div className="flex items-center gap-2 px-1">
											<Sparkles className="size-4 text-violet-600" />
											<span className="text-sm font-semibold text-slate-800">
												Query Execution Plan
											</span>
										</div>
										<div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
											<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
												Execution Steps
											</p>
											<div>
												{workflow.steps?.map((step, idx) => {
													const isLast =
														idx ===
															(workflow.steps
																?.length ?? 0) -
																1 &&
														!workflow.output;
													return (
														<div
															key={step.id}
															className="flex items-start gap-3"
														>
															<div className="flex flex-col items-center flex-shrink-0 w-7">
																<div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0">
																	{idx + 1}
																</div>
																{!isLast && (
																	<div className="w-px flex-1 min-h-[16px] bg-slate-200 my-1" />
																)}
															</div>
															<div className="pb-3 min-w-0 pt-0.5">
																<p className="text-xs font-semibold text-slate-800 leading-snug">
																	{step.name}
																</p>
																<p className="text-xs text-slate-400 leading-relaxed mt-0.5">
																	{
																		step.description
																	}
																</p>
															</div>
														</div>
													);
												})}
												{/* Output step */}
												{workflow.output && (
													<div className="flex items-start gap-3">
														<div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
															<Check
																className="size-3 text-emerald-600"
																strokeWidth={3}
															/>
														</div>
														<div className="min-w-0 pb-1 pt-0.5">
															<p className="text-xs font-semibold text-slate-800 leading-snug">
																{
																	workflow.output
																		.title
																}
															</p>
															<p className="text-xs text-slate-400 mt-0.5 uppercase font-bold tracking-wide">
																{
																	workflow.output
																		.type
																}{' '}
																output
															</p>
														</div>
													</div>
												)}
											</div>
											<div className="pt-3 mt-1 border-t border-slate-100 flex justify-end">
												<button
													onClick={() =>
														setShowPlanModal(true)
													}
													className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
												>
													View Details
												</button>
											</div>
										</div>
									</div>
								)}
								{rightTab === 'plan' && !workflow && (
									<div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
										<ListChecks className="size-8 text-slate-300" />
										<p className="text-sm text-slate-400 leading-relaxed">
											Execution plan will appear once the
											workflow is generated.
										</p>
									</div>
								)}

								{/* Inputs */}
								{rightTab === 'input' && workflow && (
									<div className="space-y-3">
										<div className="flex items-center gap-2 px-1">
											<FileInput className="size-4 text-violet-600" />
											<span className="text-sm font-semibold text-slate-800">
												Inputs{' '}
												<span className="text-slate-400 font-normal">
													({workflow.inputs?.length})
												</span>
											</span>
										</div>
										{workflow.inputs?.map((inp) => (
											<div
												key={inp.id}
												className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
											>
												<div className="flex items-center gap-2 mb-1.5">
													<span
														className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${FILE_TYPE_BADGE[inp.type] ?? 'bg-slate-100 text-slate-600 border-slate-200'} border`}
													>
														{inp.type}
													</span>
													{inp.required && (
														<span className="text-xs text-amber-600 font-bold">
															Required
														</span>
													)}
												</div>
												<p className="text-base font-semibold text-slate-800">
													{inp.name}
												</p>
												<p className="text-sm text-slate-400 mt-1 leading-relaxed">
													{inp.description}
												</p>
											</div>
										))}
									</div>
								)}

								{/* Output Config */}
								{rightTab === 'output' && workflow && (
									<div className="space-y-5">
										<div className="flex items-center gap-2 px-1">
											<FileOutput className="size-4 text-violet-600" />
											<span className="text-sm font-semibold text-slate-800">
												Output Configuration
											</span>
										</div>

										{/* Output Layout */}
										<div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
											<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
												Output Layout
											</p>
											<div className="flex gap-2">
												{[
													{ key: 'table', label: 'Table' },
													{
														key: 'dashboard',
														label: 'Dashboard',
													},
													{
														key: 'split',
														label: 'Split View',
													},
												].map(({ key, label }) => {
													const selected =
														outputLayout === key;
													return (
														<button
															key={key}
															onClick={() =>
																setOutputLayout(key)
															}
															className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all text-xs font-semibold ${
																selected
																	? 'border-violet-400 bg-violet-50 text-violet-700 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]'
																	: 'border-slate-200 bg-slate-50/60 text-slate-400 hover:border-violet-200 hover:text-violet-500 hover:bg-violet-50/40'
															}`}
														>
															{selected && (
																<CheckCircle2 className="size-3 flex-shrink-0 text-violet-500" />
															)}
															{label}
														</button>
													);
												})}
											</div>
										</div>

										{/* Dashboard KPIs */}
										<div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
											<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
												Dashboard KPIs
											</p>
											<div className="space-y-3">
												{[
													{
														key: 'total',
														label: 'Total Records Scanned',
													},
													{
														key: 'duplicates',
														label: 'Duplicates Found',
													},
													{
														key: 'amount',
														label: 'Amount at Risk',
													},
													{
														key: 'comparison',
														label: 'Comparison vs Last Run',
														badge: 'DELTA',
													},
													{
														key: 'trend',
														label: 'Duplicate Trend (30 days)',
													},
												].map(({ key, label, badge }) => (
													<label
														key={key}
														className="flex items-center gap-2.5 cursor-pointer group"
													>
														<div
															onClick={() =>
																setKpiChecks(
																	(p) => ({
																		...p,
																		[key]: !p[
																			key
																		],
																	}),
																)
															}
															className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
																kpiChecks[key]
																	? 'bg-violet-600 border-violet-600'
																	: 'border-slate-300 bg-white group-hover:border-violet-400'
															}`}
														>
															{kpiChecks[key] && (
																<Check
																	className="size-2.5 text-white"
																	strokeWidth={3}
																/>
															)}
														</div>
														<span
															className={`text-sm flex-1 ${kpiChecks[key] ? 'text-slate-700 font-medium' : 'text-slate-400'}`}
														>
															{label}
														</span>
														{badge && (
															<span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 border border-amber-200">
																{badge}
															</span>
														)}
													</label>
												))}
											</div>
										</div>

										{/* AI Suggestions */}
										<div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
											<div className="flex items-center gap-2 mb-3">
												<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
													AI Suggestions
												</p>
												<span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
													SMART
												</span>
											</div>
											<div className="space-y-3">
												{[
													{
														key: 'trend_col',
														label: 'Add "Trend vs Previous Run" column to track changes between executions',
													},
													{
														key: 'variance',
														label: 'Enable variance highlighting when amount difference exceeds tolerance',
													},
													{
														key: 'resolution',
														label: 'Include "Time to Resolution" metric for flagged items',
													},
													{
														key: 'autogroup',
														label: 'Auto-group results by vendor for easier review',
													},
												].map(({ key, label }) => (
													<label
														key={key}
														className="flex items-start gap-2.5 cursor-pointer group"
													>
														<div
															onClick={() =>
																setSuggChecks(
																	(p) => ({
																		...p,
																		[key]: !p[
																			key
																		],
																	}),
																)
															}
															className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
																suggChecks[key]
																	? 'bg-violet-600 border-violet-600'
																	: 'border-slate-300 bg-white group-hover:border-violet-400'
															}`}
														>
															{suggChecks[key] && (
																<Check
																	className="size-2.5 text-white"
																	strokeWidth={3}
																/>
															)}
														</div>
														<span
															className={`text-sm leading-relaxed ${suggChecks[key] ? 'text-slate-700' : 'text-slate-400'}`}
														>
															{label}
														</span>
													</label>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</aside>
			</div>

			{/* ── View Details Modal ── */}
			{showPlanModal && workflow && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => {
							setShowPlanModal(false);
							setIsEditingPlan(false);
						}}
					/>
					<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
							<div className="flex items-center gap-2">
								<Sparkles className="size-4 text-violet-600" />
								<h2 className="text-base font-semibold text-slate-900">
									Step-by-Step Explanation of the Workflow
								</h2>
							</div>
							<div className="flex items-center gap-2">
								{!isEditingPlan ? (
									<button
										onClick={() => {
											setEditableSteps(
												(workflow.steps ?? []).map((s) => ({
													...s,
												})),
											);
											setIsEditingPlan(true);
										}}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors"
									>
										<Pencil className="size-3.5" />
										Edit
									</button>
								) : (
									<>
										<button
											onClick={() => setIsEditingPlan(false)}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
										>
											Cancel
										</button>
										<button
											onClick={() => {
												setWorkflow((prev) => ({
													...prev,
													steps: editableSteps,
												}));
												setIsEditingPlan(false);
											}}
											className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
										>
											<Check className="size-3.5" />
											Save
										</button>
									</>
								)}
								<button
									onClick={() => {
										setShowPlanModal(false);
										setIsEditingPlan(false);
									}}
									className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
								>
									<X className="size-4" />
								</button>
							</div>
						</div>
						{/* Body */}
						<div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
							{isEditingPlan ? (
								editableSteps.map((step, idx) => (
									<div
										key={step.id}
										className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
									>
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
											Step {idx + 1}
										</p>
										<div>
											<label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
												Name
											</label>
											<input
												type="text"
												value={step.name}
												onChange={(e) =>
													setEditableSteps((prev) =>
														prev.map((s, i) =>
															i === idx
																? {
																		...s,
																		name: e
																			.target
																			.value,
																	}
																: s,
														),
													)
												}
												className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
											/>
										</div>
										<div>
											<label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
												Description
											</label>
											<textarea
												value={step.description}
												rows={3}
												onChange={(e) =>
													setEditableSteps((prev) =>
														prev.map((s, i) =>
															i === idx
																? {
																		...s,
																		description:
																			e.target
																				.value,
																	}
																: s,
														),
													)
												}
												className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all leading-relaxed"
											/>
										</div>
									</div>
								))
							) : (
								<>
									{workflow.steps?.map((step, idx) => (
										<div key={step.id}>
											<p className="text-sm text-slate-800 leading-relaxed">
												<span className="font-bold">
													Step {idx + 1}:
												</span>{' '}
												{step.name} — {step.description}
											</p>
										</div>
									))}
									{workflow.output && (
										<div>
											<p className="text-sm text-slate-800 leading-relaxed">
												<span className="font-bold">
													Final Output:
												</span>{' '}
												{workflow.output.title} — The
												workflow produces a{' '}
												{workflow.output.type} output
												containing the processed results
												ready for review or further analysis.
											</p>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}

			<GuidedPromptModal
				isOpen={guidedOpen}
				onClose={() => setGuidedOpen(false)}
				onInsert={(generatedPrompt) => {
					if (guidedTarget === 'builder') {
						setChatInput(generatedPrompt);
					} else {
						setPrompt(generatedPrompt);
					}
					setGuidedOpen(false);
				}}
			/>
		</>
	);
}
