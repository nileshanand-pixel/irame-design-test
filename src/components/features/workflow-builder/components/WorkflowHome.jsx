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
	ArrowLeft,
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
	SlidersHorizontal,
	BookOpenText,
	Lightbulb,
	GitCompareArrows,
	Grip,
	ToggleLeft,
	ToggleRight,
	CircleDot,
	Hash,
	CalendarRange,
	ArrowRightLeft,
	Save,
	MessageSquare,
	Target,
	Waypoints,
	Mail,
	Globe,
	FileSpreadsheet,
	DollarSign,
	Calendar,
	Type,
	Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateWorkflow } from '../lib/mock-api';
import { getWorkflows, saveWorkflow, deleteWorkflow } from '../lib/storage';
import GuidedPromptModal from './GuidedPromptModal';
import WorkflowAnalytics from './WorkflowAnalytics';
import WorkflowManager from './WorkflowManager';
import DataMappingPanel from './DataMappingPanel';
import RACMSection from './RACMSection';
import { useDataSources } from '@/hooks/useDataSources';
import ira from '@/assets/icons/ira_icon.svg';

const VSTEPS = [
	{ num: 1, label: 'Write Prompt', icon: Pencil },
	{ num: 2, label: 'Upload Files', icon: Upload },
	{ num: 3, label: 'Map Data', icon: Link2 },
	{ num: 4, label: 'Review & Run', icon: Play },
];

const HSTEPS = [
	{ label: 'Describe' },
	{ label: 'Upload' },
	{ label: 'Map' },
	{ label: 'Review' },
];

const COLUMN_ROLE_STYLES = {
	join_key: {
		label: 'JOIN KEY',
		bg: 'bg-blue-50',
		text: 'text-blue-700',
		border: 'border-blue-200',
	},
	compare: {
		label: 'COMPARE',
		bg: 'bg-amber-50',
		text: 'text-amber-700',
		border: 'border-amber-200',
	},
	filter: {
		label: 'FILTER',
		bg: 'bg-rose-50',
		text: 'text-rose-700',
		border: 'border-rose-200',
	},
	output: {
		label: 'OUTPUT',
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		border: 'border-emerald-200',
	},
};

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

// ── Chat context definitions for contextual quick-actions ──
// Each key maps to { icon, label, subtitle, actions[] }
// "step:<type>" for workflow step types, "panel:<section>" for right-panel sections
const CHAT_CONTEXT_DEFS = {
	// Workflow step types (canvas — Step 4)
	'step:extract': {
		icon: FileInput,
		label: 'Data Ingestion',
		actions: [
			'Check data quality',
			'Preview schema',
			'Explain extraction logic',
		],
	},
	'step:compare': {
		icon: GitCompareArrows,
		label: 'Comparison',
		actions: [
			'Suggest better thresholds',
			'Find edge cases',
			'Explain matching logic',
		],
	},
	'step:analyze': {
		icon: BarChart3,
		label: 'Analysis',
		actions: [
			'Explain analysis method',
			'Suggest improvements',
			'Show sample output',
		],
	},
	'step:flag': {
		icon: AlertTriangle,
		label: 'Flagging',
		actions: [
			'Suggest better thresholds',
			'Find edge cases',
			'Explain fuzzy logic',
		],
	},
	'step:validate': {
		icon: ShieldCheck,
		label: 'Validation',
		actions: [
			'Check rule coverage',
			'Suggest missing rules',
			'Explain criteria',
		],
	},
	'step:summarize': {
		icon: FileOutput,
		label: 'Summary',
		actions: [
			'Customize report format',
			'Add KPI breakdown',
			'Explain risk scoring',
		],
	},
	'step:calculate': {
		icon: Hash,
		label: 'Calculation',
		actions: [
			'Verify formula',
			'Show sample calculation',
			'Explain methodology',
		],
	},
	// Right panel sections
	'panel:schema': {
		icon: Link2,
		label: 'Data Mapping',
		actions: [
			'Fix low-confidence columns',
			'Suggest column mappings',
			'Explain mapping logic',
		],
	},
	'panel:columns': {
		icon: Waypoints,
		label: 'Column Alignment',
		actions: [
			'Fix type mismatches',
			'Auto-map remaining columns',
			'Explain confidence scores',
		],
	},
	'panel:mapped_sources': {
		icon: FileInput,
		label: 'Mapped Sources',
		actions: [
			'Check file compatibility',
			'Suggest better files',
			'Preview union data',
		],
	},
	'panel:datasets': {
		icon: Table2,
		label: 'Datasets',
		actions: [
			'Check file compatibility',
			'Suggest missing columns',
			'Preview data',
		],
	},
	'panel:notes': {
		icon: BookOpenText,
		label: 'Notes & References',
		actions: [
			'Suggest more references',
			'Explain note impact',
			'Auto-tag notes',
		],
	},
	'panel:tolerance': {
		icon: SlidersHorizontal,
		label: 'Tolerance Settings',
		actions: [
			'Recommend threshold',
			'Show impact preview',
			'Explain trade-offs',
		],
	},
	'panel:logic': {
		icon: GitCompareArrows,
		label: 'Matching Rules',
		actions: [
			'Suggest better thresholds',
			'Find edge cases',
			'Explain fuzzy logic',
		],
	},
	'panel:kpis': {
		icon: LayoutDashboard,
		label: 'Dashboard KPIs',
		actions: [
			'Suggest more KPIs',
			'Explain each metric',
			'Best practice layout',
		],
	},
	'panel:suggestions': {
		icon: Lightbulb,
		label: 'AI Suggestions',
		actions: [
			'Explain suggestions',
			'Add custom suggestion',
			'Show prediction basis',
		],
	},
	'panel:output_layout': {
		icon: LayoutGrid,
		label: 'Output Layout',
		actions: [
			'Compare layout options',
			'Suggest best format',
			'Customize sections',
		],
	},
	'panel:delivery': {
		icon: Send,
		label: 'Delivery & Routing',
		actions: [
			'Add delivery channel',
			'Configure recipients',
			'Explain routing logic',
		],
	},
};

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

export default function WorkflowHome({ onRun, onSaveDraftChange }) {
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
	const [selectedDsSources, setSelectedDsSources] = useState([]);
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
	const [chatCollapsed, setChatCollapsed] = useState(true); // chat panel collapsed in output mode
	const [clarifyOptions, setClarifyOptions] = useState(null); // string[] | null
	const [clarifyQuestion, setClarifyQuestion] = useState(''); // question text
	const clarifyResolveRef = useRef(null);
	const [clarifyTyping, setClarifyTyping] = useState(false);
	const [clarifyCustomInput, setClarifyCustomInput] = useState('');
	const [clarifyStepIdx, setClarifyStepIdx] = useState(null); // which execution step triggered it
	const [expandedColumns, setExpandedColumns] = useState({}); // tracks expanded column panels per step+source
	const clarifyInputRef = useRef(null);
	const [clarifyQueue, setClarifyQueue] = useState([]); // array of { question, options, stepIdx }
	const [clarifyQueueIdx, setClarifyQueueIdx] = useState(0); // current index in queue

	// Output Config
	const [outputLayout, setOutputLayout] = useState('dashboard');
	const [kpiChecks, setKpiChecks] = useState({
		total: true,
		duplicates: true,
		amount: true,
		comparison: false,
		trend: false,
	});
	const [deliveryChannels, setDeliveryChannels] = useState({
		email: { enabled: true, to: '', frequency: 'critical' },
		slack: { enabled: true, to: '', frequency: 'every' },
		erp: { enabled: false, to: '', frequency: 'every' },
		webhook: { enabled: false, to: '', frequency: 'every' },
		csv: { enabled: false, to: '', frequency: 'every' },
	});
	const [expandedChannel, setExpandedChannel] = useState('email');

	// Input Config
	const [expandedInputs, setExpandedInputs] = useState({});
	// Tolerance rules — multi-parameter
	const [toleranceRules, setToleranceRules] = useState({
		amt: {
			val: 5,
			absVal: 500,
			enabled: false,
			expanded: false,
			mode: 'percentage',
			columns: {
				src: 'Invoice Amount',
				srcFile: 'AP Invoice Register',
				srcDot: 'f1',
				tgt: 'GL Amount',
				tgtFile: 'GL Trial Balance',
				tgtDot: 'f2',
			},
		},
		date: {
			val: 3,
			enabled: false,
			expanded: false,
			dayType: 'calendar',
			columns: {
				src: 'Invoice Date',
				srcFile: 'AP Invoice Register',
				srcDot: 'f1',
				tgt: 'Posting Date',
				tgtFile: 'GL Trial Balance',
				tgtDot: 'f2',
			},
		},
		text: {
			val: 80,
			enabled: false,
			expanded: false,
			normalize: {
				ignoreCase: true,
				trimSpaces: true,
				stripSpecial: false,
				removePrefixes: false,
			},
			columns: {
				src: 'Vendor Name',
				srcFile: 'AP Invoice Register',
				srcDot: 'f1',
				tgt: 'GL Description',
				tgtFile: 'GL Trial Balance',
				tgtDot: 'f2',
			},
		},
		qty: {
			val: 2,
			unitVal: 10,
			enabled: false,
			expanded: false,
			mode: 'percentage',
			compare: {
				ordered: true,
				received: true,
				invoiced: false,
				shipped: false,
			},
			columns: {
				src: 'Ordered Qty',
				srcFile: 'Purchase Orders',
				srcDot: 'f3',
				tgt: 'Received Qty',
				tgtFile: 'AP Invoice Register',
				tgtDot: 'f1',
			},
		},
	});
	const toleranceSeverity = (rule, v) => {
		if (rule === 'amt')
			return v <= 2 ? 'strict' : v <= 7 ? 'moderate' : 'relaxed';
		if (rule === 'date')
			return v <= 1 ? 'strict' : v <= 4 ? 'moderate' : 'relaxed';
		if (rule === 'text')
			return v >= 90 ? 'strict' : v >= 70 ? 'moderate' : 'relaxed';
		if (rule === 'qty')
			return v <= 1 ? 'strict' : v <= 3 ? 'moderate' : 'relaxed';
		return 'moderate';
	};
	const updateTolRule = (rule, updates) =>
		setToleranceRules((prev) => ({
			...prev,
			[rule]: { ...prev[rule], ...updates },
		}));

	// Which built-in tolerance rules are visible (qty hidden by default, available via picker)
	const [visibleBuiltins, setVisibleBuiltins] = useState(['amt', 'date', 'text']);
	// Custom tolerance rules added via picker/builder
	const [customTolRules, setCustomTolRules] = useState([]);
	const toleranceActiveCount =
		Object.values(toleranceRules).filter((r) => r.enabled).length +
		customTolRules.filter((r) => r.enabled).length;
	// Tolerance picker state
	// RACM state — initialized from workflow.racm when workflow is set
	const [racmData, setRacmData] = useState(null);

	const [tolPickerOpen, setTolPickerOpen] = useState(false);
	const [tolPickerSearch, setTolPickerSearch] = useState('');
	// Custom builder state
	const [tolBuilderOpen, setTolBuilderOpen] = useState(false);
	const [tolBuilderStep, setTolBuilderStep] = useState(1);
	const [tolBuilderData, setTolBuilderData] = useState({
		type: null,
		srcCol: null,
		srcFile: null,
		srcDot: null,
		tgtCol: null,
		tgtFile: null,
		tgtDot: null,
		threshold: null,
		name: '',
	});
	const tolPickerRef = useRef(null);
	const tolSearchRef = useRef(null);

	const tolColumnsByType = {
		numeric: {
			src1: {
				file: 'AP Invoice Register',
				dot: 'f1',
				cols: ['Invoice Amount', 'Tax Amount', 'Net Amount'],
			},
			src2: {
				file: 'Purchase Orders',
				dot: 'f3',
				cols: ['PO Amount', 'Line Total'],
			},
			tgt1: {
				file: 'GL Trial Balance',
				dot: 'f2',
				cols: ['GL Amount', 'Debit', 'Credit'],
			},
		},
		date: {
			src1: {
				file: 'AP Invoice Register',
				dot: 'f1',
				cols: ['Invoice Date', 'Due Date', 'Created At'],
			},
			src2: {
				file: 'Purchase Orders',
				dot: 'f3',
				cols: ['PO Date', 'Delivery Date'],
			},
			tgt1: {
				file: 'GL Trial Balance',
				dot: 'f2',
				cols: ['Posting Date', 'Period End'],
			},
		},
		text: {
			src1: {
				file: 'AP Invoice Register',
				dot: 'f1',
				cols: ['Vendor Name', 'Description', 'Invoice Number'],
			},
			src2: {
				file: 'Purchase Orders',
				dot: 'f3',
				cols: ['Supplier Name', 'PO Number'],
			},
			tgt1: {
				file: 'GL Trial Balance',
				dot: 'f2',
				cols: ['GL Description', 'Account Name'],
			},
		},
		exact: {
			src1: {
				file: 'AP Invoice Register',
				dot: 'f1',
				cols: ['Currency Code', 'Cost Center', 'Vendor ID'],
			},
			src2: {
				file: 'Purchase Orders',
				dot: 'f3',
				cols: ['PO Currency', 'Department'],
			},
			tgt1: {
				file: 'GL Trial Balance',
				dot: 'f2',
				cols: ['GL Currency', 'GL Cost Center'],
			},
		},
	};

	const tolPresets = [
		{
			id: 'qty-builtin',
			name: 'Quantity',
			icon: '\u2693',
			desc: 'Unit count variance (PO vs GRN vs Invoice)',
			cls: 'qty',
			builtin: 'qty',
			columns: {
				src: 'Ordered Qty',
				srcFile: 'Purchase Orders',
				srcDot: 'f3',
				tgt: 'Received Qty',
				tgtFile: 'AP Invoice Register',
				tgtDot: 'f1',
			},
			type: 'numeric',
			threshold: '±2%',
			val: 2,
		},
		{
			id: 'fx',
			name: 'Currency / FX',
			icon: 'FX',
			desc: 'Exchange rate variance',
			cls: 'fx',
			tag: 'Rec',
			tagType: 'rec',
			columns: {
				src: 'Invoice Currency',
				srcFile: 'AP Invoice Register',
				srcDot: 'f1',
				tgt: 'GL Currency',
				tgtFile: 'GL Trial Balance',
				tgtDot: 'f2',
			},
			type: 'numeric',
			threshold: '±0.5%',
			val: 0.5,
		},
		{
			id: 'round',
			name: 'Rounding',
			icon: '\u00a2',
			desc: 'Penny differences',
			cls: 'round',
			columns: {
				src: 'Invoice Amount',
				srcFile: 'AP Invoice Register',
				srcDot: 'f1',
				tgt: 'GL Amount',
				tgtFile: 'GL Trial Balance',
				tgtDot: 'f2',
			},
			type: 'numeric',
			threshold: '±$1.00',
			val: 1,
		},
		{
			id: 'agg',
			name: 'Aggregate cap',
			icon: '\u03a3',
			desc: 'Cumulative variance limit',
			cls: 'agg',
			tag: 'ISA',
			tagType: 'isa',
			columns: null,
			type: 'numeric',
			threshold: '$50K total',
			val: 50,
		},
	];

	const dotColors = { f1: '#6A12CD', f2: '#185FA5', f3: '#0F6E56' };
	const tolTypeIcons = { numeric: '123', date: null, text: 'Aa', exact: '==' };
	const tolTypeStyles = {
		qty: { bg: '#FAEEDA', color: '#854F0B' },
		fx: { bg: '#FCE4EC', color: '#C62828' },
		round: { bg: '#E8EAF6', color: '#283593' },
		agg: { bg: '#FFF3E0', color: '#E65100' },
		custom: { bg: '#F5F0FF', color: '#6A12CD' },
	};
	const [inputNotes, setInputNotes] = useState([
		{
			id: 'n1',
			name: 'Rate Card Reference',
			type: 'skill',
			description: 'Standard rate card with approved vendor pricing tiers',
			aiSuggested: true,
		},
		{
			id: 'n2',
			name: 'Audit Policy Guide',
			type: 'policy',
			description: 'Internal audit thresholds and escalation criteria',
			aiSuggested: true,
		},
	]);
	const [enabledNotes, setEnabledNotes] = useState({ n1: true, n2: false });
	const [addingNote, setAddingNote] = useState(false);
	const [newNoteName, setNewNoteName] = useState('');
	const [newNoteDesc, setNewNoteDesc] = useState('');
	const [aiSuggestions, setAiSuggestions] = useState([
		'Historical benchmark data for trend comparison',
		'Approval matrix for authority validation',
	]);
	const addNoteInputRef = useRef(null);
	const [matchLogicRules, setMatchLogicRules] = useState([
		{ id: 'ml1', field: 'invoice_no', matchType: 'exact', enabled: true },
		{ id: 'ml2', field: 'amount', matchType: 'tolerance', enabled: true },
		{ id: 'ml3', field: 'vendor_name', matchType: 'fuzzy', enabled: true },
		{ id: 'ml4', field: 'date', matchType: 'range', enabled: false },
	]);
	const [openInputSections, setOpenInputSections] = useState({
		notes: true,
		tolerance: true,
	});

	// Chat context — tracks what the user selected on canvas/right panel
	// Shape: { key: 'step:flag' | 'panel:logic' | …, stepIdx?: number, stepName?: string, subtitle?: string } | null
	const [chatContext, setChatContext] = useState(null);

	// Guided prompt modal
	const [guidedOpen, setGuidedOpen] = useState(false);
	const [guidedTarget, setGuidedTarget] = useState('landing'); // 'landing' | 'builder'

	// Required files expand/collapse
	const [isRequiredFilesExpanded, setIsRequiredFilesExpanded] = useState(false);

	// Data source search
	const [dsSearch, setDsSearch] = useState('');
	const [debouncedDsSearch, setDebouncedDsSearch] = useState('');

	// Plus-menu & Choose Existing modal
	const [plusMenuOpen, setPlusMenuOpen] = useState(null); // 'landing' | 'builder' | null
	const [chooseExistingOpen, setChooseExistingOpen] = useState(false);
	const [chooseExistingSearch, setChooseExistingSearch] = useState('');
	const [debouncedChooseSearch, setDebouncedChooseSearch] = useState('');

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

	// Debounce choose-existing modal search
	useEffect(() => {
		const timer = setTimeout(
			() => setDebouncedChooseSearch(chooseExistingSearch),
			300,
		);
		return () => clearTimeout(timer);
	}, [chooseExistingSearch]);

	// Close plus menu on outside click
	useEffect(() => {
		if (!plusMenuOpen) return;
		const handleClick = () => setPlusMenuOpen(null);
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}, [plusMenuOpen]);

	// Auto-switch right panel tab based on active step & clear chat context
	useEffect(() => {
		setChatContext(null);
		if (activeStep === 3) {
			setRightTab('input');
			setRightOpen(true);
		} else if (activeStep === 4) {
			setRightTab('output');
			setRightOpen(true);
		}
	}, [activeStep]);

	const closeSidebar = () =>
		dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]));

	const addMsg = (role, content) =>
		setMessages((prev) => [...prev, { role, content }]);

	const refresh = () => setWorkflows(getWorkflows());

	// Expose save-draft capability to parent (page-level button)
	useEffect(() => {
		if (!onSaveDraftChange) return;
		if (!workflow) {
			onSaveDraftChange(null);
			return;
		}
		onSaveDraftChange(() => {
			const wfs = getWorkflows();
			const idx = wfs.findIndex((w) => w.id === workflow.id);
			const draft = {
				...workflow,
				uploadedFiles,
				selectedDsSources,
				manualColMappings,
				status: 'draft',
				savedAt: Date.now(),
			};
			if (idx !== -1) {
				wfs[idx] = draft;
			} else {
				wfs.push(draft);
			}
			localStorage.setItem('irame_workflows', JSON.stringify(wfs));
		});
	}, [
		workflow,
		uploadedFiles,
		selectedDsSources,
		manualColMappings,
		onSaveDraftChange,
	]);

	// Data sources for "Select from existing" section (step 2 inline)
	const {
		dataSources,
		isLoading: dsLoading,
		Sentinel: DsSentinel,
	} = useDataSources({
		enabled: activeStep === 2,
		search: debouncedDsSearch || undefined,
	});

	// Data sources for the Choose Existing modal (from + menu)
	const {
		dataSources: modalDataSources,
		isLoading: modalDsLoading,
		Sentinel: ModalDsSentinel,
		isFetchingNextPage: modalFetchingNext,
	} = useDataSources({
		enabled: chooseExistingOpen,
		search: debouncedChooseSearch || undefined,
	});
	const modalFilteredDs = (modalDataSources || []).sort((a, b) => {
		if (a.status === 'active' && b.status !== 'active') return -1;
		if (a.status !== 'active' && b.status === 'active') return 1;
		return 0;
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
		setRacmData(null);
		setActiveStep(1);
		setUploadedFiles([]);
		setSelectedDsSources([]);
		setExpandedSchemas({});
		setManualColMappings({});
		setShowOutput(false);
		setClarifyOptions(null);
		try {
			const { workflow: wf, message } = await generateWorkflow([
				{ role: 'user', content: text },
			]);
			setWorkflow(wf);
			setRacmData(wf.racm || null);
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
			setRacmData(wf.racm || null);
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
			size: f.size,
			inputId: null,
		}));
		setUploadedFiles((prev) => [...prev, ...files]);
		addMsg('user', `Uploaded ${files.length} file(s)`);
	};

	const removeUploadedFile = (index) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const removeSelectedDs = (datasourceId) => {
		setSelectedDsSources((prev) =>
			prev.filter((s) => s.datasource_id !== datasourceId),
		);
	};

	const formatFileSize = (bytes) => {
		if (!bytes) return '';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
			size: f.size,
			inputId: null,
		}));
		setUploadedFiles((prev) => [...prev, ...files]);
		addMsg('user', `Uploaded ${files.length} file(s)`);
	};

	const toggleDsSource = (ds) => {
		setSelectedDsSources((prev) => {
			const exists = prev.some((s) => s.datasource_id === ds.datasource_id);
			if (exists)
				return prev.filter((s) => s.datasource_id !== ds.datasource_id);
			return [...prev, ds];
		});
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
	// Accepts a single question or an array of { question, options, stepIdx }
	const askClarify = (question, options, { stepIdx, queue: extraQueue } = {}) => {
		addMsg('assistant', question);
		// Build queue: current question + any extras
		const allItems = [
			{ question, options, stepIdx: stepIdx ?? null },
			...(extraQueue ?? []),
		];
		setClarifyQueue(allItems);
		setClarifyQueueIdx(0);
		setClarifyQuestion(allItems[0].question);
		setClarifyOptions(allItems[0].options);
		setClarifyStepIdx(allItems[0].stepIdx);
		return new Promise((resolve) => {
			clarifyResolveRef.current = resolve;
		});
	};

	const handleClarifySelect = (option) => {
		setClarifyOptions(null);
		setClarifyQuestion('');
		setClarifyTyping(false);
		setClarifyCustomInput('');
		setClarifyStepIdx(null);
		addMsg('user', option);
		if (clarifyResolveRef.current) {
			clarifyResolveRef.current(option);
			clarifyResolveRef.current = null;
		}
	};

	const handleClarifySkip = () => {
		setClarifyOptions(null);
		setClarifyQuestion('');
		setClarifyTyping(false);
		setClarifyCustomInput('');
		setClarifyStepIdx(null);
		addMsg('user', 'Skipped');
		if (clarifyResolveRef.current) {
			clarifyResolveRef.current('skip');
			clarifyResolveRef.current = null;
		}
	};

	const handleClarifyCustomSubmit = () => {
		if (!clarifyCustomInput.trim()) return;
		handleClarifySelect(clarifyCustomInput.trim());
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
				{ stepIdx: 3 },
			);

			await new Promise((r) => setTimeout(r, 500));
			addMsg(
				'assistant',
				`Got it. Applying the **${choice.toLowerCase()}** logic. Finalising the audit report…`,
			);
			await new Promise((r) => setTimeout(r, 900));
			setShowOutput(true);
			setChatCollapsed(true);
			setOutputTab('output');
		} catch {
			addMsg(
				'assistant',
				'Something went wrong while running the workflow. Please try again.',
			);
			setClarifyOptions(null);
			setClarifyQuestion('');
			setClarifyStepIdx(null);
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
			<>
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

						<div className="flex items-center ml-auto gap-0.5">
							{HSTEPS.map((step, i) => (
								<div key={step.label} className="flex items-center">
									<div className="flex items-center gap-1.5">
										<div
											className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-200 ${
												i === 0
													? 'bg-violet-600 text-white'
													: 'bg-gray-100 text-gray-400'
											}`}
										>
											{i + 1}
										</div>
										<span
											className={`text-xs font-medium whitespace-nowrap ${i === 0 ? 'text-gray-900' : 'text-gray-400'}`}
										>
											{step.label}
										</span>
									</div>
									{i < HSTEPS.length - 1 && (
										<div className="w-7 h-px bg-gray-200 mx-2.5 flex-shrink-0" />
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
								<span className="text-slate-900">
									Audit smarter.{' '}
								</span>
								<span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
									Not harder.
								</span>
							</h1>
							<p className="text-base text-gray-400">
								Your AI copilot already knows what to look for. Just
								ask.
							</p>
						</div>

						{/* Input card */}
						<div className="px-[20%] pb-8">
							<div className="ai-glow bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
								{/* Attached file / data source pills */}
								{(uploadedFiles.length > 0 ||
									selectedDsSources.length > 0) && (
									<div className="flex flex-wrap gap-2">
										{uploadedFiles.map((f, i) => (
											<div
												key={`file-${i}`}
												className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
											>
												<div className="w-8 h-8 rounded-md bg-gray-200/70 flex items-center justify-center flex-shrink-0">
													{f.type === 'pdf' ? (
														<span className="text-[10px] font-bold text-gray-500 uppercase">
															PDF
														</span>
													) : (
														<FileText className="size-4 text-gray-500" />
													)}
												</div>
												<div className="min-w-0">
													<p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
														{f.name}
													</p>
													{f.size && (
														<p className="text-[10px] text-gray-400">
															{formatFileSize(f.size)}
														</p>
													)}
												</div>
												<button
													onClick={() =>
														removeUploadedFile(i)
													}
													className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
												>
													<X className="size-3.5" />
												</button>
											</div>
										))}
										{selectedDsSources.map((ds) => (
											<div
												key={`ds-${ds.datasource_id}`}
												className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2"
											>
												<div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
													<Database className="size-4 text-violet-500" />
												</div>
												<div className="min-w-0">
													<p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
														{ds.name}
													</p>
													<p className="text-[10px] text-gray-400">
														Data source
													</p>
												</div>
												<button
													onClick={() =>
														removeSelectedDs(
															ds.datasource_id,
														)
													}
													className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-violet-100 transition-colors flex-shrink-0"
												>
													<X className="size-3.5" />
												</button>
											</div>
										))}
									</div>
								)}
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
										<div className="relative">
											<button
												onClick={(e) => {
													e.stopPropagation();
													setPlusMenuOpen(
														plusMenuOpen === 'landing'
															? null
															: 'landing',
													);
												}}
												className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-200"
											>
												<Plus className="size-4" />
											</button>
											{plusMenuOpen === 'landing' && (
												<div
													onClick={(e) =>
														e.stopPropagation()
													}
													className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50"
												>
													<button
														onClick={() => {
															setPlusMenuOpen(null);
															fileInputRef.current?.click();
														}}
														className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
													>
														<CloudUpload className="size-4" />
														Upload
													</button>
													<button
														onClick={() => {
															setPlusMenuOpen(null);
															setChooseExistingSearch(
																'',
															);
															setChooseExistingOpen(
																true,
															);
														}}
														className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
													>
														<Database className="size-4" />
														Choose existing
													</button>
												</div>
											)}
										</div>
										<input
											ref={fileInputRef}
											type="file"
											multiple
											className="hidden"
											onChange={handleFileInput}
										/>
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
										disabled={
											!prompt.trim() &&
											uploadedFiles.length === 0 &&
											selectedDsSources.length === 0
										}
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
																wf.status ===
																'active'
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
															{(wf.inputs?.length ??
																0) !== 1
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
															handleDeleteTemplate(
																wf.id,
															)
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

				{/* Choose Existing Data Source modal (landing mode) */}
				{chooseExistingOpen && (
					<div
						className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
						onClick={() => setChooseExistingOpen(false)}
					>
						<div
							className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
								<div>
									<h2 className="text-lg font-semibold text-gray-900">
										Choose Data Source
									</h2>
									<p className="text-sm text-gray-400 mt-0.5">
										You can always change it later from the data
										source page
									</p>
								</div>
								<button
									onClick={() => setChooseExistingOpen(false)}
									className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
								>
									<X className="size-5" />
								</button>
							</div>

							{/* Search */}
							<div className="px-6 py-4 border-b border-gray-100">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
									<input
										type="text"
										placeholder="Search"
										value={chooseExistingSearch}
										onChange={(e) =>
											setChooseExistingSearch(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
									/>
								</div>
							</div>

							{/* List */}
							<div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
								{modalDsLoading ? (
									<div className="space-y-3">
										{Array.from({ length: 4 }).map((_, i) => (
											<div
												key={i}
												className="h-14 bg-gray-100 animate-pulse rounded-lg"
											/>
										))}
									</div>
								) : modalFilteredDs.length === 0 ? (
									<p className="text-center py-8 text-sm text-gray-400">
										No data sources found
									</p>
								) : (
									<>
										{modalFilteredDs.map((ds) => {
											const isProcessing =
												ds.status !== 'active';
											const isSelected =
												selectedDsSources.some(
													(s) =>
														s.datasource_id ===
														ds.datasource_id,
												);
											return (
												<div
													key={ds.datasource_id}
													onClick={() =>
														!isProcessing &&
														toggleDsSource(ds)
													}
													className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
														isProcessing
															? 'opacity-50 cursor-not-allowed border-gray-100'
															: isSelected
																? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
																: 'border-gray-200 hover:bg-violet-50 hover:border-violet-200'
													}`}
												>
													<Database className="size-5 text-violet-500 flex-shrink-0" />
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-900 truncate">
															{ds.name}
														</p>
													</div>
													<div className="flex-shrink-0">
														<div
															className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
																isSelected
																	? 'border-violet-600 bg-violet-600'
																	: 'border-gray-300'
															}`}
														>
															{isSelected && (
																<Check className="size-3 text-white" />
															)}
														</div>
													</div>
												</div>
											);
										})}
										<ModalDsSentinel />
										{modalFetchingNext && (
											<p className="text-sm text-center text-gray-400 py-2">
												Loading more...
											</p>
										)}
									</>
								)}
							</div>

							{/* Footer */}
							<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
								<button
									onClick={() => setChooseExistingOpen(false)}
									className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => setChooseExistingOpen(false)}
									disabled={selectedDsSources.length === 0}
									className="px-5 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Continue
								</button>
							</div>
						</div>
					</div>
				)}

				<GuidedPromptModal
					isOpen={guidedOpen}
					onClose={() => setGuidedOpen(false)}
					onInsert={(generatedPrompt) => {
						setPrompt(generatedPrompt);
						setGuidedOpen(false);
					}}
				/>
			</>
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

	const filesReady = uploadedFiles.length > 0 || selectedDsSources.length > 0;

	return (
		<>
			{/* Clarification — no overlay, card draws focus via styling */}
			<div className="flex h-full min-h-0 overflow-hidden">
				{/* ══════════════════════════════════════════════════════════
			    LEFT PANEL — AI Assistant
			══════════════════════════════════════════════════════════ */}
				<aside
					className={`${showOutput ? (chatCollapsed ? 'w-12' : 'w-[30%]') : 'w-[30%]'} flex-shrink-0 flex flex-col bg-white border-r border-gray-200 relative transition-all duration-300`}
				>
					{/* Collapsed chat icon rail — output mode, chat hidden */}
					{showOutput && chatCollapsed && (
						<div className="flex flex-col items-center py-3 gap-2 h-full">
							<button
								onClick={() => setChatCollapsed(false)}
								className="w-9 h-9 rounded-lg bg-violet-50 ring-1 ring-violet-200/50 flex items-center justify-center hover:bg-violet-100 transition-colors group relative"
								title="Open chat"
							>
								<MessageSquare className="size-4 text-violet-600" />
							</button>
						</div>
					)}
					{/* Expanded chat panel — always shown when not in output, or when chat is open in output mode */}
					{(!showOutput || (showOutput && !chatCollapsed)) && (
						<>
							{/* Header */}
							<div className="px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
								<div className="flex items-center gap-2.5 mb-2.5">
									<div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
										<Sparkles className="size-4 text-white" />
									</div>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-semibold text-gray-900 block leading-tight">
											AI Assistant
										</span>
										<span className="text-[11px] text-gray-400 leading-tight">
											Guided workflow setup
										</span>
									</div>
									{showOutput ? (
										<button
											onClick={() => setChatCollapsed(true)}
											className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
											title="Collapse chat"
										>
											<PanelRightClose className="size-4 rotate-180" />
										</button>
									) : (
										<span className="text-xs text-gray-400 font-medium">
											Step {activeStep} of {VSTEPS.length}
										</span>
									)}
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
													className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200 focus:outline-none ${
														completed
															? 'bg-emerald-500'
															: active
																? 'bg-violet-500'
																: 'bg-violet-500/25'
													} ${step.num <= activeStep ? 'cursor-pointer' : 'cursor-default'}`}
												/>
												{idx < VSTEPS.length - 1 && (
													<div
														className={`h-[2px] flex-1 rounded-full ${completed ? 'bg-emerald-500/40' : 'bg-violet-500/15'}`}
													/>
												)}
											</Fragment>
										);
									})}
									<span className="ml-3 text-[11px] font-semibold text-violet-600 flex-shrink-0">
										{
											VSTEPS.find((s) => s.num === activeStep)
												?.label
										}
									</span>
								</div>
							</div>

							{/* Chat messages */}
							<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
								{messages.map((m, i) => (
									<div
										key={i}
										className={`flex gap-2.5 wf-msg-enter transition-all duration-300 ease-in-out ${m.role === 'user' ? 'flex-row-reverse' : 'items-start'}`}
										style={{
											opacity:
												clarifyOptions || chatContext
													? 0.35
													: 1,
											filter: chatContext
												? 'blur(1.5px)'
												: 'none',
										}}
									>
										{m.role === 'user' ? null : (
											<img
												src={ira}
												alt="ira"
												className="size-8 flex-shrink-0 mt-0.5"
											/>
										)}
										<div
											className={`max-w-[85%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
												m.role === 'user'
													? 'bg-purple-4 text-primary80 font-medium rounded-tl-xl rounded-tr-md rounded-bl-xl rounded-br-xl'
													: 'text-primary80'
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
												onClick={() =>
													fileInputRef.current?.click()
												}
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
									<div
										className="flex gap-2.5 items-start transition-all duration-300 ease-in-out"
										style={{
											opacity:
												clarifyOptions || chatContext
													? 0.35
													: 1,
											filter: chatContext
												? 'blur(1.5px)'
												: 'none',
										}}
									>
										<img
											src={ira}
											alt="ira"
											className="size-8 flex-shrink-0 mt-0.5"
										/>
										<div className="rounded-xl px-4 py-3 flex items-center gap-1.5">
											<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
											<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
											<span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
										</div>
									</div>
								)}

								{/* Clarification card removed — now rendered in bottom input area */}

								<div ref={chatEndRef} />
							</div>

							{/* Chat input / Clarification area */}
							<div
								className={`p-4 flex-shrink-0 relative ${clarifyOptions ? 'bg-transparent' : 'border-t border-gray-100 bg-white'}`}
							>
								{clarifyOptions ? (
									/* ── Clarification card pinned to bottom ── */
									<>
										{/* Top fade gradient */}
										<div
											className="h-2 -mt-2 mb-2 pointer-events-none"
											style={{
												background:
													'linear-gradient(to bottom, transparent, white)',
											}}
										/>
										<div
											className="rounded-[10px] p-[14px_16px]"
											style={{
												border: '1px solid rgba(106, 18, 205, 0.10)',
												boxShadow:
													'0 4px 12px -2px rgba(106, 18, 205, 0.10), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
											}}
										>
											{/* Top row: Step label (left) + queue nav (right) */}
											<div className="flex items-center justify-between mb-3">
												{clarifyStepIdx != null ? (
													<span
														className="text-[11px] font-medium uppercase tracking-[0.04em]"
														style={{ color: '#6A12CD' }}
													>
														Step {clarifyStepIdx + 1}
														{workflow?.steps?.[
															clarifyStepIdx
														]
															? `: ${workflow.steps[clarifyStepIdx].name}`
															: ''}
													</span>
												) : (
													<span />
												)}

												{clarifyQueue.length > 1 && (
													<div className="flex items-center gap-1 text-[11px] text-gray-400 select-none">
														<button
															onClick={() => {
																const prev =
																	clarifyQueueIdx -
																	1;
																if (prev < 0) return;
																setClarifyQueueIdx(
																	prev,
																);
																setClarifyQuestion(
																	clarifyQueue[
																		prev
																	].question,
																);
																setClarifyOptions(
																	clarifyQueue[
																		prev
																	].options,
																);
																setClarifyStepIdx(
																	clarifyQueue[
																		prev
																	].stepIdx,
																);
																setClarifyTyping(
																	false,
																);
																setClarifyCustomInput(
																	'',
																);
															}}
															disabled={
																clarifyQueueIdx === 0
															}
															className="hover:text-gray-600 disabled:opacity-30 transition-colors px-0.5"
														>
															‹
														</button>
														<span className="font-medium text-gray-500">
															{clarifyQueueIdx + 1} of{' '}
															{clarifyQueue.length}
														</span>
														<button
															onClick={() => {
																const next =
																	clarifyQueueIdx +
																	1;
																if (
																	next >=
																	clarifyQueue.length
																)
																	return;
																setClarifyQueueIdx(
																	next,
																);
																setClarifyQuestion(
																	clarifyQueue[
																		next
																	].question,
																);
																setClarifyOptions(
																	clarifyQueue[
																		next
																	].options,
																);
																setClarifyStepIdx(
																	clarifyQueue[
																		next
																	].stepIdx,
																);
																setClarifyTyping(
																	false,
																);
																setClarifyCustomInput(
																	'',
																);
															}}
															disabled={
																clarifyQueueIdx ===
																clarifyQueue.length -
																	1
															}
															className="hover:text-gray-600 disabled:opacity-30 transition-colors px-0.5"
														>
															›
														</button>
													</div>
												)}
											</div>

											{/* Question text — bolder than regular chat */}
											<p
												className="text-[13px] font-medium text-primary80 leading-relaxed mb-4"
												dangerouslySetInnerHTML={{
													__html: clarifyQuestion.replace(
														/\*\*(.*?)\*\*/g,
														'<strong class="font-semibold text-[#6A12CD]">$1</strong>',
													),
												}}
											/>

											{/* Inner options — no box, just rows with bottom border */}
											{!clarifyTyping ? (
												<div className="flex flex-col gap-2">
													{clarifyOptions.map((option) => (
														<button
															key={option}
															onClick={() =>
																handleClarifySelect(
																	option,
																)
															}
															className="w-full text-left text-[12px] font-medium px-3 py-2.5 text-primary80 border-b border-gray-100 last:border-b-0 rounded-lg hover:bg-gray-50 transition-all duration-150"
														>
															{option}
														</button>
													))}
												</div>
											) : (
												/* Custom input mode */
												<div className="flex gap-2 items-end">
													<textarea
														ref={clarifyInputRef}
														value={clarifyCustomInput}
														onChange={(e) =>
															setClarifyCustomInput(
																e.target.value,
															)
														}
														onKeyDown={(e) => {
															if (
																e.key === 'Enter' &&
																!e.shiftKey
															) {
																e.preventDefault();
																handleClarifyCustomSubmit();
															}
															if (e.key === 'Escape') {
																setClarifyTyping(
																	false,
																);
																setClarifyCustomInput(
																	'',
																);
															}
														}}
														placeholder="Type your response…"
														rows={2}
														className="flex-1 resize-none text-xs rounded-[8px] px-3.5 py-2.5 bg-white border border-gray-200 text-primary80 placeholder:text-gray-400 outline-none focus:border-[#6A12CD80] focus:ring-1 focus:ring-[#6A12CD20] transition-all duration-200 leading-relaxed"
													/>
													<button
														onClick={
															handleClarifyCustomSubmit
														}
														disabled={
															!clarifyCustomInput.trim()
														}
														className="bg-[#6A12CD] hover:bg-[#5A0FB0] disabled:opacity-40 text-white rounded-lg h-9 w-9 flex items-center justify-center flex-shrink-0 transition-all duration-200"
													>
														<Send className="size-3.5" />
													</button>
												</div>
											)}

											{/* Bottom row: Type something else + Skip */}
											<div className="flex items-center gap-3 mt-3">
												{!clarifyTyping && (
													<button
														onClick={() => {
															setClarifyTyping(true);
															setTimeout(
																() =>
																	clarifyInputRef.current?.focus(),
																50,
															);
														}}
														className="flex-1 text-left text-[12px] text-gray-400 px-2 py-2 border border-dashed border-gray-200 rounded-lg hover:bg-[#6A12CD06] hover:text-gray-500 transition-all duration-150"
													>
														Type something else…
													</button>
												)}
												<button
													onClick={handleClarifySkip}
													className="text-[12px] text-gray-400 hover:text-primary60 underline underline-offset-2 shrink-0 transition-colors"
												>
													Skip
												</button>
											</div>
										</div>
									</>
								) : (
									/* ── Normal chat input ── */
									<>
										{/* ── Context card + quick actions ── */}
										{chatContext &&
											(() => {
												const def =
													CHAT_CONTEXT_DEFS[
														chatContext.key
													];
												if (!def) return null;
												const CtxIcon = def.icon;
												const subtitle =
													chatContext.subtitle ||
													def.label;
												return (
													<div className="mb-3 space-y-2.5">
														{/* Context card */}
														<div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[rgba(106,18,205,0.15)] bg-[rgba(106,18,205,0.04)]">
															<div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200/60 flex items-center justify-center flex-shrink-0">
																<CtxIcon className="size-4 text-violet-600" />
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-semibold text-slate-800 truncate">
																	{chatContext.stepName ||
																		def.label}
																</p>
																<p className="text-xs text-slate-400 truncate">
																	{subtitle}
																</p>
															</div>
															<button
																onClick={() =>
																	setChatContext(
																		null,
																	)
																}
																className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
															>
																<X className="size-3.5" />
															</button>
														</div>
														{/* Quick action chips */}
														<div className="flex flex-wrap gap-1.5">
															{def.actions.map(
																(action) => (
																	<button
																		key={action}
																		onClick={() => {
																			const contextLabel =
																				chatContext.stepName ||
																				def.label;
																			setChatInput(
																				`${action} for ${contextLabel}`,
																			);
																		}}
																		className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50/50 transition-all duration-150 active:scale-[0.97]"
																	>
																		{action}
																	</button>
																),
															)}
														</div>
													</div>
												);
											})()}

										<div
											className="rounded-2xl border border-[rgba(106,18,205,0.15)] bg-white focus-within:border-[rgba(106,18,205,0.35)] transition-all duration-200 overflow-hidden"
											style={{
												boxShadow:
													'0 0 0 3px rgba(106,18,205,0.06), 0 2px 12px -2px rgba(106,18,205,0.10), 0 4px 24px -4px rgba(106,18,205,0.08)',
											}}
										>
											<textarea
												value={chatInput}
												onChange={(e) =>
													setChatInput(e.target.value)
												}
												onKeyDown={(e) => {
													if (
														e.key === 'Enter' &&
														!e.shiftKey
													) {
														e.preventDefault();
														handleBuilderSend();
													}
												}}
												placeholder={
													chatContext
														? `Ask about ${CHAT_CONTEXT_DEFS[chatContext.key]?.label || 'this section'}…`
														: 'Describe what you need…'
												}
												rows={2}
												className="w-full resize-none text-xs px-3.5 pt-3 pb-1.5 bg-transparent text-gray-800 placeholder:text-gray-400 outline-none leading-relaxed"
											/>
											<div className="flex items-center gap-1 px-2 pb-2">
												<div className="relative">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setPlusMenuOpen(
																plusMenuOpen ===
																	'builder'
																	? null
																	: 'builder',
															);
														}}
														className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
														title="Add files"
													>
														<Plus className="size-3.5" />
													</button>
													{plusMenuOpen === 'builder' && (
														<div
															onClick={(e) =>
																e.stopPropagation()
															}
															className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50"
														>
															<button
																onClick={() => {
																	setPlusMenuOpen(
																		null,
																	);
																	chatFileInputRef.current?.click();
																}}
																className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
															>
																<CloudUpload className="size-3.5" />
																Upload
															</button>
															<button
																onClick={() => {
																	setPlusMenuOpen(
																		null,
																	);
																	setChooseExistingSearch(
																		'',
																	);
																	setChooseExistingOpen(
																		true,
																	);
																}}
																className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
															>
																<Database className="size-3.5" />
																Choose existing
															</button>
														</div>
													)}
												</div>
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
													className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:bg-[#6A12CD08] hover:text-[#6A12CD] transition-all duration-200"
												>
													<Sparkles className="size-3" />
													Guide me
												</button>
												<button
													onClick={handleBuilderSend}
													disabled={
														(!chatInput.trim() &&
															uploadedFiles.length ===
																0 &&
															selectedDsSources.length ===
																0) ||
														isGenerating
													}
													className="ml-auto bg-[#6A12CD] hover:bg-[#5A0FB0] disabled:opacity-40 text-white rounded-lg h-7 w-7 flex items-center justify-center flex-shrink-0 transition-all duration-200"
												>
													<Send className="size-3" />
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						</>
					)}
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
							<div className="px-5 h-16 bg-white border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<button
										onClick={() => setActiveStep(1)}
										className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
									>
										<ArrowLeft className="size-4" />
									</button>
									<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
										<CloudUpload className="size-4 text-violet-600" />
									</div>
									<h2 className="text-[15px] font-semibold text-gray-900">
										Upload Data Files
									</h2>
								</div>
								<button
									onClick={handleVerify}
									disabled={!filesReady}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
								>
									<ShieldCheck className="size-3.5" />
									Verify with Ira
								</button>
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

								{/* Your Files section */}
								<div>
									<div className="flex items-center gap-2 mb-3">
										<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
											Your Files
										</p>
										<span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-md bg-violet-100 text-xs font-semibold text-violet-600">
											{uploadedFiles.length +
												selectedDsSources.length}
										</span>
									</div>

									{uploadedFiles.length > 0 ||
									selectedDsSources.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{uploadedFiles.map((f, i) => (
												<span
													key={`file-${i}`}
													className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full"
												>
													<CheckCircle2 className="size-3" />{' '}
													{f.name}
												</span>
											))}
											{selectedDsSources.map((ds) => (
												<span
													key={`ds-${ds.datasource_id}`}
													className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full"
												>
													<CheckCircle2 className="size-3" />{' '}
													{ds.name}
												</span>
											))}
										</div>
									) : (
										<div className="rounded-lg bg-[#F9FAFB] border border-gray-100 py-4 px-5">
											<p className="text-sm text-gray-400 text-center">
												No files added yet. Upload from your
												desktop or link an existing data
												source below.
											</p>
										</div>
									)}
								</div>

								{/* ADD FILES section divider */}
								<div className="flex items-center gap-3 py-1">
									<div className="flex-1 border-t border-gray-200" />
									<span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
										Add Files
									</span>
									<div className="flex-1 border-t border-gray-200" />
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

								{/* OR LINK FROM EXISTING DATA SOURCE separator */}
								<div className="flex items-center gap-3 py-1">
									<span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
										Or Link From Existing Data Source
									</span>
									<div className="flex-1 border-t border-gray-200" />
								</div>

								{/* Select from existing data source */}
								<div>
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
												{filteredDs.map((ds) => {
													const isDsSelected =
														selectedDsSources.some(
															(s) =>
																s.datasource_id ===
																ds.datasource_id,
														);
													return (
														<div
															key={ds.datasource_id}
															onClick={() =>
																toggleDsSource(ds)
															}
															className={`border rounded-lg py-2 px-3 flex items-center gap-3 cursor-pointer transition-all ${isDsSelected ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-gray-200 hover:bg-violet-50'}`}
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
															{isDsSelected && (
																<div className="flex-shrink-0">
																	<div className="size-5 bg-violet-600 rounded flex items-center justify-center">
																		<Check className="size-3 text-white" />
																	</div>
																</div>
															)}
														</div>
													);
												})}
											</div>
											<DsSentinel />
										</>
									)}
								</div>
							</div>
						</div>
					)}

					{/* ── Step 3: Map Data ── */}
					{workflow && activeStep === 3 && (
						<>
							{/* Hidden file input for changing a mapped file */}
							<input
								ref={changeFileRef}
								type="file"
								className="hidden"
								onChange={handleChangeFileSelected}
							/>
							<DataMappingPanel
								workflow={workflow}
								uploadedFiles={uploadedFiles}
								onConfirmMapping={handleConfirmMapping}
								onPreview={(p) => setPreviewFile(p)}
								onChangeFile={(inputId) => handleChangeFile(inputId)}
								onBack={() => setActiveStep(2)}
								chatContext={chatContext}
								onChatContext={setChatContext}
							/>
						</>
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
							<div className="px-5 h-16 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
								<div className="flex items-center gap-3">
									<button
										onClick={() => setActiveStep(3)}
										className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
									>
										<ArrowLeft className="size-4" />
									</button>
									<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
										<Play className="size-4 text-violet-600" />
									</div>
									<h2 className="text-[15px] font-semibold text-gray-900">
										Review &amp; Execute
									</h2>
								</div>
								<button
									onClick={handleSaveAndRun}
									disabled={isExecuting}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
								>
									{isExecuting ? (
										<>
											<Loader2 className="size-3.5 animate-spin" />
											Running…
										</>
									) : (
										<>
											<Play className="size-3.5" />
											Run Workflow
										</>
									)}
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
								{workflow.steps?.map((step, idx) => {
									const sc =
										STEP_COLORS[step.type] ??
										STEP_COLORS.extract;
									const inputSources = (step.dataFiles ?? []).map(
										(df) => {
											const found = workflow.inputs.find(
												(inp) => inp.id === df,
											);
											return {
												id: df,
												name: found?.name ?? df,
												type: found?.type,
												allColumns: found?.columns ?? [],
												usedColumns:
													step.columnUsage?.[df] ?? [],
											};
										},
									);
									const activeTab =
										expandedColumns[step.id] || null;
									const isCtxSelected =
										chatContext?.key === `step:${step.type}` &&
										chatContext?.stepIdx === idx;
									return (
										<div
											key={step.id}
											onClick={() =>
												setChatContext(
													isCtxSelected
														? null
														: {
																key: `step:${step.type}`,
																stepIdx: idx,
																stepName: step.name,
																subtitle: `Step ${idx + 1} · ${sc.badge.toLowerCase()}`,
															},
												)
											}
											className={`bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
												isCtxSelected
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
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
														{clarifyStepIdx === idx && (
															<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
																<span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
																Awaiting input
															</span>
														)}
													</div>
													<p className="text-sm text-slate-500 mb-3">
														{step.description}
													</p>
													{inputSources.length > 0 && (
														<div>
															<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
																Data Sources Used
															</p>
															<div className="flex flex-wrap gap-2 mb-3">
																{inputSources.map(
																	(src) => (
																		<button
																			key={
																				src.id
																			}
																			onClick={() =>
																				setExpandedColumns(
																					(
																						prev,
																					) => ({
																						...prev,
																						[step.id]:
																							prev[
																								step
																									.id
																							] ===
																							src.id
																								? null
																								: src.id,
																					}),
																				)
																			}
																			className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
																				activeTab ===
																				src.id
																					? 'bg-violet-50 text-violet-700 border-2 border-violet-300 shadow-sm'
																					: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
																			}`}
																		>
																			<span
																				className={`size-2 rounded-full ${activeTab === src.id ? 'bg-violet-500' : 'bg-emerald-500'}`}
																			/>
																			{
																				src.name
																			}
																			<span
																				className={`text-xs font-bold ${activeTab === src.id ? 'text-violet-500' : 'text-violet-400'}`}
																			>
																				{
																					src
																						.usedColumns
																						.length
																				}{' '}
																				cols
																			</span>
																			{activeTab ===
																				src.id && (
																				<ChevronDown className="size-3 text-violet-400" />
																			)}
																		</button>
																	),
																)}
															</div>
															{activeTab &&
																(() => {
																	const activeSrc =
																		inputSources.find(
																			(s) =>
																				s.id ===
																				activeTab,
																		);
																	if (!activeSrc)
																		return null;
																	const cols =
																		activeSrc.usedColumns;
																	if (
																		!cols ||
																		cols.length ===
																			0
																	)
																		return null;
																	return (
																		<div className="rounded-xl bg-slate-50/80 border border-slate-200 p-4">
																			<p className="text-sm font-semibold text-slate-700 mb-2">
																				{
																					activeSrc.name
																				}
																			</p>
																			<div className="flex flex-wrap gap-2">
																				{cols.map(
																					(
																						c,
																					) => {
																						const col =
																							typeof c ===
																							'string'
																								? {
																										column: c,
																										role: 'output',
																									}
																								: c;
																						const rs =
																							COLUMN_ROLE_STYLES[
																								col
																									.role
																							] ??
																							COLUMN_ROLE_STYLES.output;
																						return (
																							<span
																								key={
																									col.column
																								}
																								className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm text-slate-700"
																							>
																								{
																									col.column
																								}
																								{col.role !==
																									'output' && (
																									<span
																										className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rs.bg} ${rs.text} ${rs.border} border`}
																									>
																										{
																											rs.label
																										}
																									</span>
																								)}
																							</span>
																						);
																					},
																				)}
																			</div>
																		</div>
																	);
																})()}
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
							<div className="flex items-center gap-1 px-4 h-16 border-b border-gray-200 bg-white flex-shrink-0">
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

										{/* ═══ DASHBOARD LAYOUT ═══ */}
										{outputLayout === 'dashboard' && (
											<>
												{/* KPI cards */}
												<div className="grid grid-cols-4 gap-4 mb-6">
													{[
														{
															label: 'Total Invoices',
															value: '1,129',
															badge: '+13%',
															badgeCls:
																'bg-emerald-50 text-emerald-600',
															valueCls:
																'text-slate-900',
														},
														{
															label: 'Critical Flags',
															value: '3',
															badge: '+2',
															badgeCls:
																'bg-rose-50 text-rose-600',
															valueCls:
																'text-rose-600',
														},
														{
															label: 'Audit Accuracy',
															value: '99.4%',
															badge: '+8.2%',
															badgeCls:
																'bg-emerald-50 text-emerald-600',
															valueCls:
																'text-emerald-600',
														},
														{
															label: 'Potential Savings',
															value: '$42.5k',
															badge: 'New',
															badgeCls:
																'bg-violet-50 text-violet-700',
															valueCls:
																'text-slate-900',
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
														<Sparkles className="size-3" />{' '}
														AI SUMMARY
													</div>
													<p className="text-sm text-slate-700 leading-relaxed">
														Scanned{' '}
														<strong className="text-violet-700">
															12,450 invoices
														</strong>{' '}
														against 6-month history.
														Identified{' '}
														<strong className="text-violet-700">
															8 potential duplicates
														</strong>{' '}
														totalling{' '}
														<strong className="text-violet-700">
															₹6.10L at risk
														</strong>
														. Highest confidence match:
														INV-4521 vs INV-3102 (Acme
														Corp, 96% match).{' '}
														<strong className="text-violet-700">
															3 invoices
														</strong>{' '}
														from the same vendor within
														48 hours flagged as
														suspicious. False positive
														rate: 4.2% (down from 6.5%
														last run). Recommend
														immediate review of the 3
														critical-severity flags
														before next payment batch.
													</p>
												</div>

												{/* Key Observations */}
												<div className="mb-6">
													<h3 className="text-base font-bold text-slate-900 mb-4">
														Key Observations &amp;
														Insights
													</h3>
													<div className="grid grid-cols-2 gap-4">
														{[
															{
																icon: Sparkles,
																iconBg: 'bg-violet-100',
																iconCls:
																	'text-violet-700',
																title: 'Duplicate Detection',
																badge: 'High Priority',
																badgeCls:
																	'bg-rose-50 text-rose-600',
																body: '<strong class="text-violet-700">8 potential duplicates</strong> identified across 3 vendors. Highest confidence pair: INV-4521 vs INV-3102 (Acme Corp) with 96% field similarity.',
															},
															{
																icon: AlertTriangle,
																iconBg: 'bg-amber-100',
																iconCls:
																	'text-amber-700',
																title: 'MTOW Weight Discrepancies',
																badge: 'Medium Priority',
																badgeCls:
																	'bg-amber-50 text-amber-600',
																body: '<strong class="text-violet-700">12 invoices</strong> show MTOW values exceeding the certified maximum by >5%. Average overcharge per invoice: <strong class="text-violet-700">$3,847</strong>.',
															},
															{
																icon: BarChart3,
																iconBg: 'bg-emerald-100',
																iconCls:
																	'text-emerald-700',
																title: 'Rate Compliance',
																badge: 'On Track',
																badgeCls:
																	'bg-emerald-50 text-emerald-600',
																body: '<strong class="text-violet-700">97.3%</strong> of terminal charges align with the YYZ Rate Master. Remaining 2.7% used outdated rate tiers from Q2 2024.',
															},
															{
																icon: Search,
																iconBg: 'bg-blue-100',
																iconCls:
																	'text-blue-700',
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
																{BAR_CHART_DATA.map(
																	(d) => (
																		<div
																			key={
																				d.airline
																			}
																			className="flex-1 flex flex-col items-center gap-1"
																		>
																			<div
																				className={`w-full rounded-t-md ${d.color}`}
																				style={{
																					height: `${d.value}%`,
																				}}
																			/>
																			<span className="text-[10px] text-slate-400 text-center leading-tight">
																				{
																					d.airline
																				}
																			</span>
																		</div>
																	),
																)}
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
																	{DONUT_DATA.map(
																		(d) => (
																			<div
																				key={
																					d.label
																				}
																				className="flex items-center gap-2"
																			>
																				<div
																					className={`w-3 h-3 rounded-sm ${d.color}`}
																				/>
																				<span className="text-sm text-slate-600">
																					{
																						d.label
																					}
																				</span>
																				<span className="text-sm font-bold text-slate-800 ml-auto">
																					{
																						d.pct
																					}
																					%
																				</span>
																			</div>
																		),
																	)}
																</div>
															</div>
														</div>
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
																row.type ===
																'Duplicate'
																	? 'bg-rose-50 text-rose-600'
																	: row.type ===
																		  'MTOW Outlier'
																		? 'bg-amber-50 text-amber-600'
																		: row.type ===
																			  'Rate Mismatch'
																			? 'bg-violet-50 text-violet-600'
																			: 'bg-blue-50 text-blue-600';
															const sevBadge =
																row.severity ===
																'critical'
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
																		{
																			row.expected
																		}
																	</span>
																	<span className="text-sm font-medium text-slate-800">
																		{row.actual}
																	</span>
																	<span
																		className={`text-sm font-semibold ${row.severity === 'critical' ? 'text-rose-600' : row.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}
																	>
																		{
																			row.deviation
																		}
																	</span>
																	<span
																		className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit uppercase ${sevBadge}`}
																	>
																		{
																			row.severity
																		}
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
											</>
										)}

										{/* ═══ TABLE LAYOUT ═══ */}
										{outputLayout === 'table' && (
											<>
												{/* KPI summary strip */}
												<div className="flex items-center gap-6 mb-6 bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
													{[
														{
															label: 'Total Invoices',
															value: '1,129',
															cls: 'text-slate-900',
														},
														{
															label: 'Flagged',
															value: '23',
															cls: 'text-rose-600',
														},
														{
															label: 'Duplicates',
															value: '8',
															cls: 'text-amber-600',
														},
														{
															label: 'Accuracy',
															value: '99.4%',
															cls: 'text-emerald-600',
														},
														{
															label: 'At Risk',
															value: '₹6.10L',
															cls: 'text-violet-700',
														},
													].map(
														({ label, value, cls }) => (
															<div
																key={label}
																className="flex items-center gap-2"
															>
																<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
																	{label}
																</span>
																<span
																	className={`text-sm font-bold ${cls}`}
																>
																	{value}
																</span>
															</div>
														),
													)}
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
																row.type ===
																'Duplicate'
																	? 'bg-rose-50 text-rose-600'
																	: row.type ===
																		  'MTOW Outlier'
																		? 'bg-amber-50 text-amber-600'
																		: row.type ===
																			  'Rate Mismatch'
																			? 'bg-violet-50 text-violet-600'
																			: 'bg-blue-50 text-blue-600';
															const sevBadge =
																row.severity ===
																'critical'
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
																		{
																			row.expected
																		}
																	</span>
																	<span className="text-sm font-medium text-slate-800">
																		{row.actual}
																	</span>
																	<span
																		className={`text-sm font-semibold ${row.severity === 'critical' ? 'text-rose-600' : row.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}
																	>
																		{
																			row.deviation
																		}
																	</span>
																	<span
																		className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit uppercase ${sevBadge}`}
																	>
																		{
																			row.severity
																		}
																	</span>
																</div>
															);
														})}
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
																Showing 5 of 1,129
																records
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
														{AUDIT_TABLE_DATA.map(
															(row) => (
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
															),
														)}
													</div>
												</div>
											</>
										)}

										{/* ═══ SUMMARY LAYOUT ═══ */}
										{outputLayout === 'summary' && (
											<>
												{/* AI Summary — expanded */}
												<div className="bg-violet-50/50 border border-violet-100 rounded-xl p-6 mb-6">
													<div className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-full mb-4">
														<Sparkles className="size-3" />{' '}
														AI SUMMARY
													</div>
													<h3 className="text-base font-bold text-slate-900 mb-3">
														Executive Overview
													</h3>
													<p className="text-sm text-slate-700 leading-relaxed mb-4">
														Scanned{' '}
														<strong className="text-violet-700">
															12,450 invoices
														</strong>{' '}
														against 6-month history.
														Identified{' '}
														<strong className="text-violet-700">
															8 potential duplicates
														</strong>{' '}
														totalling{' '}
														<strong className="text-violet-700">
															₹6.10L at risk
														</strong>
														. Highest confidence match:
														INV-4521 vs INV-3102 (Acme
														Corp, 96% match).{' '}
														<strong className="text-violet-700">
															3 invoices
														</strong>{' '}
														from the same vendor within
														48 hours flagged as
														suspicious. False positive
														rate: 4.2% (down from 6.5%
														last run). Recommend
														immediate review of the 3
														critical-severity flags
														before next payment batch.
													</p>
													<div className="grid grid-cols-4 gap-3">
														{[
															{
																label: 'Total Invoices',
																value: '1,129',
																cls: 'text-slate-900',
															},
															{
																label: 'At Risk',
																value: '₹6.10L',
																cls: 'text-rose-600',
															},
															{
																label: 'Accuracy',
																value: '99.4%',
																cls: 'text-emerald-600',
															},
															{
																label: 'Savings',
																value: '$42.5k',
																cls: 'text-violet-700',
															},
														].map(
															({
																label,
																value,
																cls,
															}) => (
																<div
																	key={label}
																	className="bg-white/70 rounded-lg border border-violet-100 px-3 py-2"
																>
																	<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
																		{label}
																	</p>
																	<p
																		className={`text-lg font-bold ${cls}`}
																	>
																		{value}
																	</p>
																</div>
															),
														)}
													</div>
												</div>

												{/* Key Findings */}
												<div className="mb-6">
													<h3 className="text-base font-bold text-slate-900 mb-4">
														Key Findings
													</h3>
													<div className="space-y-4">
														{[
															{
																num: 1,
																icon: Sparkles,
																iconBg: 'bg-violet-100',
																iconCls:
																	'text-violet-700',
																title: 'Duplicate Detection — High Priority',
																titleCls:
																	'text-rose-600',
																body: '8 potential duplicates identified across 3 vendors. Highest confidence pair: INV-4521 vs INV-3102 (Acme Corp) with 96% field similarity. Combined value of duplicates: ₹4.2L. Recommend blocking payment on flagged items pending manual verification.',
															},
															{
																num: 2,
																icon: AlertTriangle,
																iconBg: 'bg-amber-100',
																iconCls:
																	'text-amber-700',
																title: 'MTOW Weight Discrepancies — Medium Priority',
																titleCls:
																	'text-amber-600',
																body: '12 invoices show MTOW values exceeding the certified maximum by >5%. Average overcharge per invoice: $3,847. Total exposure: $46,164. Pattern concentrated in Q1 billing cycles from two ground handling agents.',
															},
															{
																num: 3,
																icon: BarChart3,
																iconBg: 'bg-emerald-100',
																iconCls:
																	'text-emerald-700',
																title: 'Rate Compliance — On Track',
																titleCls:
																	'text-emerald-600',
																body: '97.3% of terminal charges align with the YYZ Rate Master. Remaining 2.7% used outdated rate tiers from Q2 2024. Auto-correction applied to 18 invoices; 3 require manual rate confirmation with the vendor.',
															},
															{
																num: 4,
																icon: Search,
																iconBg: 'bg-blue-100',
																iconCls:
																	'text-blue-700',
																title: 'Vendor Concentration Risk — Insight',
																titleCls:
																	'text-blue-600',
																body: '68% of flagged invoices originate from 2 vendors (Acme Corp, GlobalFlight). This concentration suggests systemic billing issues rather than isolated errors. Targeted vendor auditing may yield higher returns than broad-based scanning.',
															},
														].map(
															({
																num,
																icon: Icon,
																iconBg,
																iconCls,
																title,
																titleCls,
																body,
															}) => (
																<div
																	key={num}
																	className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]"
																>
																	<div className="flex items-start gap-3">
																		<div className="flex items-center gap-2 flex-shrink-0">
																			<span className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
																				{num}
																			</span>
																			<div
																				className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}
																			>
																				<Icon
																					className={`size-3.5 ${iconCls}`}
																				/>
																			</div>
																		</div>
																		<div className="flex-1">
																			<p className="text-sm font-bold text-slate-800 mb-1">
																				{
																					title
																				}
																			</p>
																			<p className="text-sm text-slate-600 leading-relaxed">
																				{
																					body
																				}
																			</p>
																		</div>
																	</div>
																</div>
															),
														)}
													</div>
												</div>

												{/* Recommendations */}
												<div className="mb-6">
													<h3 className="text-base font-bold text-slate-900 mb-4">
														Recommendations
													</h3>
													<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
														<div className="space-y-3">
															{[
																{
																	priority:
																		'CRITICAL',
																	priCls: 'bg-rose-50 text-rose-600 border-rose-200',
																	text: 'Immediately review and hold payment on the 3 critical-severity flagged invoices before the next payment batch.',
																},
																{
																	priority: 'HIGH',
																	priCls: 'bg-amber-50 text-amber-600 border-amber-200',
																	text: 'Initiate a targeted audit of Acme Corp and GlobalFlight billing practices — 68% of anomalies trace to these two vendors.',
																},
																{
																	priority:
																		'MEDIUM',
																	priCls: 'bg-violet-50 text-violet-600 border-violet-200',
																	text: 'Update rate tables to current Q4 2024 rates to eliminate the 2.7% stale-rate mismatches.',
																},
																{
																	priority: 'LOW',
																	priCls: 'bg-blue-50 text-blue-600 border-blue-200',
																	text: 'Schedule a follow-up comparison run next month to track false positive rate improvement trend.',
																},
															].map(
																({
																	priority,
																	priCls,
																	text,
																}) => (
																	<div
																		key={
																			priority
																		}
																		className="flex items-start gap-3"
																	>
																		<span
																			className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${priCls}`}
																		>
																			{
																				priority
																			}
																		</span>
																		<p className="text-sm text-slate-700 leading-relaxed">
																			{text}
																		</p>
																	</div>
																),
															)}
														</div>
													</div>
												</div>

												{/* Suggested Follow-ups */}
												<div className="mb-6">
													<p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
														Suggested Follow-ups
													</p>
													<div className="flex flex-wrap gap-2">
														{[
															'Deep dive into Acme Corp duplicates',
															'Generate vendor risk scorecard',
															'Export summary as PDF',
															'Compare with previous quarter audit',
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
											</>
										)}
									</div>
								)}

								{outputTab === 'analytics' && (
									<WorkflowAnalytics
										workflowId={workflow?.id}
										workflow={workflow}
										onBack={() => setOutputTab('output')}
									/>
								)}

								{outputTab === 'manager' && (
									<WorkflowManager
										workflowId={workflow?.id}
										workflow={workflow}
									/>
								)}
							</div>
						</div>
					)}
				</main>

				{/* ══════════════════════════════════════════════════════════
			    RIGHT PANEL — Config (collapsible, ~22% when open)
			══════════════════════════════════════════════════════════ */}
				<aside
					className={`flex-shrink-0 flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${rightOpen ? 'w-[20%]' : 'w-12'}`}
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
							{/* Tabs row — height matches middle panel header */}
							<div className="h-16 border-b border-gray-200 flex-shrink-0 flex items-end px-2">
								{[
									{ key: 'plan', label: 'Plan' },
									{ key: 'input', label: 'Input Config' },
									{ key: 'output', label: 'Output Config' },
								].map((tab) => (
									<button
										key={tab.key}
										onClick={() => setRightTab(tab.key)}
										className={`text-sm font-medium px-2.5 pb-3 transition-all whitespace-nowrap -mb-px ${
											rightTab === tab.key
												? 'text-violet-700 border-b-2 border-violet-600'
												: 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
										}`}
									>
										{tab.label}
									</button>
								))}
								<button
									onClick={() => setRightOpen(false)}
									title="Collapse panel"
									className="ml-auto mb-2.5 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
								>
									<PanelRightClose className="size-3.5" />
								</button>
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
										<div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
											<p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
												Query Execution Plan
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

										{/* RACM — Risk & Control Matrix */}
										<RACMSection
											racm={racmData}
											onRacmChange={setRacmData}
										/>
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

								{/* Input Config — Tolerance + Notes (always open) */}
								{rightTab === 'input' && workflow && (
									<div className="space-y-2">
										{/* ═══ Tolerance Rules ═══ */}
										<div
											onClick={() =>
												setChatContext(
													chatContext?.key ===
														'panel:tolerance'
														? null
														: {
																key: 'panel:tolerance',
																stepName:
																	'Tolerance Rules',
																subtitle: `${toleranceActiveCount} active`,
															},
												)
											}
											className={`bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
												chatContext?.key ===
												'panel:tolerance'
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
										>
											{/* Panel header */}
											<div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-slate-100">
												<div
													className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
													style={{
														background:
															'rgba(106,18,205,0.08)',
														border: '1px solid rgba(106,18,205,0.16)',
													}}
												>
													<SlidersHorizontal
														className="size-3.5"
														style={{ color: '#6A12CD' }}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<span className="text-sm font-semibold text-slate-800">
														Tolerance rules
													</span>
													<p className="text-[11px] text-slate-400 mt-0.5">
														Acceptable variance per match
														dimension
													</p>
												</div>
												<span
													className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
													style={{
														background:
															'rgba(106,18,205,0.08)',
														color: '#6A12CD',
													}}
												>
													{toleranceActiveCount} active
												</span>
											</div>

											<div className="px-2 py-2 space-y-1.5">
												{/* ── Amount Card ── */}
												{(() => {
													const r = toleranceRules.amt;
													const sev = toleranceSeverity(
														'amt',
														r.val,
													);
													const sevStyle =
														sev === 'strict'
															? {
																	bg: 'rgba(220,38,38,0.08)',
																	color: '#DC2626',
																}
															: sev === 'moderate'
																? {
																		bg: 'rgba(183,137,0,0.08)',
																		color: '#B78900',
																	}
																: {
																		bg: 'rgba(15,110,86,0.08)',
																		color: '#0F6E56',
																	};
													return (
														<div
															className={`border rounded-xl overflow-hidden transition-all ${r.enabled ? (r.expanded ? '' : 'border-slate-200/70') : 'border-slate-100 opacity-45'}`}
															style={
																r.enabled &&
																r.expanded
																	? {
																			borderColor:
																				'rgba(106,18,205,0.2)',
																		}
																	: {}
															}
														>
															<div
																className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
																onClick={() =>
																	r.enabled &&
																	updateTolRule(
																		'amt',
																		{
																			expanded:
																				!r.expanded,
																		},
																	)
																}
															>
																<div
																	className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
																	style={{
																		background:
																			'#E1F5EE',
																	}}
																>
																	<DollarSign
																		className="size-3.5"
																		style={{
																			color: '#0F6E56',
																		}}
																	/>
																</div>
																<div className="flex-1 min-w-0">
																	<div className="text-[13px] font-medium text-slate-800">
																		Amount
																	</div>
																	<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
																		<span className="text-[11px] text-slate-400">
																			{r.mode ===
																			'absolute'
																				? `\u00b1$${r.absVal.toLocaleString()}`
																				: `\u00b1${r.val}%`}
																		</span>
																		<span
																			className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																			style={{
																				background:
																					sevStyle.bg,
																				color: sevStyle.color,
																			}}
																		>
																			{sev ===
																			'strict'
																				? 'Strict'
																				: sev ===
																					  'moderate'
																					? 'Moderate'
																					: 'Relaxed'}
																		</span>
																	</div>
																	{r.columns &&
																		r.enabled &&
																		!r.expanded && (
																			<div className="flex items-center gap-1 mt-1 flex-wrap">
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.srcDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.src
																					}
																				</span>
																				<span className="text-[9px] text-slate-300 font-semibold">
																					vs
																				</span>
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.tgtDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.tgt
																					}
																				</span>
																			</div>
																		)}
																</div>
																<ChevronRight
																	className={`size-3 text-slate-400 transition-transform ${r.expanded ? 'rotate-90' : ''}`}
																	style={
																		r.expanded
																			? {
																					color: '#6A12CD',
																				}
																			: {}
																	}
																/>
																<div
																	className="relative w-8 h-[18px] flex-shrink-0"
																	onClick={(e) =>
																		e.stopPropagation()
																	}
																>
																	<div
																		className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																		style={{
																			background:
																				r.enabled
																					? '#6A12CD'
																					: '#d1d5db',
																		}}
																		onClick={() =>
																			updateTolRule(
																				'amt',
																				{
																					enabled:
																						!r.enabled,
																					...(!r.enabled
																						? {}
																						: {
																								expanded: false,
																							}),
																				},
																			)
																		}
																	>
																		<div
																			className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${r.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																		/>
																	</div>
																</div>
															</div>
															{r.enabled &&
																r.expanded && (
																	<div className="px-3 pb-3 border-t border-slate-100">
																		<div className="pt-3 space-y-3">
																			{/* Column binding */}
																			{r.columns && (
																				<div>
																					<div className="flex items-center gap-1.5 mb-1.5">
																						<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
																							Applied
																							to
																						</span>
																						<span
																							className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									'rgba(106,18,205,0.08)',
																								color: '#6A12CD',
																							}}
																						>
																							AI
																						</span>
																					</div>
																					<div
																						className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
																						style={{
																							background:
																								'#f7f7f5',
																						}}
																					>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.srcDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.src
																							}
																						</span>
																						<span className="text-[9px] text-slate-400 font-semibold">
																							vs
																						</span>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.tgtDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.tgt
																							}
																						</span>
																					</div>
																				</div>
																			)}
																			{/* Mode selector */}
																			<div className="flex rounded-lg border border-slate-200 overflow-hidden">
																				{[
																					'Percentage',
																					'Absolute',
																				].map(
																					(
																						m,
																					) => (
																						<button
																							key={
																								m
																							}
																							onClick={() =>
																								updateTolRule(
																									'amt',
																									{
																										mode: m.toLowerCase(),
																									},
																								)
																							}
																							className={`flex-1 py-1.5 text-[11px] font-medium transition-all ${r.mode !== m.toLowerCase() ? 'bg-white text-slate-400 hover:bg-slate-50' : ''}`}
																							style={
																								r.mode ===
																								m.toLowerCase()
																									? {
																											background:
																												'#6A12CD',
																											color: '#fff',
																										}
																									: {}
																							}
																						>
																							{
																								m
																							}
																						</button>
																					),
																				)}
																			</div>
																			{/* Percentage slider */}
																			{r.mode ===
																				'percentage' && (
																				<div>
																					<div className="flex items-center gap-2 mb-1.5">
																						<span
																							className="text-lg font-bold tabular-nums min-w-[40px]"
																							style={{
																								color: '#6A12CD',
																							}}
																						>
																							{
																								r.val
																							}
																							%
																						</span>
																						<span
																							className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									sevStyle.bg,
																								color: sevStyle.color,
																							}}
																						>
																							{sev ===
																							'strict'
																								? 'Strict'
																								: sev ===
																									  'moderate'
																									? 'Moderate'
																									: 'Relaxed'}
																						</span>
																					</div>
																					<input
																						type="range"
																						min="0"
																						max="20"
																						step="0.5"
																						value={
																							r.val
																						}
																						onChange={(
																							e,
																						) =>
																							updateTolRule(
																								'amt',
																								{
																									val: parseFloat(
																										e
																											.target
																											.value,
																									),
																								},
																							)
																						}
																						className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#6A12CD] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(106,18,205,0.35)]"
																						style={{
																							background:
																								'linear-gradient(to right, rgba(220,38,38,0.18), rgba(183,137,0,0.18), rgba(15,110,86,0.18))',
																						}}
																					/>
																					<div className="flex justify-between mt-1">
																						<span
																							className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									'rgba(220,38,38,0.08)',
																								color: '#DC2626',
																							}}
																						>
																							0%
																							Strict
																						</span>
																						<span
																							className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									'rgba(15,110,86,0.08)',
																								color: '#0F6E56',
																							}}
																						>
																							20%
																							Relaxed
																						</span>
																					</div>
																				</div>
																			)}
																			{/* Absolute value input */}
																			{r.mode ===
																				'absolute' && (
																				<div>
																					<p className="text-xs text-slate-500 font-medium mb-2">
																						Maximum
																						allowed
																						difference
																					</p>
																					<div className="flex items-center gap-2">
																						<div className="flex items-center flex-1 border border-slate-200 rounded-lg overflow-hidden focus-within:border-[rgba(106,18,205,0.4)] focus-within:shadow-[0_0_0_3px_rgba(106,18,205,0.08)] transition-all">
																							<span className="text-xs font-medium text-slate-400 pl-3 pr-1 select-none">
																								$
																							</span>
																							<input
																								type="number"
																								min="0"
																								step="50"
																								value={
																									r.absVal
																								}
																								onChange={(
																									e,
																								) =>
																									updateTolRule(
																										'amt',
																										{
																											absVal: Math.max(
																												0,
																												Number(
																													e
																														.target
																														.value,
																												),
																											),
																										},
																									)
																								}
																								className="flex-1 py-2 pr-3 text-sm font-semibold bg-transparent outline-none tabular-nums"
																								style={{
																									color: '#6A12CD',
																								}}
																							/>
																						</div>
																						<span
																							className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									sevStyle.bg,
																								color: sevStyle.color,
																							}}
																						>
																							{r.absVal <=
																							100
																								? 'Strict'
																								: r.absVal <=
																									  1000
																									? 'Moderate'
																									: 'Relaxed'}
																						</span>
																					</div>
																					<div className="flex gap-1.5 mt-2">
																						{[
																							100,
																							500,
																							1000,
																							5000,
																						].map(
																							(
																								v,
																							) => (
																								<button
																									key={
																										v
																									}
																									onClick={() =>
																										updateTolRule(
																											'amt',
																											{
																												absVal: v,
																											},
																										)
																									}
																									className="flex-1 py-1 text-[10px] font-medium rounded-md border transition-all"
																									style={
																										r.absVal ===
																										v
																											? {
																													background:
																														'rgba(106,18,205,0.06)',
																													color: '#6A12CD',
																													borderColor:
																														'rgba(106,18,205,0.2)',
																												}
																											: {
																													background:
																														'#fff',
																													color: '#94a3b8',
																													borderColor:
																														'#e2e8f0',
																												}
																									}
																								>
																									$
																									{v.toLocaleString()}
																								</button>
																							),
																						)}
																					</div>
																				</div>
																			)}
																			<div
																				className="text-[11px] text-slate-400 leading-relaxed rounded-lg px-2.5 py-2"
																				style={{
																					background:
																						'rgba(106,18,205,0.03)',
																				}}
																			>
																				Flags
																				transactions
																				where
																				monetary
																				values
																				differ
																				beyond
																				this
																				threshold
																				across
																				matched
																				records.
																			</div>
																		</div>
																	</div>
																)}
														</div>
													);
												})()}

												{/* ── Date Card ── */}
												{(() => {
													const r = toleranceRules.date;
													const sev = toleranceSeverity(
														'date',
														r.val,
													);
													const sevStyle =
														sev === 'strict'
															? {
																	bg: 'rgba(220,38,38,0.08)',
																	color: '#DC2626',
																}
															: sev === 'moderate'
																? {
																		bg: 'rgba(183,137,0,0.08)',
																		color: '#B78900',
																	}
																: {
																		bg: 'rgba(15,110,86,0.08)',
																		color: '#0F6E56',
																	};
													return (
														<div
															className={`border rounded-xl overflow-hidden transition-all ${r.enabled ? (r.expanded ? '' : 'border-slate-200/70') : 'border-slate-100 opacity-45'}`}
															style={
																r.enabled &&
																r.expanded
																	? {
																			borderColor:
																				'rgba(106,18,205,0.2)',
																		}
																	: {}
															}
														>
															<div
																className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
																onClick={() =>
																	r.enabled &&
																	updateTolRule(
																		'date',
																		{
																			expanded:
																				!r.expanded,
																		},
																	)
																}
															>
																<div
																	className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
																	style={{
																		background:
																			'#E6F1FB',
																	}}
																>
																	<Calendar
																		className="size-3.5"
																		style={{
																			color: '#185FA5',
																		}}
																	/>
																</div>
																<div className="flex-1 min-w-0">
																	<div className="text-[13px] font-medium text-slate-800">
																		Date
																	</div>
																	<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
																		<span className="text-[11px] text-slate-400">
																			{
																				'\u00b1'
																			}
																			{r.val}{' '}
																			{r.dayType ===
																			'calendar'
																				? 'calendar'
																				: 'business'}{' '}
																			days
																		</span>
																		<span
																			className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																			style={{
																				background:
																					sevStyle.bg,
																				color: sevStyle.color,
																			}}
																		>
																			{sev ===
																			'strict'
																				? 'Strict'
																				: sev ===
																					  'moderate'
																					? 'Moderate'
																					: 'Relaxed'}
																		</span>
																	</div>
																	{r.columns &&
																		r.enabled &&
																		!r.expanded && (
																			<div className="flex items-center gap-1 mt-1 flex-wrap">
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.srcDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.src
																					}
																				</span>
																				<span className="text-[9px] text-slate-300 font-semibold">
																					vs
																				</span>
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.tgtDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.tgt
																					}
																				</span>
																			</div>
																		)}
																</div>
																<ChevronRight
																	className={`size-3 text-slate-400 transition-transform ${r.expanded ? 'rotate-90' : ''}`}
																	style={
																		r.expanded
																			? {
																					color: '#6A12CD',
																				}
																			: {}
																	}
																/>
																<div
																	className="relative w-8 h-[18px] flex-shrink-0"
																	onClick={(e) =>
																		e.stopPropagation()
																	}
																>
																	<div
																		className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																		style={{
																			background:
																				r.enabled
																					? '#6A12CD'
																					: '#d1d5db',
																		}}
																		onClick={() =>
																			updateTolRule(
																				'date',
																				{
																					enabled:
																						!r.enabled,
																					...(!r.enabled
																						? {}
																						: {
																								expanded: false,
																							}),
																				},
																			)
																		}
																	>
																		<div
																			className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${r.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																		/>
																	</div>
																</div>
															</div>
															{r.enabled &&
																r.expanded && (
																	<div className="px-3 pb-3 border-t border-slate-100">
																		<div className="pt-3 space-y-3">
																			{/* Column binding */}
																			{r.columns && (
																				<div>
																					<div className="flex items-center gap-1.5 mb-1.5">
																						<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
																							Applied
																							to
																						</span>
																						<span
																							className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									'rgba(106,18,205,0.08)',
																								color: '#6A12CD',
																							}}
																						>
																							AI
																						</span>
																					</div>
																					<div
																						className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
																						style={{
																							background:
																								'#f7f7f5',
																						}}
																					>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.srcDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.src
																							}
																						</span>
																						<span className="text-[9px] text-slate-400 font-semibold">
																							vs
																						</span>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.tgtDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.tgt
																							}
																						</span>
																					</div>
																				</div>
																			)}
																			{/* Day stepper */}
																			<div className="flex items-center justify-center gap-1">
																				<button
																					onClick={() =>
																						updateTolRule(
																							'date',
																							{
																								val: Math.max(
																									0,
																									r.val -
																										1,
																								),
																							},
																						)
																					}
																					className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-lg"
																				>
																					{
																						'\u2212'
																					}
																				</button>
																				<span
																					className="text-2xl font-bold tabular-nums min-w-[44px] text-center"
																					style={{
																						color: '#6A12CD',
																					}}
																				>
																					{
																						r.val
																					}
																				</span>
																				<button
																					onClick={() =>
																						updateTolRule(
																							'date',
																							{
																								val: Math.min(
																									30,
																									r.val +
																										1,
																								),
																							},
																						)
																					}
																					className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-lg"
																				>
																					+
																				</button>
																				<span className="text-[13px] text-slate-400 ml-1">
																					days
																				</span>
																				<span
																					className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2"
																					style={{
																						background:
																							sevStyle.bg,
																						color: sevStyle.color,
																					}}
																				>
																					{sev ===
																					'strict'
																						? 'Strict'
																						: sev ===
																							  'moderate'
																							? 'Moderate'
																							: 'Relaxed'}
																				</span>
																			</div>
																			{/* Calendar / Business */}
																			<div className="flex rounded-lg border border-slate-200 overflow-hidden max-w-[200px] mx-auto">
																				{[
																					'Calendar',
																					'Business',
																				].map(
																					(
																						m,
																					) => (
																						<button
																							key={
																								m
																							}
																							onClick={() =>
																								updateTolRule(
																									'date',
																									{
																										dayType:
																											m.toLowerCase(),
																									},
																								)
																							}
																							className={`flex-1 py-1.5 text-[11px] font-medium transition-all ${r.dayType !== m.toLowerCase() ? 'bg-white text-slate-400 hover:bg-slate-50' : ''}`}
																							style={
																								r.dayType ===
																								m.toLowerCase()
																									? {
																											background:
																												'#6A12CD',
																											color: '#fff',
																										}
																									: {}
																							}
																						>
																							{
																								m
																							}
																						</button>
																					),
																				)}
																			</div>
																			<div
																				className="text-[11px] text-slate-400 leading-relaxed rounded-lg px-2.5 py-2"
																				style={{
																					background:
																						'rgba(106,18,205,0.03)',
																				}}
																			>
																				Accounts
																				for
																				settlement
																				lag,
																				posting
																				delays,
																				and
																				timezone
																				cutoff
																				differences
																				between
																				systems.
																			</div>
																		</div>
																	</div>
																)}
														</div>
													);
												})()}

												{/* ── Text Similarity Card ── */}
												{(() => {
													const r = toleranceRules.text;
													const sev = toleranceSeverity(
														'text',
														r.val,
													);
													const sevStyle =
														sev === 'strict'
															? {
																	bg: 'rgba(220,38,38,0.08)',
																	color: '#DC2626',
																}
															: sev === 'moderate'
																? {
																		bg: 'rgba(183,137,0,0.08)',
																		color: '#B78900',
																	}
																: {
																		bg: 'rgba(15,110,86,0.08)',
																		color: '#0F6E56',
																	};
													return (
														<div
															className={`border rounded-xl overflow-hidden transition-all ${r.enabled ? (r.expanded ? '' : 'border-slate-200/70') : 'border-slate-100 opacity-45'}`}
															style={
																r.enabled &&
																r.expanded
																	? {
																			borderColor:
																				'rgba(106,18,205,0.2)',
																		}
																	: {}
															}
														>
															<div
																className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
																onClick={() =>
																	r.enabled &&
																	updateTolRule(
																		'text',
																		{
																			expanded:
																				!r.expanded,
																		},
																	)
																}
															>
																<div
																	className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
																	style={{
																		background:
																			'#EEEDFE',
																	}}
																>
																	<Type
																		className="size-3.5"
																		style={{
																			color: '#534AB7',
																		}}
																	/>
																</div>
																<div className="flex-1 min-w-0">
																	<div className="text-[13px] font-medium text-slate-800">
																		Text
																		similarity
																	</div>
																	<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
																		<span className="text-[11px] text-slate-400">
																			{
																				'\u2265'
																			}
																			{Math.round(
																				r.val,
																			)}
																			% fuzzy
																			match
																		</span>
																		<span
																			className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																			style={{
																				background:
																					sevStyle.bg,
																				color: sevStyle.color,
																			}}
																		>
																			{sev ===
																			'strict'
																				? 'Strict'
																				: sev ===
																					  'moderate'
																					? 'Moderate'
																					: 'Relaxed'}
																		</span>
																	</div>
																	{r.columns &&
																		r.enabled &&
																		!r.expanded && (
																			<div className="flex items-center gap-1 mt-1 flex-wrap">
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.srcDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.src
																					}
																				</span>
																				<span className="text-[9px] text-slate-300 font-semibold">
																					vs
																				</span>
																				<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																					<span
																						className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																						style={{
																							background:
																								dotColors[
																									r
																										.columns
																										.tgtDot
																								],
																						}}
																					/>
																					{
																						r
																							.columns
																							.tgt
																					}
																				</span>
																			</div>
																		)}
																</div>
																<ChevronRight
																	className={`size-3 text-slate-400 transition-transform ${r.expanded ? 'rotate-90' : ''}`}
																	style={
																		r.expanded
																			? {
																					color: '#6A12CD',
																				}
																			: {}
																	}
																/>
																<div
																	className="relative w-8 h-[18px] flex-shrink-0"
																	onClick={(e) =>
																		e.stopPropagation()
																	}
																>
																	<div
																		className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																		style={{
																			background:
																				r.enabled
																					? '#6A12CD'
																					: '#d1d5db',
																		}}
																		onClick={() =>
																			updateTolRule(
																				'text',
																				{
																					enabled:
																						!r.enabled,
																					...(!r.enabled
																						? {}
																						: {
																								expanded: false,
																							}),
																				},
																			)
																		}
																	>
																		<div
																			className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${r.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																		/>
																	</div>
																</div>
															</div>
															{r.enabled &&
																r.expanded && (
																	<div className="px-3 pb-3 border-t border-slate-100">
																		<div className="pt-3 space-y-3">
																			{/* Column binding */}
																			{r.columns && (
																				<div>
																					<div className="flex items-center gap-1.5 mb-1.5">
																						<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
																							Applied
																							to
																						</span>
																						<span
																							className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
																							style={{
																								background:
																									'rgba(106,18,205,0.08)',
																								color: '#6A12CD',
																							}}
																						>
																							AI
																						</span>
																					</div>
																					<div
																						className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
																						style={{
																							background:
																								'#f7f7f5',
																						}}
																					>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.srcDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.src
																							}
																						</span>
																						<span className="text-[9px] text-slate-400 font-semibold">
																							vs
																						</span>
																						<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																							<span
																								className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																								style={{
																									background:
																										dotColors[
																											r
																												.columns
																												.tgtDot
																										],
																								}}
																							/>
																							{
																								r
																									.columns
																									.tgt
																							}
																						</span>
																					</div>
																				</div>
																			)}
																			{/* Slider */}
																			<div>
																				<div className="flex items-center gap-2 mb-1.5">
																					<span
																						className="text-lg font-bold tabular-nums min-w-[40px]"
																						style={{
																							color: '#6A12CD',
																						}}
																					>
																						{Math.round(
																							r.val,
																						)}
																						%
																					</span>
																					<span
																						className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																						style={{
																							background:
																								sevStyle.bg,
																							color: sevStyle.color,
																						}}
																					>
																						{sev ===
																						'strict'
																							? 'Strict'
																							: sev ===
																								  'moderate'
																								? 'Moderate'
																								: 'Relaxed'}
																					</span>
																				</div>
																				<input
																					type="range"
																					min="50"
																					max="100"
																					step="1"
																					value={
																						r.val
																					}
																					onChange={(
																						e,
																					) =>
																						updateTolRule(
																							'text',
																							{
																								val: parseInt(
																									e
																										.target
																										.value,
																								),
																							},
																						)
																					}
																					className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#6A12CD] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(106,18,205,0.35)]"
																					style={{
																						background:
																							'linear-gradient(to right, rgba(15,110,86,0.18), rgba(183,137,0,0.18), rgba(220,38,38,0.18))',
																					}}
																				/>
																				<div className="flex justify-between mt-1">
																					<span
																						className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																						style={{
																							background:
																								'rgba(15,110,86,0.08)',
																							color: '#0F6E56',
																						}}
																					>
																						50%
																						Relaxed
																					</span>
																					<span
																						className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																						style={{
																							background:
																								'rgba(220,38,38,0.08)',
																							color: '#DC2626',
																						}}
																					>
																						100%
																						Strict
																					</span>
																				</div>
																			</div>
																			{/* Normalize pills */}
																			<div>
																				<p className="text-xs text-slate-500 font-medium mb-1.5">
																					Normalize
																					before
																					matching
																				</p>
																				<div className="flex flex-wrap gap-1.5">
																					{[
																						{
																							key: 'ignoreCase',
																							label: 'Ignore case',
																						},
																						{
																							key: 'trimSpaces',
																							label: 'Trim spaces',
																						},
																						{
																							key: 'stripSpecial',
																							label: 'Strip special chars',
																						},
																						{
																							key: 'removePrefixes',
																							label: 'Remove prefixes',
																						},
																					].map(
																						({
																							key,
																							label,
																						}) => {
																							const on =
																								r
																									.normalize[
																									key
																								];
																							return (
																								<button
																									key={
																										key
																									}
																									onClick={() =>
																										updateTolRule(
																											'text',
																											{
																												normalize:
																													{
																														...r.normalize,
																														[key]: !on,
																													},
																											},
																										)
																									}
																									className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] border transition-all"
																									style={
																										on
																											? {
																													background:
																														'rgba(106,18,205,0.06)',
																													color: '#6A12CD',
																													borderColor:
																														'rgba(106,18,205,0.2)',
																												}
																											: {
																													background:
																														'#fff',
																													color: '#94a3b8',
																													borderColor:
																														'#e2e8f0',
																												}
																									}
																								>
																									<span
																										className="w-1.5 h-1.5 rounded-full"
																										style={{
																											background:
																												on
																													? '#6A12CD'
																													: '#cbd5e1',
																										}}
																									/>
																									{
																										label
																									}
																								</button>
																							);
																						},
																					)}
																				</div>
																			</div>
																			<div
																				className="text-[11px] text-slate-400 leading-relaxed rounded-lg px-2.5 py-2"
																				style={{
																					background:
																						'rgba(106,18,205,0.03)',
																				}}
																			>
																				Handles
																				vendor
																				name
																				variations,
																				narration
																				mismatches,
																				and
																				description
																				differences
																				across
																				source
																				systems.
																			</div>
																		</div>
																	</div>
																)}
														</div>
													);
												})()}

												{/* ── Quantity Card ── */}
												{visibleBuiltins.includes('qty') &&
													(() => {
														const r = toleranceRules.qty;
														const sev =
															toleranceSeverity(
																'qty',
																r.val,
															);
														const sevStyle =
															sev === 'strict'
																? {
																		bg: 'rgba(220,38,38,0.08)',
																		color: '#DC2626',
																	}
																: sev === 'moderate'
																	? {
																			bg: 'rgba(183,137,0,0.08)',
																			color: '#B78900',
																		}
																	: {
																			bg: 'rgba(15,110,86,0.08)',
																			color: '#0F6E56',
																		};
														return (
															<div
																className={`border rounded-xl overflow-hidden transition-all ${r.enabled ? (r.expanded ? '' : 'border-slate-200/70') : 'border-slate-100 opacity-45'}`}
																style={
																	r.enabled &&
																	r.expanded
																		? {
																				borderColor:
																					'rgba(106,18,205,0.2)',
																			}
																		: {}
																}
															>
																<div
																	className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
																	onClick={() =>
																		r.enabled &&
																		updateTolRule(
																			'qty',
																			{
																				expanded:
																					!r.expanded,
																			},
																		)
																	}
																>
																	<div
																		className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
																		style={{
																			background:
																				'#FAEEDA',
																		}}
																	>
																		<Package
																			className="size-3.5"
																			style={{
																				color: '#854F0B',
																			}}
																		/>
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="text-[13px] font-medium text-slate-800">
																			Quantity
																		</div>
																		<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
																			<span className="text-[11px] text-slate-400">
																				{r.mode ===
																				'units'
																					? `\u00b1${r.unitVal} units`
																					: `\u00b1${r.val}%`}
																			</span>
																			<span
																				className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						sevStyle.bg,
																					color: sevStyle.color,
																				}}
																			>
																				{sev ===
																				'strict'
																					? 'Strict'
																					: sev ===
																						  'moderate'
																						? 'Moderate'
																						: 'Relaxed'}
																			</span>
																		</div>
																		{r.columns &&
																			r.enabled &&
																			!r.expanded && (
																				<div className="flex items-center gap-1 mt-1 flex-wrap">
																					<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																						<span
																							className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																							style={{
																								background:
																									dotColors[
																										r
																											.columns
																											.srcDot
																									],
																							}}
																						/>
																						{
																							r
																								.columns
																								.src
																						}
																					</span>
																					<span className="text-[9px] text-slate-300 font-semibold">
																						vs
																					</span>
																					<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																						<span
																							className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																							style={{
																								background:
																									dotColors[
																										r
																											.columns
																											.tgtDot
																									],
																							}}
																						/>
																						{
																							r
																								.columns
																								.tgt
																						}
																					</span>
																				</div>
																			)}
																	</div>
																	<ChevronRight
																		className={`size-3 text-slate-400 transition-transform ${r.expanded ? 'rotate-90' : ''}`}
																		style={
																			r.expanded
																				? {
																						color: '#6A12CD',
																					}
																				: {}
																		}
																	/>
																	<div
																		className="relative w-8 h-[18px] flex-shrink-0"
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																	>
																		<div
																			className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																			style={{
																				background:
																					r.enabled
																						? '#6A12CD'
																						: '#d1d5db',
																			}}
																			onClick={() =>
																				updateTolRule(
																					'qty',
																					{
																						enabled:
																							!r.enabled,
																						...(!r.enabled
																							? {}
																							: {
																									expanded: false,
																								}),
																					},
																				)
																			}
																		>
																			<div
																				className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${r.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																			/>
																		</div>
																	</div>
																</div>
																{r.enabled &&
																	r.expanded && (
																		<div className="px-3 pb-3 border-t border-slate-100">
																			<div className="pt-3 space-y-3">
																				{/* Column binding */}
																				{r.columns && (
																					<div>
																						<div className="flex items-center gap-1.5 mb-1.5">
																							<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
																								Applied
																								to
																							</span>
																							<span
																								className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
																								style={{
																									background:
																										'rgba(106,18,205,0.08)',
																									color: '#6A12CD',
																								}}
																							>
																								AI
																							</span>
																						</div>
																						<div
																							className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
																							style={{
																								background:
																									'#f7f7f5',
																							}}
																						>
																							<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																								<span
																									className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																									style={{
																										background:
																											dotColors[
																												r
																													.columns
																													.srcDot
																											],
																									}}
																								/>
																								{
																									r
																										.columns
																										.src
																								}
																							</span>
																							<span className="text-[9px] text-slate-400 font-semibold">
																								vs
																							</span>
																							<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																								<span
																									className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																									style={{
																										background:
																											dotColors[
																												r
																													.columns
																													.tgtDot
																											],
																									}}
																								/>
																								{
																									r
																										.columns
																										.tgt
																								}
																							</span>
																						</div>
																					</div>
																				)}
																				{/* Mode selector */}
																				<div className="flex rounded-lg border border-slate-200 overflow-hidden">
																					{[
																						'Percentage',
																						'Units',
																					].map(
																						(
																							m,
																						) => (
																							<button
																								key={
																									m
																								}
																								onClick={() =>
																									updateTolRule(
																										'qty',
																										{
																											mode: m.toLowerCase(),
																										},
																									)
																								}
																								className={`flex-1 py-1.5 text-[11px] font-medium transition-all ${r.mode !== m.toLowerCase() ? 'bg-white text-slate-400 hover:bg-slate-50' : ''}`}
																								style={
																									r.mode ===
																									m.toLowerCase()
																										? {
																												background:
																													'#6A12CD',
																												color: '#fff',
																											}
																										: {}
																								}
																							>
																								{
																									m
																								}
																							</button>
																						),
																					)}
																				</div>
																				{/* Percentage slider */}
																				{r.mode ===
																					'percentage' && (
																					<div>
																						<div className="flex items-center gap-2 mb-1.5">
																							<span
																								className="text-lg font-bold tabular-nums min-w-[40px]"
																								style={{
																									color: '#6A12CD',
																								}}
																							>
																								{
																									r.val
																								}
																								%
																							</span>
																							<span
																								className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																								style={{
																									background:
																										sevStyle.bg,
																									color: sevStyle.color,
																								}}
																							>
																								{sev ===
																								'strict'
																									? 'Strict'
																									: sev ===
																										  'moderate'
																										? 'Moderate'
																										: 'Relaxed'}
																							</span>
																						</div>
																						<input
																							type="range"
																							min="0"
																							max="10"
																							step="0.5"
																							value={
																								r.val
																							}
																							onChange={(
																								e,
																							) =>
																								updateTolRule(
																									'qty',
																									{
																										val: parseFloat(
																											e
																												.target
																												.value,
																										),
																									},
																								)
																							}
																							className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#6A12CD] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(106,18,205,0.35)]"
																							style={{
																								background:
																									'linear-gradient(to right, rgba(220,38,38,0.18), rgba(183,137,0,0.18), rgba(15,110,86,0.18))',
																							}}
																						/>
																						<div className="flex justify-between mt-1">
																							<span
																								className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																								style={{
																									background:
																										'rgba(220,38,38,0.08)',
																									color: '#DC2626',
																								}}
																							>
																								0%
																								Strict
																							</span>
																							<span
																								className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																								style={{
																									background:
																										'rgba(15,110,86,0.08)',
																									color: '#0F6E56',
																								}}
																							>
																								10%
																								Relaxed
																							</span>
																						</div>
																					</div>
																				)}
																				{/* Units stepper */}
																				{r.mode ===
																					'units' && (
																					<div>
																						<p className="text-xs text-slate-500 font-medium mb-2">
																							Maximum
																							allowed
																							unit
																							difference
																						</p>
																						<div className="flex items-center justify-center gap-1">
																							<button
																								onClick={() =>
																									updateTolRule(
																										'qty',
																										{
																											unitVal:
																												Math.max(
																													1,
																													r.unitVal -
																														1,
																												),
																										},
																									)
																								}
																								className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-lg"
																							>
																								{
																									'\u2212'
																								}
																							</button>
																							<span
																								className="text-2xl font-bold tabular-nums min-w-[44px] text-center"
																								style={{
																									color: '#6A12CD',
																								}}
																							>
																								{
																									r.unitVal
																								}
																							</span>
																							<button
																								onClick={() =>
																									updateTolRule(
																										'qty',
																										{
																											unitVal:
																												Math.min(
																													999,
																													r.unitVal +
																														1,
																												),
																										},
																									)
																								}
																								className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-lg"
																							>
																								+
																							</button>
																							<span className="text-[13px] text-slate-400 ml-1">
																								units
																							</span>
																							<span
																								className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2"
																								style={{
																									background:
																										sevStyle.bg,
																									color: sevStyle.color,
																								}}
																							>
																								{r.unitVal <=
																								5
																									? 'Strict'
																									: r.unitVal <=
																										  20
																										? 'Moderate'
																										: 'Relaxed'}
																							</span>
																						</div>
																						<div className="flex gap-1.5 mt-2">
																							{[
																								1,
																								5,
																								10,
																								25,
																								50,
																							].map(
																								(
																									v,
																								) => (
																									<button
																										key={
																											v
																										}
																										onClick={() =>
																											updateTolRule(
																												'qty',
																												{
																													unitVal:
																														v,
																												},
																											)
																										}
																										className="flex-1 py-1 text-[10px] font-medium rounded-md border transition-all"
																										style={
																											r.unitVal ===
																											v
																												? {
																														background:
																															'rgba(106,18,205,0.06)',
																														color: '#6A12CD',
																														borderColor:
																															'rgba(106,18,205,0.2)',
																													}
																												: {
																														background:
																															'#fff',
																														color: '#94a3b8',
																														borderColor:
																															'#e2e8f0',
																													}
																										}
																									>
																										{
																											v
																										}{' '}
																										units
																									</button>
																								),
																							)}
																						</div>
																					</div>
																				)}
																				{/* Compare across pills */}
																				<div>
																					<p className="text-xs text-slate-500 font-medium mb-1.5">
																						Compare
																						across
																					</p>
																					<div className="flex flex-wrap gap-1.5">
																						{[
																							{
																								key: 'ordered',
																								label: 'Ordered qty',
																							},
																							{
																								key: 'received',
																								label: 'Received qty',
																							},
																							{
																								key: 'invoiced',
																								label: 'Invoiced qty',
																							},
																							{
																								key: 'shipped',
																								label: 'Shipped qty',
																							},
																						].map(
																							({
																								key,
																								label,
																							}) => {
																								const on =
																									r
																										.compare[
																										key
																									];
																								return (
																									<button
																										key={
																											key
																										}
																										onClick={() =>
																											updateTolRule(
																												'qty',
																												{
																													compare:
																														{
																															...r.compare,
																															[key]: !on,
																														},
																												},
																											)
																										}
																										className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] border transition-all"
																										style={
																											on
																												? {
																														background:
																															'rgba(106,18,205,0.06)',
																														color: '#6A12CD',
																														borderColor:
																															'rgba(106,18,205,0.2)',
																													}
																												: {
																														background:
																															'#fff',
																														color: '#94a3b8',
																														borderColor:
																															'#e2e8f0',
																													}
																										}
																									>
																										<span
																											className="w-1.5 h-1.5 rounded-full"
																											style={{
																												background:
																													on
																														? '#6A12CD'
																														: '#cbd5e1',
																											}}
																										/>
																										{
																											label
																										}
																									</button>
																								);
																							},
																						)}
																					</div>
																				</div>
																				<div
																					className="text-[11px] text-slate-400 leading-relaxed rounded-lg px-2.5 py-2"
																					style={{
																						background:
																							'rgba(106,18,205,0.03)',
																					}}
																				>
																					Catches
																					discrepancies
																					in
																					three-way
																					match
																					(PO
																					vs
																					GRN
																					vs
																					Invoice)
																					and
																					inventory
																					reconciliation.
																				</div>
																			</div>
																		</div>
																	)}
															</div>
														);
													})()}
											</div>

											{/* ── Custom tolerance rules (added via picker/builder) ── */}
											{customTolRules.length > 0 && (
												<div className="px-2 pb-1 space-y-1.5">
													{customTolRules.map((cr, ci) => {
														const crStyle =
															tolTypeStyles[cr.cls] ||
															tolTypeStyles.custom;
														return (
															<div
																key={cr.id}
																className={`border rounded-xl overflow-hidden transition-all ${cr.enabled ? (cr.expanded ? '' : 'border-slate-200/70') : 'border-slate-100 opacity-45'}`}
																style={
																	cr.enabled &&
																	cr.expanded
																		? {
																				borderColor:
																					'rgba(106,18,205,0.2)',
																			}
																		: {}
																}
															>
																<div
																	className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
																	onClick={() =>
																		cr.enabled &&
																		setCustomTolRules(
																			(prev) =>
																				prev.map(
																					(
																						p,
																						pi,
																					) =>
																						pi ===
																						ci
																							? {
																									...p,
																									expanded:
																										!p.expanded,
																								}
																							: p,
																				),
																		)
																	}
																>
																	<div
																		className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
																		style={{
																			background:
																				crStyle.bg,
																			color: crStyle.color,
																		}}
																	>
																		{cr.icon}
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="text-[13px] font-medium text-slate-800">
																			{cr.name}
																		</div>
																		<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
																			<span className="text-[11px] text-slate-400">
																				{
																					cr.threshold
																				}
																			</span>
																			<span
																				className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						'rgba(183,137,0,0.08)',
																					color: '#B78900',
																				}}
																			>
																				Moderate
																			</span>
																		</div>
																		{cr.columns &&
																			!cr.expanded && (
																				<div className="flex items-center gap-1 mt-1 flex-wrap">
																					<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																						<span
																							className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																							style={{
																								background:
																									dotColors[
																										cr
																											.columns
																											.srcDot
																									],
																							}}
																						/>
																						{
																							cr
																								.columns
																								.src
																						}
																					</span>
																					<span className="text-[9px] text-slate-300 font-semibold">
																						vs
																					</span>
																					<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
																						<span
																							className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																							style={{
																								background:
																									dotColors[
																										cr
																											.columns
																											.tgtDot
																									],
																							}}
																						/>
																						{
																							cr
																								.columns
																								.tgt
																						}
																					</span>
																				</div>
																			)}
																	</div>
																	<ChevronRight
																		className={`size-3 text-slate-400 transition-transform ${cr.expanded ? 'rotate-90' : ''}`}
																		style={
																			cr.expanded
																				? {
																						color: '#6A12CD',
																					}
																				: {}
																		}
																	/>
																	<div
																		className="relative w-8 h-[18px] flex-shrink-0"
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																	>
																		<div
																			className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																			style={{
																				background:
																					cr.enabled
																						? '#6A12CD'
																						: '#d1d5db',
																			}}
																			onClick={() =>
																				setCustomTolRules(
																					(
																						prev,
																					) =>
																						prev.map(
																							(
																								p,
																								pi,
																							) =>
																								pi ===
																								ci
																									? {
																											...p,
																											enabled:
																												!p.enabled,
																											...(!p.enabled
																												? {}
																												: {
																														expanded: false,
																													}),
																										}
																									: p,
																						),
																				)
																			}
																		>
																			<div
																				className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${cr.enabled ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																			/>
																		</div>
																	</div>
																</div>
																{cr.enabled &&
																	cr.expanded && (
																		<div className="px-3 pb-3 border-t border-slate-100">
																			<div className="pt-3 space-y-3">
																				{cr.columns && (
																					<div>
																						<div className="flex items-center gap-1.5 mb-1.5">
																							<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
																								Applied
																								to
																							</span>
																						</div>
																						<div
																							className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
																							style={{
																								background:
																									'#f7f7f5',
																							}}
																						>
																							<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																								<span
																									className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																									style={{
																										background:
																											dotColors[
																												cr
																													.columns
																													.srcDot
																											],
																									}}
																								/>
																								{
																									cr
																										.columns
																										.src
																								}
																							</span>
																							<span className="text-[9px] text-slate-400 font-semibold">
																								vs
																							</span>
																							<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-slate-200/70 rounded px-2 py-1">
																								<span
																									className="w-[5px] h-[5px] rounded-full flex-shrink-0"
																									style={{
																										background:
																											dotColors[
																												cr
																													.columns
																													.tgtDot
																											],
																									}}
																								/>
																								{
																									cr
																										.columns
																										.tgt
																								}
																							</span>
																						</div>
																					</div>
																				)}
																				<div
																					className="text-[13px] font-semibold text-center py-2"
																					style={{
																						color: '#6A12CD',
																					}}
																				>
																					{
																						cr.threshold
																					}
																				</div>
																				<div
																					className="text-[11px] text-slate-400 leading-relaxed rounded-lg px-2.5 py-2"
																					style={{
																						background:
																							'rgba(106,18,205,0.03)',
																					}}
																				>
																					Custom
																					tolerance
																					rule
																					for{' '}
																					{cr.name.toLowerCase()}
																					.
																				</div>
																			</div>
																		</div>
																	)}
															</div>
														);
													})}
												</div>
											)}

											{/* ── Custom Builder (multi-step) ── */}
											{tolBuilderOpen && (
												<div
													className="mx-2 mb-2 border-[1.5px] rounded-xl overflow-hidden"
													style={{
														borderColor: '#6A12CD',
													}}
												>
													<div
														className="flex items-center gap-2.5 px-3.5 py-2.5 border-b"
														style={{
															background:
																'rgba(106,18,205,0.06)',
															borderColor:
																'rgba(106,18,205,0.15)',
														}}
													>
														<div
															className="w-7 h-7 rounded-lg flex items-center justify-center"
															style={{
																background:
																	'#6A12CD',
															}}
														>
															<Plus
																className="size-3"
																style={{
																	color: '#fff',
																}}
															/>
														</div>
														<span
															className="text-[13px] font-semibold flex-1"
															style={{
																color: '#26064A',
															}}
														>
															Build custom rule
														</span>
														<button
															onClick={() => {
																setTolBuilderOpen(
																	false,
																);
																setTolBuilderStep(1);
																setTolBuilderData({
																	type: null,
																	srcCol: null,
																	srcFile: null,
																	srcDot: null,
																	tgtCol: null,
																	tgtFile: null,
																	tgtDot: null,
																	threshold: null,
																	name: '',
																});
															}}
															className="text-sm text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded hover:bg-black/5 transition-all"
														>
															{'\u2715'}
														</button>
													</div>
													<div className="px-3.5 py-3">
														{/* Progress dots */}
														<div className="flex items-center gap-1.5 mb-3.5">
															{[1, 2, 3, 4].map(
																(s) => (
																	<Fragment
																		key={s}
																	>
																		<div
																			className="w-2 h-2 rounded-full transition-all"
																			style={
																				s <
																				tolBuilderStep
																					? {
																							background:
																								'#6A12CD',
																						}
																					: s ===
																						  tolBuilderStep
																						? {
																								background:
																									'#6A12CD',
																								boxShadow:
																									'0 0 0 3px rgba(106,18,205,0.15)',
																							}
																						: {
																								background:
																									'#e2e8f0',
																							}
																			}
																		/>
																		{s < 4 && (
																			<div
																				className="flex-1 h-px transition-colors"
																				style={{
																					background:
																						s <
																						tolBuilderStep
																							? '#6A12CD'
																							: '#e2e8f0',
																				}}
																			/>
																		)}
																	</Fragment>
																),
															)}
														</div>

														{/* Step 1: Type */}
														{tolBuilderStep === 1 && (
															<div>
																<div className="text-[13px] font-semibold text-slate-800 mb-1">
																	What type of
																	comparison?
																</div>
																<div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
																	This determines
																	how variance is
																	calculated
																	between columns.
																</div>
																<div className="grid grid-cols-2 gap-2">
																	{[
																		{
																			id: 'numeric',
																			icon: '123',
																			label: 'Numeric',
																			desc: '% or absolute difference',
																		},
																		{
																			id: 'date',
																			icon: null,
																			iconComp:
																				Calendar,
																			label: 'Date',
																			desc: 'Days between values',
																		},
																		{
																			id: 'text',
																			icon: 'Aa',
																			label: 'Text',
																			desc: 'Fuzzy similarity score',
																		},
																		{
																			id: 'exact',
																			icon: '==',
																			label: 'Exact match',
																			desc: 'Values must be identical',
																		},
																	].map((t) => (
																		<button
																			key={
																				t.id
																			}
																			onClick={() =>
																				setTolBuilderData(
																					(
																						prev,
																					) => ({
																						...prev,
																						type: t.id,
																						srcCol: null,
																						tgtCol: null,
																					}),
																				)
																			}
																			className="border rounded-lg p-2.5 text-center transition-all cursor-pointer"
																			style={
																				tolBuilderData.type ===
																				t.id
																					? {
																							borderColor:
																								'#6A12CD',
																							background:
																								'rgba(106,18,205,0.06)',
																							boxShadow:
																								'0 0 0 2px rgba(106,18,205,0.12)',
																						}
																					: {
																							borderColor:
																								'#e2e8f0',
																						}
																			}
																		>
																			<div className="text-lg mb-1">
																				{t.iconComp ? (
																					<t.iconComp className="size-5 mx-auto" />
																				) : (
																					t.icon
																				)}
																			</div>
																			<div className="text-[12px] font-semibold text-slate-800">
																				{
																					t.label
																				}
																			</div>
																			<div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
																				{
																					t.desc
																				}
																			</div>
																		</button>
																	))}
																</div>
															</div>
														)}

														{/* Step 2: Columns */}
														{tolBuilderStep === 2 &&
															(() => {
																const colData =
																	tolColumnsByType[
																		tolBuilderData
																			.type
																	] ||
																	tolColumnsByType.numeric;
																return (
																	<div>
																		<div className="text-[13px] font-semibold text-slate-800 mb-1">
																			Which
																			columns
																			to
																			compare?
																		</div>
																		<div className="text-[11px] text-slate-400 mb-3">
																			Pick one
																			source
																			and one
																			target
																			column.
																		</div>
																		<div className="space-y-3">
																			<div>
																				<div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
																					Source
																					column
																				</div>
																				{[
																					'src1',
																					'src2',
																				].map(
																					(
																						key,
																					) => {
																						const grp =
																							colData[
																								key
																							];
																						if (
																							!grp
																						)
																							return null;
																						return (
																							<div
																								key={
																									key
																								}
																								className="mb-2"
																							>
																								<div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-1">
																									<span
																										className="w-1.5 h-1.5 rounded-full"
																										style={{
																											background:
																												dotColors[
																													grp
																														.dot
																												],
																										}}
																									/>
																									{
																										grp.file
																									}
																								</div>
																								<div className="flex flex-wrap gap-1.5 pl-3">
																									{grp.cols.map(
																										(
																											c,
																										) => (
																											<button
																												key={
																													c
																												}
																												onClick={() =>
																													setTolBuilderData(
																														(
																															prev,
																														) => ({
																															...prev,
																															srcCol: c,
																															srcFile:
																																grp.file,
																															srcDot: grp.dot,
																														}),
																													)
																												}
																												className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all"
																												style={
																													tolBuilderData.srcCol ===
																													c
																														? {
																																borderColor:
																																	'#6A12CD',
																																background:
																																	'rgba(106,18,205,0.06)',
																																color: '#6A12CD',
																															}
																														: {
																																borderColor:
																																	'#e2e8f0',
																																color: '#64748b',
																															}
																												}
																											>
																												{
																													c
																												}
																											</button>
																										),
																									)}
																								</div>
																							</div>
																						);
																					},
																				)}
																			</div>
																			<div>
																				<div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
																					Target
																					column
																				</div>
																				{(() => {
																					const grp =
																						colData.tgt1;
																					return (
																						<div>
																							<div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-1">
																								<span
																									className="w-1.5 h-1.5 rounded-full"
																									style={{
																										background:
																											dotColors[
																												grp
																													.dot
																											],
																									}}
																								/>
																								{
																									grp.file
																								}
																							</div>
																							<div className="flex flex-wrap gap-1.5 pl-3">
																								{grp.cols.map(
																									(
																										c,
																									) => (
																										<button
																											key={
																												c
																											}
																											onClick={() =>
																												setTolBuilderData(
																													(
																														prev,
																													) => ({
																														...prev,
																														tgtCol: c,
																														tgtFile:
																															grp.file,
																														tgtDot: grp.dot,
																													}),
																												)
																											}
																											className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all"
																											style={
																												tolBuilderData.tgtCol ===
																												c
																													? {
																															borderColor:
																																'#6A12CD',
																															background:
																																'rgba(106,18,205,0.06)',
																															color: '#6A12CD',
																														}
																													: {
																															borderColor:
																																'#e2e8f0',
																															color: '#64748b',
																														}
																											}
																										>
																											{
																												c
																											}
																										</button>
																									),
																								)}
																							</div>
																						</div>
																					);
																				})()}
																			</div>
																		</div>
																	</div>
																);
															})()}

														{/* Step 3: Threshold */}
														{tolBuilderStep === 3 && (
															<div>
																<div className="text-[13px] font-semibold text-slate-800 mb-1">
																	{tolBuilderData.type ===
																	'exact'
																		? 'Exact match \u2014 no threshold needed'
																		: tolBuilderData.type ===
																			  'text'
																			? 'Minimum similarity score'
																			: tolBuilderData.type ===
																				  'date'
																				? 'Acceptable date gap'
																				: 'Acceptable numeric variance'}
																</div>
																<div className="text-[11px] text-slate-400 mb-3">
																	{tolBuilderData.type ===
																	'exact'
																		? `${tolBuilderData.srcCol} must equal ${tolBuilderData.tgtCol} exactly.`
																		: `How much can ${tolBuilderData.srcCol} differ from ${tolBuilderData.tgtCol}?`}
																</div>
																{tolBuilderData.type ===
																	'numeric' && (
																	<div>
																		<div className="flex items-center gap-2 mb-1.5">
																			<span
																				className="text-lg font-bold"
																				style={{
																					color: '#6A12CD',
																				}}
																			>
																				{tolBuilderData.threshold ||
																					'5%'}
																			</span>
																		</div>
																		<input
																			type="range"
																			min="0"
																			max="20"
																			step="0.5"
																			defaultValue="5"
																			onChange={(
																				e,
																			) =>
																				setTolBuilderData(
																					(
																						prev,
																					) => ({
																						...prev,
																						threshold:
																							e
																								.target
																								.value +
																							'%',
																					}),
																				)
																			}
																			className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#6A12CD] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(106,18,205,0.35)]"
																			style={{
																				background:
																					'linear-gradient(to right, rgba(220,38,38,0.18), rgba(183,137,0,0.18), rgba(15,110,86,0.18))',
																			}}
																		/>
																		<div className="flex justify-between mt-1">
																			<span
																				className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						'rgba(220,38,38,0.08)',
																					color: '#DC2626',
																				}}
																			>
																				0%
																				Strict
																			</span>
																			<span
																				className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						'rgba(15,110,86,0.08)',
																					color: '#0F6E56',
																				}}
																			>
																				20%
																				Relaxed
																			</span>
																		</div>
																	</div>
																)}
																{tolBuilderData.type ===
																	'date' && (
																	<div className="flex items-center justify-center gap-1">
																		<button
																			onClick={() =>
																				setTolBuilderData(
																					(
																						prev,
																					) => ({
																						...prev,
																						threshold:
																							'\u00b1' +
																							Math.max(
																								0,
																								parseInt(
																									(
																										prev.threshold ||
																										'\u00b13 days'
																									).match(
																										/\d+/,
																									)?.[0] ||
																										'3',
																								) -
																									1,
																							) +
																							' days',
																					}),
																				)
																			}
																			className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
																		>
																			{
																				'\u2212'
																			}
																		</button>
																		<span
																			className="text-2xl font-bold tabular-nums min-w-[44px] text-center"
																			style={{
																				color: '#6A12CD',
																			}}
																		>
																			{(
																				tolBuilderData.threshold ||
																				'\u00b13 days'
																			).match(
																				/\d+/,
																			)?.[0] ||
																				'3'}
																		</span>
																		<button
																			onClick={() =>
																				setTolBuilderData(
																					(
																						prev,
																					) => ({
																						...prev,
																						threshold:
																							'\u00b1' +
																							Math.min(
																								30,
																								parseInt(
																									(
																										prev.threshold ||
																										'\u00b13 days'
																									).match(
																										/\d+/,
																									)?.[0] ||
																										'3',
																								) +
																									1,
																							) +
																							' days',
																					}),
																				)
																			}
																			className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
																		>
																			+
																		</button>
																		<span className="text-[13px] text-slate-400 ml-1">
																			days
																		</span>
																	</div>
																)}
																{tolBuilderData.type ===
																	'text' && (
																	<div>
																		<div className="flex items-center gap-2 mb-1.5">
																			<span
																				className="text-lg font-bold"
																				style={{
																					color: '#6A12CD',
																				}}
																			>
																				{tolBuilderData.threshold ||
																					'\u226580%'}
																			</span>
																		</div>
																		<input
																			type="range"
																			min="50"
																			max="100"
																			step="1"
																			defaultValue="80"
																			onChange={(
																				e,
																			) =>
																				setTolBuilderData(
																					(
																						prev,
																					) => ({
																						...prev,
																						threshold:
																							'\u2265' +
																							e
																								.target
																								.value +
																							'%',
																					}),
																				)
																			}
																			className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#6A12CD] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(106,18,205,0.35)]"
																			style={{
																				background:
																					'linear-gradient(to right, rgba(15,110,86,0.18), rgba(183,137,0,0.18), rgba(220,38,38,0.18))',
																			}}
																		/>
																		<div className="flex justify-between mt-1">
																			<span
																				className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						'rgba(15,110,86,0.08)',
																					color: '#0F6E56',
																				}}
																			>
																				50%
																				Relaxed
																			</span>
																			<span
																				className="text-[10px] font-medium px-1.5 py-0.5 rounded"
																				style={{
																					background:
																						'rgba(220,38,38,0.08)',
																					color: '#DC2626',
																				}}
																			>
																				100%
																				Strict
																			</span>
																		</div>
																	</div>
																)}
																{tolBuilderData.type ===
																	'exact' && (
																	<div className="text-center py-4">
																		<span
																			className="text-2xl font-bold block mb-1"
																			style={{
																				color: '#6A12CD',
																			}}
																		>
																			= =
																		</span>
																		<span className="text-[12px] text-slate-500">
																			Values
																			must be
																			identical.
																			Any
																			difference{' '}
																			{
																				'\u2192'
																			}{' '}
																			Flag.
																		</span>
																	</div>
																)}
															</div>
														)}

														{/* Step 4: Name & confirm */}
														{tolBuilderStep === 4 && (
															<div>
																<div className="text-[13px] font-semibold text-slate-800 mb-1">
																	Name this rule
																</div>
																<div className="text-[11px] text-slate-400 mb-3">
																	Give it a label
																	your team will
																	recognize.
																</div>
																<input
																	type="text"
																	value={
																		tolBuilderData.name
																	}
																	onChange={(e) =>
																		setTolBuilderData(
																			(
																				prev,
																			) => ({
																				...prev,
																				name: e
																					.target
																					.value,
																			}),
																		)
																	}
																	placeholder={`e.g. ${tolBuilderData.srcCol} vs ${tolBuilderData.tgtCol}`}
																	className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-[rgba(106,18,205,0.4)] focus:shadow-[0_0_0_3px_rgba(106,18,205,0.08)] transition-all placeholder:text-slate-300"
																/>
																<div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
																	<Sparkles
																		className="size-2.5"
																		style={{
																			color: '#6A12CD',
																		}}
																	/>
																	<span>
																		Suggested:{' '}
																		{
																			tolBuilderData.srcCol
																		}{' '}
																		vs{' '}
																		{
																			tolBuilderData.tgtCol
																		}
																	</span>
																</div>
																<div
																	className="mt-3 rounded-lg p-3"
																	style={{
																		background:
																			'#f7f7f5',
																	}}
																>
																	<div className="flex items-center gap-2 text-[11px] py-1">
																		<span className="text-slate-400 min-w-[60px] font-medium">
																			Type
																		</span>
																		<span className="text-slate-700 font-medium">
																			{
																				{
																					numeric:
																						'Numeric difference',
																					date: 'Date gap',
																					text: 'Text similarity',
																					exact: 'Exact match',
																				}[
																					tolBuilderData
																						.type
																				]
																			}
																		</span>
																	</div>
																	<div className="flex items-center gap-2 text-[11px] py-1">
																		<span className="text-slate-400 min-w-[60px] font-medium">
																			Columns
																		</span>
																		<span className="text-slate-700 font-medium">
																			{
																				tolBuilderData.srcCol
																			}{' '}
																			vs{' '}
																			{
																				tolBuilderData.tgtCol
																			}
																		</span>
																	</div>
																	<div className="flex items-center gap-2 text-[11px] py-1">
																		<span className="text-slate-400 min-w-[60px] font-medium">
																			Threshold
																		</span>
																		<span className="text-slate-700 font-medium">
																			{tolBuilderData.threshold ||
																				(tolBuilderData.type ===
																				'exact'
																					? 'Exact'
																					: '\u00b15%')}
																		</span>
																	</div>
																</div>
															</div>
														)}

														{/* Footer */}
														<div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
															{tolBuilderStep > 1 && (
																<button
																	onClick={() =>
																		setTolBuilderStep(
																			(s) =>
																				s -
																				1,
																		)
																	}
																	className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
																>
																	Back
																</button>
															)}
															<span className="flex-1 text-center text-[11px] text-slate-400">
																Step {tolBuilderStep}{' '}
																of 4
															</span>
															<button
																className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
																style={{
																	background:
																		'#6A12CD',
																	color: '#fff',
																}}
																disabled={
																	(tolBuilderStep ===
																		1 &&
																		!tolBuilderData.type) ||
																	(tolBuilderStep ===
																		2 &&
																		(!tolBuilderData.srcCol ||
																			!tolBuilderData.tgtCol)) ||
																	(tolBuilderStep ===
																		4 &&
																		!tolBuilderData.name.trim())
																}
																onClick={() => {
																	if (
																		tolBuilderStep <
																		4
																	) {
																		if (
																			tolBuilderStep ===
																				2 &&
																			!tolBuilderData.threshold
																		) {
																			const defaults =
																				{
																					numeric:
																						'5%',
																					date: '\u00b13 days',
																					text: '\u226580%',
																					exact: 'Exact',
																				};
																			setTolBuilderData(
																				(
																					prev,
																				) => ({
																					...prev,
																					threshold:
																						defaults[
																							prev
																								.type
																						] ||
																						'5%',
																				}),
																			);
																		}
																		if (
																			tolBuilderStep ===
																				3 &&
																			!tolBuilderData.name
																		) {
																			setTolBuilderData(
																				(
																					prev,
																				) => ({
																					...prev,
																					name:
																						prev.srcCol +
																						' vs ' +
																						prev.tgtCol,
																				}),
																			);
																		}
																		setTolBuilderStep(
																			(s) =>
																				s +
																				1,
																		);
																	} else {
																		const d =
																			tolBuilderData;
																		const typeIcons =
																			{
																				numeric:
																					'123',
																				date: null,
																				text: 'Aa',
																				exact: '==',
																			};
																		setCustomTolRules(
																			(
																				prev,
																			) => [
																				...prev,
																				{
																					id:
																						'custom-' +
																						Date.now(),
																					name: d.name,
																					icon:
																						typeIcons[
																							d
																								.type
																						] ||
																						'?',
																					cls: 'custom',
																					threshold:
																						d.threshold ||
																						'Exact',
																					columns:
																						{
																							src: d.srcCol,
																							srcFile:
																								d.srcFile,
																							srcDot: d.srcDot,
																							tgt: d.tgtCol,
																							tgtFile:
																								d.tgtFile,
																							tgtDot: d.tgtDot,
																						},
																					enabled: true,
																					expanded: false,
																				},
																			],
																		);
																		setTolBuilderOpen(
																			false,
																		);
																		setTolBuilderStep(
																			1,
																		);
																		setTolBuilderData(
																			{
																				type: null,
																				srcCol: null,
																				srcFile:
																					null,
																				srcDot: null,
																				tgtCol: null,
																				tgtFile:
																					null,
																				tgtDot: null,
																				threshold:
																					null,
																				name: '',
																			},
																		);
																	}
																}}
															>
																{tolBuilderStep === 4
																	? 'Create rule'
																	: 'Next'}
															</button>
														</div>
													</div>
												</div>
											)}

											{/* ── Add Tolerance Parameter Picker ── */}
											{!tolBuilderOpen && (
												<div
													className="px-2 pb-2 relative"
													ref={tolPickerRef}
												>
													<button
														onClick={() => {
															setTolPickerOpen(
																!tolPickerOpen,
															);
															setTolPickerSearch('');
														}}
														className="w-full flex items-center justify-center gap-1.5 py-2.5 border-[1.5px] border-dashed rounded-xl text-[12px] font-medium transition-all"
														style={
															tolPickerOpen
																? {
																		borderColor:
																			'#6A12CD',
																		color: '#6A12CD',
																		background:
																			'rgba(106,18,205,0.04)',
																		borderStyle:
																			'solid',
																	}
																: {
																		borderColor:
																			'rgba(0,0,0,0.18)',
																		color: '#9a9a9a',
																	}
														}
													>
														<Plus
															className={`size-3 transition-transform ${tolPickerOpen ? 'rotate-45' : ''}`}
														/>
														{tolPickerOpen
															? 'Close'
															: 'Add tolerance parameter'}
													</button>
													{tolPickerOpen && (
														<div className="mt-2 border border-slate-200/70 rounded-xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
															<div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
																<Search className="size-3.5 text-slate-400" />
																<input
																	ref={
																		tolSearchRef
																	}
																	type="text"
																	value={
																		tolPickerSearch
																	}
																	onChange={(e) =>
																		setTolPickerSearch(
																			e.target
																				.value,
																		)
																	}
																	placeholder="Search parameters…"
																	className="flex-1 text-[12px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
																	autoFocus
																/>
															</div>
															{(() => {
																const filtered =
																	tolPresets.filter(
																		(p) =>
																			(!p.builtin ||
																				!visibleBuiltins.includes(
																					p.builtin,
																				)) &&
																			(!tolPickerSearch ||
																				p.name
																					.toLowerCase()
																					.includes(
																						tolPickerSearch.toLowerCase(),
																					) ||
																				p.desc
																					.toLowerCase()
																					.includes(
																						tolPickerSearch.toLowerCase(),
																					)),
																	);
																return filtered.length >
																	0 ? (
																	<div className="py-1.5 border-b border-slate-100">
																		<div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide px-3 py-1">
																			Preconfigured
																		</div>
																		{filtered.map(
																			(p) => (
																				<div
																					key={
																						p.id
																					}
																					className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors group"
																					onClick={() => {
																						if (
																							p.builtin
																						) {
																							setVisibleBuiltins(
																								(
																									prev,
																								) => [
																									...prev,
																									p.builtin,
																								],
																							);
																						} else {
																							setCustomTolRules(
																								(
																									prev,
																								) => [
																									...prev,
																									{
																										id:
																											p.id +
																											'-' +
																											Date.now(),
																										name: p.name,
																										icon: p.icon,
																										cls: p.cls,
																										threshold:
																											p.threshold,
																										columns:
																											p.columns,
																										enabled: true,
																										expanded: false,
																									},
																								],
																							);
																						}
																						setTolPickerOpen(
																							false,
																						);
																					}}
																				>
																					<div
																						className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
																						style={{
																							background:
																								(
																									tolTypeStyles[
																										p
																											.cls
																									] ||
																									tolTypeStyles.custom
																								)
																									.bg,
																							color: (
																								tolTypeStyles[
																									p
																										.cls
																								] ||
																								tolTypeStyles.custom
																							)
																								.color,
																						}}
																					>
																						{
																							p.icon
																						}
																					</div>
																					<div className="flex-1 min-w-0">
																						<div className="text-[12px] font-medium text-slate-700">
																							{
																								p.name
																							}
																							{p.tag && (
																								<span
																									className="text-[8px] font-semibold ml-1 px-1.5 py-0.5 rounded"
																									style={
																										p.tagType ===
																										'rec'
																											? {
																													background:
																														'rgba(106,18,205,0.08)',
																													color: '#6A12CD',
																												}
																											: {
																													background:
																														'#E1F5EE',
																													color: '#0F6E56',
																												}
																									}
																								>
																									{
																										p.tag
																									}
																								</span>
																							)}
																						</div>
																						<div className="text-[10px] text-slate-400 mt-0.5">
																							{
																								p.desc
																							}
																						</div>
																					</div>
																					<span
																						className="text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
																						style={{
																							background:
																								'rgba(106,18,205,0.08)',
																							color: '#6A12CD',
																						}}
																					>
																						Add
																					</span>
																				</div>
																			),
																		)}
																	</div>
																) : null;
															})()}
															<div
																className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-[rgba(106,18,205,0.04)] transition-colors border-t border-slate-100"
																style={{
																	background:
																		'#f7f7f5',
																}}
																onClick={() => {
																	setTolPickerOpen(
																		false,
																	);
																	setTolBuilderOpen(
																		true,
																	);
																	setTolBuilderStep(
																		1,
																	);
																	setTolBuilderData(
																		{
																			type: null,
																			srcCol: null,
																			srcFile:
																				null,
																			srcDot: null,
																			tgtCol: null,
																			tgtFile:
																				null,
																			tgtDot: null,
																			threshold:
																				null,
																			name: '',
																		},
																	);
																}}
															>
																<div
																	className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
																	style={{
																		background:
																			'#F5F0FF',
																		color: '#6A12CD',
																	}}
																>
																	<Pencil className="size-3" />
																</div>
																<div className="flex-1 min-w-0">
																	<div className="text-[12px] font-medium text-slate-700">
																		Custom rule
																	</div>
																	<div className="text-[10px] text-slate-400 mt-0.5">
																		Build your
																		own tolerance
																		parameter
																		from scratch
																	</div>
																</div>
																<span
																	className="text-[10px] font-medium px-2 py-1 rounded-md"
																	style={{
																		background:
																			'rgba(106,18,205,0.08)',
																		color: '#6A12CD',
																	}}
																>
																	Build
																</span>
															</div>
														</div>
													)}
												</div>
											)}

											{/* ── Impact Preview (only enabled rules) ── */}
											{toleranceActiveCount > 0 &&
												(() => {
													const impactSamples = [
														{
															a: '$12,450',
															b: '$12,200',
															pct: '2.0%',
															type: 'amt',
															typeLabel: 'Amt',
															diff: 2.0,
														},
														{
															a: 'Mar 15',
															b: 'Mar 19',
															pct: '4 days',
															type: 'date',
															typeLabel: 'Date',
															diff: 4,
														},
														{
															a: 'MSFT Corp',
															b: 'Microsoft',
															pct: '~72%',
															type: 'text',
															typeLabel: 'Text',
															diff: 72,
														},
														{
															a: '$8,920',
															b: '$9,500',
															pct: '6.1%',
															type: 'amt',
															typeLabel: 'Amt',
															diff: 6.1,
														},
														{
															a: '1,000',
															b: '996',
															pct: '0.4%',
															type: 'qty',
															typeLabel: 'Qty',
															diff: 0.4,
														},
														{
															a: '50',
															b: '43',
															pct: '14%',
															type: 'qty',
															typeLabel: 'Qty',
															diff: 14,
														},
													].filter(
														(s) =>
															toleranceRules[s.type]
																.enabled,
													);
													if (impactSamples.length === 0)
														return null;
													const typeColors = {
														amt: {
															bg: '#E1F5EE',
															color: '#0F6E56',
														},
														date: {
															bg: '#E6F1FB',
															color: '#185FA5',
														},
														text: {
															bg: '#EEEDFE',
															color: '#534AB7',
														},
														qty: {
															bg: '#FAEEDA',
															color: '#854F0B',
														},
													};
													return (
														<div className="px-3 pb-3">
															<div className="border-t border-slate-100 pt-3">
																<p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
																	Impact preview —
																	sample matches
																</p>
																<div className="space-y-0.5">
																	{impactSamples.map(
																		(
																			{
																				a,
																				b,
																				pct,
																				type,
																				typeLabel,
																				diff,
																			},
																			i,
																		) => {
																			const ruleData =
																				toleranceRules[
																					type
																				];
																			let status,
																				statusStyle;
																			if (
																				type ===
																				'amt'
																			) {
																				status =
																					diff <=
																					ruleData.val
																						? 'Pass'
																						: diff <=
																							  ruleData.val *
																									2
																							? 'Flag'
																							: 'Fail';
																			} else if (
																				type ===
																				'date'
																			) {
																				status =
																					diff <=
																					ruleData.val
																						? 'Pass'
																						: diff <=
																							  ruleData.val +
																									2
																							? 'Flag'
																							: 'Fail';
																			} else if (
																				type ===
																				'text'
																			) {
																				status =
																					diff >=
																					ruleData.val
																						? 'Pass'
																						: diff >=
																							  ruleData.val -
																									10
																							? 'Flag'
																							: 'Fail';
																			} else {
																				status =
																					diff <=
																					ruleData.val
																						? 'Pass'
																						: diff <=
																							  ruleData.val *
																									2
																							? 'Flag'
																							: 'Fail';
																			}
																			statusStyle =
																				status ===
																				'Pass'
																					? {
																							color: '#0F6E56',
																						}
																					: status ===
																						  'Flag'
																						? {
																								color: '#D97300',
																							}
																						: {
																								color: '#DC2626',
																							};
																			const tc =
																				typeColors[
																					type
																				];
																			return (
																				<div
																					key={
																						i
																					}
																					className="flex items-center gap-1.5 py-1.5 border-b border-slate-50 last:border-b-0"
																				>
																					<div className="flex-1 min-w-0 text-xs text-slate-500">
																						<span className="font-medium text-slate-700">
																							{
																								a
																							}
																						</span>
																						<span className="mx-1">
																							vs
																						</span>
																						<span className="font-medium text-slate-700">
																							{
																								b
																							}
																						</span>
																						<span className="text-slate-400 ml-1 text-[10px]">
																							{
																								pct
																							}
																						</span>
																					</div>
																					<span
																						className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded tracking-wide"
																						style={{
																							background:
																								tc.bg,
																							color: tc.color,
																						}}
																					>
																						{
																							typeLabel
																						}
																					</span>
																					<span
																						className="text-[11px] font-semibold min-w-[28px] text-right"
																						style={
																							statusStyle
																						}
																					>
																						{
																							status
																						}
																					</span>
																				</div>
																			);
																		},
																	)}
																</div>
															</div>
														</div>
													);
												})()}
										</div>

										{/* ═══ Notes ═══ */}
										<div
											onClick={() =>
												setChatContext(
													chatContext?.key ===
														'panel:notes'
														? null
														: {
																key: 'panel:notes',
																stepName:
																	'Notes & References',
																subtitle: `${inputNotes.length} refs`,
															},
												)
											}
											className={`bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
												chatContext?.key === 'panel:notes'
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
										>
											<div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-slate-100">
												<div
													className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
													style={{
														background:
															'rgba(106,18,205,0.08)',
														border: '1px solid rgba(106,18,205,0.16)',
													}}
												>
													<BookOpenText
														className="size-3.5"
														style={{ color: '#6A12CD' }}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<span className="text-sm font-semibold text-slate-800">
														Notes
													</span>
													<p className="text-[11px] text-slate-400 mt-0.5">
														Skill files and references
														for AI analysis
													</p>
												</div>
												<span
													className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
													style={{
														background:
															'rgba(106,18,205,0.08)',
														color: '#6A12CD',
													}}
												>
													{inputNotes.length} refs
												</span>
											</div>

											<div className="px-3 pb-3 space-y-2 pt-2">
												{inputNotes.map((note) => (
													<div
														key={note.id}
														className={`bg-[#FBFBFD] border rounded-lg p-2.5 transition-all ${
															enabledNotes[note.id]
																? 'border-violet-200'
																: 'border-slate-200/60'
														}`}
													>
														<div className="flex items-start gap-2.5">
															<div
																className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
																	enabledNotes[
																		note.id
																	]
																		? 'bg-violet-100 border border-violet-200'
																		: 'bg-white border border-slate-200/70'
																}`}
															>
																<BookOpenText
																	className={`size-3.5 ${enabledNotes[note.id] ? 'text-violet-600' : 'text-slate-400'}`}
																/>
															</div>
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-1.5">
																	<span className="text-sm font-semibold text-slate-800 truncate">
																		{note.name}
																	</span>
																	{note.aiSuggested && (
																		<span className="text-xs font-bold px-1 py-0.5 rounded bg-violet-100 text-violet-600 border border-violet-200 leading-none">
																			AI
																		</span>
																	)}
																</div>
																<p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
																	{
																		note.description
																	}
																</p>
															</div>
															<div className="relative w-8 h-[18px] flex-shrink-0 mt-0.5">
																<div
																	className="w-8 h-[18px] rounded-full transition-colors cursor-pointer"
																	style={{
																		background:
																			enabledNotes[
																				note
																					.id
																			]
																				? '#6A12CD'
																				: '#d1d5db',
																	}}
																	onClick={() =>
																		setEnabledNotes(
																			(p) => ({
																				...p,
																				[note.id]:
																					!p[
																						note
																							.id
																					],
																			}),
																		)
																	}
																>
																	<div
																		className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${enabledNotes[note.id] ? 'translate-x-[17px]' : 'translate-x-[2px]'}`}
																	/>
																</div>
															</div>
														</div>
													</div>
												))}

												{/* AI Suggestions */}
												{aiSuggestions.length > 0 && (
													<div className="bg-violet-50/50 border border-violet-100 rounded-lg p-2.5">
														<div className="flex items-center gap-1.5 mb-1.5">
															<Lightbulb className="size-3 text-violet-500" />
															<span className="text-xs font-bold text-violet-700">
																AI Suggestions
															</span>
														</div>
														<div className="space-y-1">
															{aiSuggestions.map(
																(suggestion, i) => (
																	<div
																		key={i}
																		onClick={() => {
																			const newId = `n${Date.now()}`;
																			setInputNotes(
																				(
																					prev,
																				) => [
																					...prev,
																					{
																						id: newId,
																						name: suggestion,
																						type: 'reference',
																						description:
																							'AI-suggested reference note',
																						aiSuggested: true,
																					},
																				],
																			);
																			setEnabledNotes(
																				(
																					prev,
																				) => ({
																					...prev,
																					[newId]: true,
																				}),
																			);
																			setAiSuggestions(
																				(
																					prev,
																				) =>
																					prev.filter(
																						(
																							_,
																							idx,
																						) =>
																							idx !==
																							i,
																					),
																			);
																		}}
																		className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/70 border border-violet-100 cursor-pointer hover:bg-white hover:border-violet-300 transition-all group active:scale-[0.98]"
																	>
																		<Plus className="size-3 text-violet-400 group-hover:text-violet-600 transition-colors" />
																		<span className="text-xs text-violet-600 group-hover:text-violet-700 transition-colors">
																			{
																				suggestion
																			}
																		</span>
																	</div>
																),
															)}
														</div>
													</div>
												)}

												{/* Add Note inline form */}
												{addingNote ? (
													<div className="border border-violet-200 rounded-lg p-3 bg-violet-50/30 space-y-2">
														<input
															ref={addNoteInputRef}
															type="text"
															placeholder="Note title"
															value={newNoteName}
															onChange={(e) =>
																setNewNoteName(
																	e.target.value,
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	'Escape'
																) {
																	setAddingNote(
																		false,
																	);
																	setNewNoteName(
																		'',
																	);
																	setNewNoteDesc(
																		'',
																	);
																}
															}}
															className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-300 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 transition-all"
														/>
														<input
															type="text"
															placeholder="Short description (optional)"
															value={newNoteDesc}
															onChange={(e) =>
																setNewNoteDesc(
																	e.target.value,
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																		'Enter' &&
																	newNoteName.trim()
																) {
																	const newId = `n${Date.now()}`;
																	setInputNotes(
																		(prev) => [
																			...prev,
																			{
																				id: newId,
																				name: newNoteName.trim(),
																				type: 'reference',
																				description:
																					newNoteDesc.trim() ||
																					'Custom reference note',
																				aiSuggested: false,
																			},
																		],
																	);
																	setEnabledNotes(
																		(prev) => ({
																			...prev,
																			[newId]: true,
																		}),
																	);
																	setNewNoteName(
																		'',
																	);
																	setNewNoteDesc(
																		'',
																	);
																	setAddingNote(
																		false,
																	);
																}
																if (
																	e.key ===
																	'Escape'
																) {
																	setAddingNote(
																		false,
																	);
																	setNewNoteName(
																		'',
																	);
																	setNewNoteDesc(
																		'',
																	);
																}
															}}
															className="w-full text-xs text-slate-600 placeholder:text-slate-300 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 transition-all"
														/>
														<div className="flex items-center gap-2 pt-0.5">
															<button
																onClick={() => {
																	if (
																		newNoteName.trim()
																	) {
																		const newId = `n${Date.now()}`;
																		setInputNotes(
																			(
																				prev,
																			) => [
																				...prev,
																				{
																					id: newId,
																					name: newNoteName.trim(),
																					type: 'reference',
																					description:
																						newNoteDesc.trim() ||
																						'Custom reference note',
																					aiSuggested: false,
																				},
																			],
																		);
																		setEnabledNotes(
																			(
																				prev,
																			) => ({
																				...prev,
																				[newId]: true,
																			}),
																		);
																		setNewNoteName(
																			'',
																		);
																		setNewNoteDesc(
																			'',
																		);
																		setAddingNote(
																			false,
																		);
																	}
																}}
																disabled={
																	!newNoteName.trim()
																}
																className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
															>
																<Check className="size-3" />
																Add
															</button>
															<button
																onClick={() => {
																	setAddingNote(
																		false,
																	);
																	setNewNoteName(
																		'',
																	);
																	setNewNoteDesc(
																		'',
																	);
																}}
																className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
															>
																Cancel
															</button>
														</div>
													</div>
												) : (
													<button
														onClick={() => {
															setAddingNote(true);
															setTimeout(
																() =>
																	addNoteInputRef.current?.focus(),
																50,
															);
														}}
														className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/30 transition-all"
													>
														<Plus className="size-3" />
														Add Note
													</button>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Output Config */}
								{rightTab === 'output' && workflow && (
									<div className="space-y-5">
										{/* Dashboard KPIs */}
										<div
											onClick={() =>
												setChatContext(
													chatContext?.key === 'panel:kpis'
														? null
														: {
																key: 'panel:kpis',
																stepName:
																	'Dashboard KPIs',
																subtitle: `${Object.values(kpiChecks).filter(Boolean).length} KPIs enabled`,
															},
												)
											}
											className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
												chatContext?.key === 'panel:kpis'
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
										>
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

										{/* Output Layout */}
										<div
											onClick={() =>
												setChatContext(
													chatContext?.key ===
														'panel:output_layout'
														? null
														: {
																key: 'panel:output_layout',
																stepName:
																	'Output Layout',
																subtitle:
																	outputLayout
																		.charAt(0)
																		.toUpperCase() +
																	outputLayout.slice(
																		1,
																	),
															},
												)
											}
											className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
												chatContext?.key ===
												'panel:output_layout'
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
										>
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
														key: 'summary',
														label: 'Summary',
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

											{/* Output Layout Preview */}
											<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 overflow-hidden">
												{outputLayout === 'dashboard' && (
													<svg
														viewBox="0 0 280 160"
														className="w-full"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<rect
															width="280"
															height="160"
															fill="#F8FAFC"
														/>
														{/* KPI Cards Row */}
														<rect
															x="12"
															y="10"
															width="58"
															height="32"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="18"
															y="16"
															width="28"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<rect
															x="18"
															y="24"
															width="20"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="18"
															y="34"
															width="14"
															height="3"
															rx="1.5"
															fill="#D1FAE5"
														/>
														<rect
															x="78"
															y="10"
															width="58"
															height="32"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="84"
															y="16"
															width="28"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<rect
															x="84"
															y="24"
															width="24"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="84"
															y="34"
															width="14"
															height="3"
															rx="1.5"
															fill="#FEE2E2"
														/>
														<rect
															x="144"
															y="10"
															width="58"
															height="32"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="150"
															y="16"
															width="28"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<rect
															x="150"
															y="24"
															width="18"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="150"
															y="34"
															width="14"
															height="3"
															rx="1.5"
															fill="#D1FAE5"
														/>
														<rect
															x="210"
															y="10"
															width="58"
															height="32"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="216"
															y="16"
															width="28"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<rect
															x="216"
															y="24"
															width="22"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="216"
															y="34"
															width="14"
															height="3"
															rx="1.5"
															fill="#D1FAE5"
														/>
														{/* Chart Area */}
														<rect
															x="12"
															y="50"
															width="160"
															height="100"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="20"
															y="56"
															width="40"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<polyline
															points="24,130 50,110 76,118 102,95 128,105 154,85"
															stroke="#7C3AED"
															strokeWidth="2"
															fill="none"
															strokeLinecap="round"
														/>
														<polyline
															points="24,130 50,120 76,125 102,108 128,115 154,100"
															stroke="#C4B5FD"
															strokeWidth="1.5"
															fill="none"
															strokeLinecap="round"
															strokeDasharray="4 3"
														/>
														{/* Side Panel */}
														<rect
															x="180"
															y="50"
															width="88"
															height="46"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="188"
															y="56"
															width="36"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<circle
															cx="198"
															cy="80"
															r="12"
															fill="none"
															stroke="#7C3AED"
															strokeWidth="3"
															strokeDasharray="50 25"
															strokeLinecap="round"
														/>
														<circle
															cx="198"
															cy="80"
															r="12"
															fill="none"
															stroke="#C4B5FD"
															strokeWidth="3"
															strokeDasharray="25 50"
															strokeDashoffset="-50"
															strokeLinecap="round"
														/>
														<rect
															x="180"
															y="104"
															width="88"
															height="46"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														<rect
															x="188"
															y="110"
															width="36"
															height="4"
															rx="2"
															fill="#CBD5E1"
														/>
														<rect
															x="188"
															y="120"
															width="72"
															height="6"
															rx="3"
															fill="#F1F5F9"
														/>
														<rect
															x="188"
															y="120"
															width="50"
															height="6"
															rx="3"
															fill="#7C3AED"
															opacity="0.7"
														/>
														<rect
															x="188"
															y="130"
															width="72"
															height="6"
															rx="3"
															fill="#F1F5F9"
														/>
														<rect
															x="188"
															y="130"
															width="35"
															height="6"
															rx="3"
															fill="#C4B5FD"
															opacity="0.7"
														/>
														<rect
															x="188"
															y="140"
															width="72"
															height="6"
															rx="3"
															fill="#F1F5F9"
														/>
														<rect
															x="188"
															y="140"
															width="58"
															height="6"
															rx="3"
															fill="#7C3AED"
															opacity="0.5"
														/>
													</svg>
												)}
												{outputLayout === 'summary' && (
													<svg
														viewBox="0 0 280 180"
														className="w-full"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<rect
															width="280"
															height="180"
															fill="#F8FAFC"
														/>
														{/* Card */}
														<rect
															x="10"
															y="8"
															width="260"
															height="164"
															rx="8"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														{/* Title */}
														<rect
															x="22"
															y="18"
															width="70"
															height="6"
															rx="3"
															fill="#7C3AED"
														/>
														<rect
															x="22"
															y="28"
															width="40"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														{/* Divider */}
														<line
															x1="22"
															y1="38"
															x2="258"
															y2="38"
															stroke="#F1F5F9"
															strokeWidth="1"
														/>
														{/* Key Findings Section */}
														<rect
															x="22"
															y="46"
															width="48"
															height="4"
															rx="2"
															fill="#94A3B8"
														/>
														{/* Finding 1 */}
														<circle
															cx="30"
															cy="60"
															r="3"
															fill="#EDE9FE"
														/>
														<rect
															x="26"
															y="57.5"
															width="8"
															height="5"
															rx="2.5"
															fill="none"
														/>
														<text
															x="30"
															y="62"
															textAnchor="middle"
															fill="#7C3AED"
															fontSize="5"
															fontWeight="bold"
														>
															1
														</text>
														<rect
															x="40"
															y="57"
															width="180"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="40"
															y="63"
															width="140"
															height="3"
															rx="1.5"
															fill="#E2E8F0"
														/>
														{/* Finding 2 */}
														<circle
															cx="30"
															cy="78"
															r="3"
															fill="#EDE9FE"
														/>
														<text
															x="30"
															y="80"
															textAnchor="middle"
															fill="#7C3AED"
															fontSize="5"
															fontWeight="bold"
														>
															2
														</text>
														<rect
															x="40"
															y="75"
															width="160"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="40"
															y="81"
															width="120"
															height="3"
															rx="1.5"
															fill="#E2E8F0"
														/>
														{/* Finding 3 */}
														<circle
															cx="30"
															cy="96"
															r="3"
															fill="#EDE9FE"
														/>
														<text
															x="30"
															y="98"
															textAnchor="middle"
															fill="#7C3AED"
															fontSize="5"
															fontWeight="bold"
														>
															3
														</text>
														<rect
															x="40"
															y="93"
															width="190"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="40"
															y="99"
															width="150"
															height="3"
															rx="1.5"
															fill="#E2E8F0"
														/>
														{/* Divider */}
														<line
															x1="22"
															y1="112"
															x2="258"
															y2="112"
															stroke="#F1F5F9"
															strokeWidth="1"
														/>
														{/* Stats Row */}
														<rect
															x="22"
															y="120"
															width="68"
															height="36"
															rx="6"
															fill="#F8FAFC"
															stroke="#E2E8F0"
															strokeWidth="0.5"
														/>
														<rect
															x="32"
															y="127"
															width="30"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="32"
															y="134"
															width="22"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="32"
															y="144"
															width="16"
															height="3"
															rx="1.5"
															fill="#D1FAE5"
														/>
														<rect
															x="100"
															y="120"
															width="68"
															height="36"
															rx="6"
															fill="#F8FAFC"
															stroke="#E2E8F0"
															strokeWidth="0.5"
														/>
														<rect
															x="110"
															y="127"
															width="30"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="110"
															y="134"
															width="18"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="110"
															y="144"
															width="16"
															height="3"
															rx="1.5"
															fill="#FEE2E2"
														/>
														<rect
															x="178"
															y="120"
															width="68"
															height="36"
															rx="6"
															fill="#F8FAFC"
															stroke="#E2E8F0"
															strokeWidth="0.5"
														/>
														<rect
															x="188"
															y="127"
															width="30"
															height="3"
															rx="1.5"
															fill="#CBD5E1"
														/>
														<rect
															x="188"
															y="134"
															width="24"
															height="6"
															rx="2"
															fill="#7C3AED"
														/>
														<rect
															x="188"
															y="144"
															width="16"
															height="3"
															rx="1.5"
															fill="#D1FAE5"
														/>
													</svg>
												)}
												{outputLayout === 'table' && (
													<svg
														viewBox="0 0 280 160"
														className="w-full"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<rect
															width="280"
															height="160"
															fill="#F8FAFC"
														/>
														{/* Table Container */}
														<rect
															x="8"
															y="8"
															width="264"
															height="144"
															rx="6"
															fill="white"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														{/* Header Row */}
														<rect
															x="8"
															y="8"
															width="264"
															height="22"
															rx="6"
															fill="#F8FAFC"
														/>
														<rect
															x="16"
															y="15"
															width="8"
															height="8"
															rx="2"
															fill="#E2E8F0"
															stroke="#CBD5E1"
															strokeWidth="1"
														/>
														<rect
															x="32"
															y="16"
															width="32"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<rect
															x="80"
															y="16"
															width="28"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<rect
															x="124"
															y="16"
															width="36"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<rect
															x="176"
															y="16"
															width="24"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<rect
															x="216"
															y="16"
															width="20"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<rect
															x="248"
															y="16"
															width="16"
															height="5"
															rx="2.5"
															fill="#94A3B8"
														/>
														<line
															x1="8"
															y1="30"
															x2="272"
															y2="30"
															stroke="#E2E8F0"
															strokeWidth="1"
														/>
														{/* Data Rows */}
														{[
															38, 54, 70, 86, 102, 118,
															134,
														].map((y, i) => (
															<g key={y}>
																<rect
																	x="16"
																	y={y}
																	width="8"
																	height="8"
																	rx="2"
																	fill={
																		i < 3
																			? '#EDE9FE'
																			: 'white'
																	}
																	stroke={
																		i < 3
																			? '#7C3AED'
																			: '#E2E8F0'
																	}
																	strokeWidth="1"
																/>
																{i < 3 && (
																	<polyline
																		points={`${18},${y + 4.5} ${19.5},${y + 6} ${22},${y + 2.5}`}
																		stroke="#7C3AED"
																		strokeWidth="1.5"
																		fill="none"
																		strokeLinecap="round"
																		strokeLinejoin="round"
																	/>
																)}
																<rect
																	x="32"
																	y={y + 2}
																	width={
																		28 +
																		(i % 3) * 6
																	}
																	height="4"
																	rx="2"
																	fill="#CBD5E1"
																/>
																<rect
																	x="80"
																	y={y + 2}
																	width={
																		20 +
																		(i % 2) * 8
																	}
																	height="4"
																	rx="2"
																	fill="#CBD5E1"
																/>
																<rect
																	x="124"
																	y={y + 2}
																	width={
																		24 +
																		(i % 4) * 4
																	}
																	height="4"
																	rx="2"
																	fill="#CBD5E1"
																/>
																<rect
																	x="176"
																	y={y + 2}
																	width="20"
																	height="4"
																	rx="2"
																	fill="#CBD5E1"
																/>
																<rect
																	x="216"
																	y={y + 2}
																	width="16"
																	height="4"
																	rx="2"
																	fill={
																		i % 2 === 0
																			? '#D1FAE5'
																			: '#FEE2E2'
																	}
																/>
																<rect
																	x="248"
																	y={y + 2}
																	width="12"
																	height="4"
																	rx="2"
																	fill="#CBD5E1"
																/>
																{y < 134 && (
																	<line
																		x1="16"
																		y1={y + 14}
																		x2="264"
																		y2={y + 14}
																		stroke="#F1F5F9"
																		strokeWidth="1"
																	/>
																)}
															</g>
														))}
													</svg>
												)}
											</div>
										</div>

										{/* Delivery & Routing */}
										<div
											onClick={() =>
												setChatContext(
													chatContext?.key ===
														'panel:delivery'
														? null
														: {
																key: 'panel:delivery',
																stepName:
																	'Delivery & Routing',
																subtitle: `${Object.values(deliveryChannels).filter((c) => c.enabled).length} channels active`,
															},
												)
											}
											className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
												chatContext?.key === 'panel:delivery'
													? 'border-[#6A12CD] ring-2 ring-[rgba(106,18,205,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(106,18,205,0.12)]'
													: 'border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] hover:border-violet-200'
											}`}
										>
											<div className="flex items-center gap-2 mb-3">
												<Send className="size-3.5 text-violet-600" />
												<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
													Delivery & Routing
												</p>
												<span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
													NEW
												</span>
											</div>

											{/* AI tip banner */}
											<div className="flex items-start gap-2 rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5 mb-4">
												<Sparkles className="size-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
												<p className="text-xs text-violet-700 leading-relaxed">
													Most AP teams route critical
													findings to Slack and email a
													summary to leadership. Configure
													once, auto-deliver on every run.
												</p>
											</div>

											{/* Channel label */}
											<p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
												After execution, send results to:
											</p>

											{/* Channel pills */}
											<div
												className="flex flex-wrap gap-2 mb-4"
												onClick={(e) => e.stopPropagation()}
											>
												{[
													{
														key: 'email',
														label: 'Email digest',
														icon: Mail,
													},
													{
														key: 'slack',
														label: 'Slack channel',
														icon: MessageSquare,
													},
													{
														key: 'erp',
														label: 'ERP push',
														icon: Database,
													},
													{
														key: 'webhook',
														label: 'Webhook',
														icon: Globe,
													},
													{
														key: 'csv',
														label: 'Auto-export CSV',
														icon: FileSpreadsheet,
													},
												].map(
													({ key, label, icon: Icon }) => (
														<button
															key={key}
															onClick={() =>
																setDeliveryChannels(
																	(p) => ({
																		...p,
																		[key]: {
																			...p[
																				key
																			],
																			enabled:
																				!p[
																					key
																				]
																					.enabled,
																		},
																	}),
																)
															}
															className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
																deliveryChannels[key]
																	.enabled
																	? 'bg-violet-50 text-violet-700 border-violet-300'
																	: 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
															}`}
														>
															<Icon className="size-3.5" />
															{label}
														</button>
													),
												)}
											</div>

											{/* Expanded channel config */}
											{Object.entries(deliveryChannels)
												.filter(([, v]) => v.enabled)
												.map(([key, channel]) => {
													const channelMeta = {
														email: {
															label: 'Email digest',
															icon: Mail,
															placeholder:
																'finance-team@company.com',
														},
														slack: {
															label: 'Slack channel',
															icon: MessageSquare,
															placeholder:
																'#ap-alerts',
														},
														erp: {
															label: 'ERP push',
															icon: Database,
															placeholder:
																'SAP endpoint URL',
														},
														webhook: {
															label: 'Webhook',
															icon: Globe,
															placeholder:
																'https://hooks.example.com/...',
														},
														csv: {
															label: 'Auto-export CSV',
															icon: FileSpreadsheet,
															placeholder:
																'/shared/exports/',
														},
													};
													const meta = channelMeta[key];
													const isExpanded =
														expandedChannel === key;
													return (
														<div
															key={key}
															className="border border-slate-200 rounded-lg mb-2 overflow-hidden"
															onClick={(e) =>
																e.stopPropagation()
															}
														>
															<button
																onClick={() =>
																	setExpandedChannel(
																		isExpanded
																			? null
																			: key,
																	)
																}
																className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
															>
																<meta.icon className="size-3.5 text-slate-500" />
																<span className="text-sm font-medium text-slate-700">
																	{meta.label}
																</span>
																<ChevronDown
																	className={`size-3.5 text-slate-400 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
																/>
															</button>
															{isExpanded && (
																<div className="px-3 pb-3 space-y-2.5 border-t border-slate-100 pt-2.5">
																	<div>
																		<label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
																			To:
																		</label>
																		<input
																			type="text"
																			value={
																				channel.to
																			}
																			onChange={(
																				e,
																			) =>
																				setDeliveryChannels(
																					(
																						p,
																					) => ({
																						...p,
																						[key]: {
																							...p[
																								key
																							],
																							to: e
																								.target
																								.value,
																						},
																					}),
																				)
																			}
																			placeholder={
																				meta.placeholder
																			}
																			className="w-full mt-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
																		/>
																	</div>
																	<div>
																		<label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
																			Send:
																		</label>
																		<div className="flex gap-1.5 mt-1">
																			{[
																				{
																					value: 'every',
																					label: 'Every run',
																				},
																				{
																					value: 'critical',
																					label: 'Only if critical',
																				},
																				{
																					value: 'daily',
																					label: 'Daily digest',
																				},
																			].map(
																				(
																					opt,
																				) => (
																					<button
																						key={
																							opt.value
																						}
																						onClick={() =>
																							setDeliveryChannels(
																								(
																									p,
																								) => ({
																									...p,
																									[key]: {
																										...p[
																											key
																										],
																										frequency:
																											opt.value,
																									},
																								}),
																							)
																						}
																						className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
																							channel.frequency ===
																							opt.value
																								? 'bg-violet-50 text-violet-700 border-violet-300 font-medium'
																								: 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
																						}`}
																					>
																						{
																							opt.label
																						}
																					</button>
																				),
																			)}
																		</div>
																	</div>
																</div>
															)}
														</div>
													);
												})}
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

			{/* Choose Existing Data Source modal */}
			{chooseExistingOpen && (
				<div
					className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
					onClick={() => setChooseExistingOpen(false)}
				>
					<div
						className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">
									Choose Data Source
								</h2>
								<p className="text-sm text-gray-400 mt-0.5">
									You can always change it later from the data
									source page
								</p>
							</div>
							<button
								onClick={() => setChooseExistingOpen(false)}
								className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
							>
								<X className="size-5" />
							</button>
						</div>

						{/* Search */}
						<div className="px-6 py-4 border-b border-gray-100">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search"
									value={chooseExistingSearch}
									onChange={(e) =>
										setChooseExistingSearch(e.target.value)
									}
									className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
								/>
							</div>
						</div>

						{/* List */}
						<div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
							{modalDsLoading ? (
								<div className="space-y-3">
									{Array.from({ length: 4 }).map((_, i) => (
										<div
											key={i}
											className="h-14 bg-gray-100 animate-pulse rounded-lg"
										/>
									))}
								</div>
							) : modalFilteredDs.length === 0 ? (
								<p className="text-center py-8 text-sm text-gray-400">
									No data sources found
								</p>
							) : (
								<>
									{modalFilteredDs.map((ds) => {
										const isProcessing = ds.status !== 'active';
										const isSelected = selectedDsSources.some(
											(s) =>
												s.datasource_id === ds.datasource_id,
										);
										return (
											<div
												key={ds.datasource_id}
												onClick={() =>
													!isProcessing &&
													toggleDsSource(ds)
												}
												className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
													isProcessing
														? 'opacity-50 cursor-not-allowed border-gray-100'
														: isSelected
															? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
															: 'border-gray-200 hover:bg-violet-50 hover:border-violet-200'
												}`}
											>
												<Database className="size-5 text-violet-500 flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-gray-900 truncate">
														{ds.name}
													</p>
												</div>
												<div className="flex-shrink-0">
													<div
														className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
															isSelected
																? 'border-violet-600 bg-violet-600'
																: 'border-gray-300'
														}`}
													>
														{isSelected && (
															<Check className="size-3 text-white" />
														)}
													</div>
												</div>
											</div>
										);
									})}
									<ModalDsSentinel />
									{modalFetchingNext && (
										<p className="text-sm text-center text-gray-400 py-2">
											Loading more...
										</p>
									)}
								</>
							)}
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
							<button
								onClick={() => setChooseExistingOpen(false)}
								className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={() => setChooseExistingOpen(false)}
								disabled={selectedDsSources.length === 0}
								className="px-5 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								Continue
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
