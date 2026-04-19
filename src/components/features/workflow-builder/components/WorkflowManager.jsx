import { useState } from 'react';
import {
	Settings2,
	Users,
	Shield,
	Clock,
	Bell,
	GitCompareArrows,
	ChevronDown,
	Plus,
	X,
	Check,
	AlertTriangle,
	Calendar,
	Trash2,
	Archive,
	Eye,
	History,
	Zap,
	Mail,
	Save,
	RefreshCw,
	Info,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

/* ── constants ─────────────────────────────────────────── */

const WORKFLOW_TYPES = [
	{ value: 'audit', label: 'Audit' },
	{ value: 'reconciliation', label: 'Reconciliation' },
	{ value: 'compliance', label: 'Compliance Check' },
	{ value: 'verification', label: 'Verification' },
	{ value: 'monitoring', label: 'Monitoring' },
	{ value: 'custom', label: 'Custom' },
];

const BUSINESS_PROCESSES = [
	{ value: 'accounts_payable', label: 'Accounts Payable' },
	{ value: 'accounts_receivable', label: 'Accounts Receivable' },
	{ value: 'general_ledger', label: 'General Ledger' },
	{ value: 'procurement', label: 'Procurement' },
	{ value: 'payroll', label: 'Payroll' },
	{ value: 'revenue', label: 'Revenue Recognition' },
	{ value: 'treasury', label: 'Treasury' },
	{ value: 'tax', label: 'Tax & Statutory' },
	{ value: 'intercompany', label: 'Intercompany' },
	{ value: 'inventory', label: 'Inventory & Assets' },
];

const FREQUENCIES = [
	{ value: 'on_demand', label: 'On Demand' },
	{ value: 'daily', label: 'Daily' },
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'biweekly', label: 'Bi-weekly' },
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'quarterly', label: 'Quarterly' },
	{ value: 'annually', label: 'Annually' },
];

const RISK_LEVELS = [
	{ value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700' },
	{ value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
	{ value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
	{ value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

const PRIORITY_LEVELS = [
	{ value: 'low', label: 'P3 — Low', color: 'text-slate-500' },
	{ value: 'medium', label: 'P2 — Medium', color: 'text-amber-600' },
	{ value: 'high', label: 'P1 — High', color: 'text-orange-600' },
	{ value: 'critical', label: 'P0 — Critical', color: 'text-red-600' },
];

const MOCK_TEAM_MEMBERS = [
	{
		id: 1,
		name: 'Tanish Gupta',
		initials: 'TG',
		role: 'owner',
		email: 'tanish@irame.ai',
	},
	{
		id: 2,
		name: 'Priya Sharma',
		initials: 'PS',
		role: 'editor',
		email: 'priya@irame.ai',
	},
	{
		id: 3,
		name: 'Rahul Mehta',
		initials: 'RM',
		role: 'reviewer',
		email: 'rahul@irame.ai',
	},
];

const ROLE_OPTIONS = [
	{ value: 'owner', label: 'Owner', desc: 'Full access. Can delete workflow.' },
	{ value: 'editor', label: 'Editor', desc: 'Can edit and run workflow.' },
	{
		value: 'reviewer',
		label: 'Reviewer',
		desc: 'Can review outputs and approve.',
	},
	{ value: 'viewer', label: 'Viewer', desc: 'Read-only access.' },
];

const ROLE_COLORS = {
	owner: 'bg-violet-100 text-violet-700',
	editor: 'bg-blue-100 text-blue-700',
	reviewer: 'bg-amber-100 text-amber-700',
	viewer: 'bg-slate-100 text-slate-600',
};

const MOCK_VERSIONS = [
	{
		version: 'v3.2',
		date: '2026-04-08T10:30:00',
		author: 'Tanish Gupta',
		changes: 'Updated tolerance threshold to 2%',
		current: true,
	},
	{
		version: 'v3.1',
		date: '2026-04-05T14:15:00',
		author: 'Priya Sharma',
		changes: 'Added MTOW weight category handling',
	},
	{
		version: 'v3.0',
		date: '2026-03-28T09:00:00',
		author: 'Tanish Gupta',
		changes: 'Major: switched to max weight logic',
	},
	{
		version: 'v2.4',
		date: '2026-03-15T16:45:00',
		author: 'Rahul Mehta',
		changes: 'Added duplicate invoice detection step',
	},
	{
		version: 'v2.3',
		date: '2026-03-01T11:20:00',
		author: 'Tanish Gupta',
		changes: 'Adjusted column mapping for new vendor format',
	},
];

const MOCK_AUDIT_LOG = [
	{
		action: 'Workflow executed',
		user: 'Tanish Gupta',
		time: '2 hours ago',
		icon: Zap,
	},
	{
		action: 'Approval threshold updated',
		user: 'Priya Sharma',
		time: '1 day ago',
		icon: Shield,
	},
	{
		action: 'Reviewer added: Rahul M.',
		user: 'Tanish Gupta',
		time: '3 days ago',
		icon: Users,
	},
	{
		action: 'Schedule changed to weekly',
		user: 'Tanish Gupta',
		time: '5 days ago',
		icon: Clock,
	},
	{
		action: 'Notification rule added',
		user: 'Priya Sharma',
		time: '1 week ago',
		icon: Bell,
	},
];

/* ── sub-components ────────────────────────────────────── */

function AccordionSection({
	id,
	icon: Icon,
	title,
	subtitle,
	expandedSections,
	onToggle,
	children,
}) {
	const isOpen = expandedSections.has(id);
	return (
		<div className="border border-slate-200 rounded-xl overflow-hidden">
			<button
				onClick={() => onToggle(id)}
				className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50/50 transition-colors"
			>
				<div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
					<Icon className="size-3.5 text-violet-600" />
				</div>
				<div className="flex-1 text-left min-w-0">
					<p className="text-[13px] font-semibold text-slate-800">
						{title}
					</p>
					{subtitle && !isOpen && (
						<p className="text-[11px] text-slate-400 mt-0.5 truncate">
							{subtitle}
						</p>
					)}
				</div>
				<ChevronDown
					className={`size-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>
			{isOpen && (
				<div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-white">
					{children}
				</div>
			)}
		</div>
	);
}

function FieldRow({ label, description, children }) {
	return (
		<div className="flex items-start justify-between gap-6 py-3">
			<div className="flex-1 min-w-0">
				<p className="text-[13px] font-semibold text-slate-700">{label}</p>
				{description && (
					<p className="text-[11px] text-slate-400 mt-0.5">
						{description}
					</p>
				)}
			</div>
			<div className="flex-shrink-0">{children}</div>
		</div>
	);
}

function InlineSelect({ value, options, onChange, className = '' }) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className={`text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 cursor-pointer appearance-none pr-7 ${className}`}
			style={{
				backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e")`,
				backgroundPosition: 'right 0.5rem center',
				backgroundSize: '12px',
				backgroundRepeat: 'no-repeat',
			}}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}

function InlineInput({ value, onChange, placeholder, className = '' }) {
	return (
		<input
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			className={`text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 w-full ${className}`}
		/>
	);
}

function MemberRow({ member, onRoleChange, onRemove }) {
	const [showRoleMenu, setShowRoleMenu] = useState(false);
	return (
		<div className="flex items-center gap-3 py-2.5 group">
			<div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
				<span className="text-[10px] font-bold text-violet-700">
					{member.initials}
				</span>
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-[13px] font-semibold text-slate-700 truncate">
					{member.name}
				</p>
				<p className="text-[10px] text-slate-400 truncate">{member.email}</p>
			</div>
			<div className="relative">
				<button
					onClick={() => setShowRoleMenu(!showRoleMenu)}
					className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]} cursor-pointer hover:opacity-80 transition-opacity`}
				>
					{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
				</button>
				{showRoleMenu && (
					<div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-52">
						{ROLE_OPTIONS.map((role) => (
							<button
								key={role.value}
								onClick={() => {
									onRoleChange(member.id, role.value);
									setShowRoleMenu(false);
								}}
								className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${member.role === role.value ? 'bg-violet-50' : ''}`}
							>
								<p className="text-[12px] font-semibold text-slate-700">
									{role.label}
								</p>
								<p className="text-[10px] text-slate-400">
									{role.desc}
								</p>
							</button>
						))}
					</div>
				)}
			</div>
			{member.role !== 'owner' && (
				<button
					onClick={() => onRemove(member.id)}
					className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}

/* ── main component ────────────────────────────────────── */

const WorkflowManager = ({ workflowId, workflow: workflowProp }) => {
	const [expandedSections, setExpandedSections] = useState(new Set(['general']));
	const [hasChanges, setHasChanges] = useState(false);

	// General settings state
	const [workflowName, setWorkflowName] = useState(
		workflowProp?.name || 'Invoice Verification & AP Audit',
	);
	const [workflowDesc, setWorkflowDesc] = useState(
		'Automated verification of invoices against AP records with duplicate detection, amount variance checks, and compliance validation.',
	);
	const [workflowType, setWorkflowType] = useState('audit');
	const [businessProcess, setBusinessProcess] = useState('accounts_payable');
	const [riskLevel, setRiskLevel] = useState('high');
	const [priority, setPriority] = useState('high');
	const [tags, setTags] = useState(['AP', 'Invoice', 'Compliance']);
	const [newTag, setNewTag] = useState('');

	// Schedule state
	const [scheduleEnabled, setScheduleEnabled] = useState(true);
	const [frequency, setFrequency] = useState('weekly');
	const [scheduleDay, setScheduleDay] = useState('monday');
	const [scheduleTime, setScheduleTime] = useState('09:00');
	const [timezone, setTimezone] = useState('Asia/Kolkata');
	const [retryOnFail, setRetryOnFail] = useState(true);
	const [maxRetries, setMaxRetries] = useState('3');
	const [timeoutMinutes, setTimeoutMinutes] = useState('30');

	// Access state
	const [members, setMembers] = useState(MOCK_TEAM_MEMBERS);
	const [showInvite, setShowInvite] = useState(false);
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState('viewer');
	const [visibilityScope, setVisibilityScope] = useState('team');

	// Approval state
	const [requireApproval, setRequireApproval] = useState(true);
	const [approvalThreshold, setApprovalThreshold] = useState('50000');
	const [approvalMode, setApprovalMode] = useState('any');
	const [autoApproveClean, setAutoApproveClean] = useState(false);
	const [escalationEnabled, setEscalationEnabled] = useState(true);
	const [escalationHours, setEscalationHours] = useState('24');

	// Notification state
	const [notifyOnComplete, setNotifyOnComplete] = useState(true);
	const [notifyOnFailure, setNotifyOnFailure] = useState(true);
	const [notifyOnFlagged, setNotifyOnFlagged] = useState(true);
	const [notifyOnApproval, setNotifyOnApproval] = useState(true);
	const [notifyChannel, setNotifyChannel] = useState('email');
	const [slackWebhook, setSlackWebhook] = useState('');
	const [digestEnabled, setDigestEnabled] = useState(false);

	// Version/Audit sub-tab
	const [historyTab, setHistoryTab] = useState('versions');

	const markChanged = (setter) => (val) => {
		setter(val);
		setHasChanges(true);
	};

	const toggleSection = (id) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleAddTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			setTags([...tags, newTag.trim()]);
			setNewTag('');
			setHasChanges(true);
		}
	};

	const handleRemoveTag = (tag) => {
		setTags(tags.filter((t) => t !== tag));
		setHasChanges(true);
	};

	const handleRoleChange = (memberId, role) => {
		setMembers(members.map((m) => (m.id === memberId ? { ...m, role } : m)));
		setHasChanges(true);
	};

	const handleRemoveMember = (memberId) => {
		setMembers(members.filter((m) => m.id !== memberId));
		setHasChanges(true);
	};

	return (
		<div className="overflow-y-auto h-full">
			<div className="max-w-2xl mx-auto py-2 space-y-3">
				{/* Save bar */}
				{hasChanges && (
					<div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 sticky top-0 z-10">
						<div className="flex items-center gap-2">
							<Info className="size-3.5 text-violet-600" />
							<span className="text-[12px] font-semibold text-violet-700">
								You have unsaved changes
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								className="text-[12px] h-7 text-slate-500 hover:text-slate-700"
								onClick={() => setHasChanges(false)}
							>
								Discard
							</Button>
							<Button
								size="sm"
								className="text-[12px] h-7 bg-violet-600 hover:bg-violet-700 text-white"
								onClick={() => setHasChanges(false)}
							>
								<Save className="size-3 mr-1" />
								Save changes
							</Button>
						</div>
					</div>
				)}

				{/* ════════════ GENERAL ════════════ */}
				<AccordionSection
					id="general"
					icon={Settings2}
					title="General"
					subtitle={`${workflowName} · ${WORKFLOW_TYPES.find((t) => t.value === workflowType)?.label} · ${BUSINESS_PROCESSES.find((p) => p.value === businessProcess)?.label}`}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					<div className="divide-y divide-slate-100">
						<FieldRow
							label="Workflow Name"
							description="Display name shown across the platform"
						>
							<InlineInput
								value={workflowName}
								onChange={markChanged(setWorkflowName)}
								className="w-64"
							/>
						</FieldRow>

						<div className="py-3">
							<p className="text-[13px] font-semibold text-slate-700 mb-1.5">
								Description
							</p>
							<textarea
								value={workflowDesc}
								onChange={(e) => {
									setWorkflowDesc(e.target.value);
									setHasChanges(true);
								}}
								rows={2}
								className="w-full text-[13px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
							/>
						</div>

						<FieldRow
							label="Workflow Type"
							description="Categorization for filtering and reporting"
						>
							<InlineSelect
								value={workflowType}
								options={WORKFLOW_TYPES}
								onChange={markChanged(setWorkflowType)}
								className="w-44"
							/>
						</FieldRow>

						<FieldRow
							label="Business Process"
							description="Maps to your organizational process taxonomy"
						>
							<InlineSelect
								value={businessProcess}
								options={BUSINESS_PROCESSES}
								onChange={markChanged(setBusinessProcess)}
								className="w-52"
							/>
						</FieldRow>

						<FieldRow
							label="Risk Level"
							description="Determines escalation rules and review frequency"
						>
							<InlineSelect
								value={riskLevel}
								options={RISK_LEVELS}
								onChange={markChanged(setRiskLevel)}
								className="w-36"
							/>
						</FieldRow>

						<FieldRow
							label="Priority"
							description="Used for SLA tracking and team capacity planning"
						>
							<InlineSelect
								value={priority}
								options={PRIORITY_LEVELS}
								onChange={markChanged(setPriority)}
								className="w-40"
							/>
						</FieldRow>

						<div className="py-3">
							<p className="text-[13px] font-semibold text-slate-700 mb-1">
								Tags
							</p>
							<p className="text-[11px] text-slate-400 mb-2.5">
								Organize and filter workflows across your workspace
							</p>
							<div className="flex items-center gap-2 flex-wrap">
								{tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100"
									>
										{tag}
										<button
											onClick={() => handleRemoveTag(tag)}
											className="text-violet-400 hover:text-violet-600"
										>
											<X className="size-2.5" />
										</button>
									</span>
								))}
								<div className="flex items-center gap-1">
									<input
										type="text"
										value={newTag}
										onChange={(e) => setNewTag(e.target.value)}
										onKeyDown={(e) =>
											e.key === 'Enter' && handleAddTag()
										}
										placeholder="Add tag..."
										className="text-[11px] w-20 bg-transparent border-none outline-none text-slate-500 placeholder:text-slate-300"
									/>
									{newTag && (
										<button
											onClick={handleAddTag}
											className="text-violet-500 hover:text-violet-700"
										>
											<Plus className="size-3" />
										</button>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Danger zone */}
					<div className="mt-4 border border-red-200 rounded-xl p-4">
						<p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-3">
							Danger Zone
						</p>
						<div className="flex items-center justify-between gap-4 py-2">
							<div>
								<p className="text-[13px] font-semibold text-slate-700">
									Archive Workflow
								</p>
								<p className="text-[11px] text-slate-400">
									Disable and move to archive. Can be restored.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="text-[12px] h-7 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							>
								<Archive className="size-3 mr-1" />
								Archive
							</Button>
						</div>
						<div className="border-t border-red-100 my-1" />
						<div className="flex items-center justify-between gap-4 py-2">
							<div>
								<p className="text-[13px] font-semibold text-slate-700">
									Delete Workflow
								</p>
								<p className="text-[11px] text-slate-400">
									Permanently delete workflow and all run history.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="text-[12px] h-7 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							>
								<Trash2 className="size-3 mr-1" />
								Delete
							</Button>
						</div>
					</div>
				</AccordionSection>

				{/* ════════════ ACCESS & ROLES ════════════ */}
				<AccordionSection
					id="access"
					icon={Users}
					title="Access & Roles"
					subtitle={`${members.length} members · ${visibilityScope.charAt(0).toUpperCase() + visibilityScope.slice(1)} visibility`}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					<div className="divide-y divide-slate-100">
						<FieldRow
							label="Visibility"
							description="Who can discover this workflow"
						>
							<InlineSelect
								value={visibilityScope}
								options={[
									{
										value: 'private',
										label: 'Private — Only members',
									},
									{ value: 'team', label: 'Team — Your team' },
									{
										value: 'org',
										label: 'Organization — Everyone',
									},
								]}
								onChange={markChanged(setVisibilityScope)}
								className="w-56"
							/>
						</FieldRow>
					</div>

					<div className="mt-3">
						<div className="flex items-center justify-between mb-3">
							<p className="text-[13px] font-semibold text-slate-700">
								Members ({members.length})
							</p>
							<Button
								variant="outline"
								size="sm"
								className="text-[12px] h-7"
								onClick={() => setShowInvite(!showInvite)}
							>
								<Plus className="size-3 mr-1" />
								Add member
							</Button>
						</div>

						{showInvite && (
							<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 flex items-end gap-3">
								<div className="flex-1">
									<label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
										Email
									</label>
									<InlineInput
										value={inviteEmail}
										onChange={setInviteEmail}
										placeholder="colleague@company.com"
									/>
								</div>
								<div className="w-36">
									<label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
										Role
									</label>
									<InlineSelect
										value={inviteRole}
										options={ROLE_OPTIONS}
										onChange={setInviteRole}
										className="w-full"
									/>
								</div>
								<Button
									size="sm"
									className="text-[12px] h-8 bg-violet-600 hover:bg-violet-700 text-white"
								>
									Send invite
								</Button>
							</div>
						)}

						<div className="divide-y divide-slate-100">
							{members.map((member) => (
								<MemberRow
									key={member.id}
									member={member}
									onRoleChange={handleRoleChange}
									onRemove={handleRemoveMember}
								/>
							))}
						</div>
					</div>

					{/* Permissions matrix */}
					<div className="mt-4">
						<p className="text-[13px] font-semibold text-slate-700 mb-3">
							Permissions Matrix
						</p>
						<div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200">
										<th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2.5">
											Permission
										</th>
										<th className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-2.5">
											Owner
										</th>
										<th className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-2.5">
											Editor
										</th>
										<th className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-2.5">
											Reviewer
										</th>
										<th className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-2.5">
											Viewer
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{[
										['View outputs', true, true, true, true],
										['Run workflow', true, true, false, false],
										[
											'Edit steps & mappings',
											true,
											true,
											false,
											false,
										],
										[
											'Approve flagged items',
											true,
											true,
											true,
											false,
										],
										[
											'Change settings',
											true,
											false,
											false,
											false,
										],
										[
											'Manage members',
											true,
											false,
											false,
											false,
										],
										[
											'Delete workflow',
											true,
											false,
											false,
											false,
										],
									].map(([perm, ...roles]) => (
										<tr key={perm}>
											<td className="text-[12px] font-medium text-slate-600 px-3 py-2">
												{perm}
											</td>
											{roles.map((allowed, i) => (
												<td
													key={i}
													className="text-center px-2 py-2"
												>
													{allowed ? (
														<Check className="size-3.5 text-emerald-500 mx-auto" />
													) : (
														<X className="size-3.5 text-slate-300 mx-auto" />
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</AccordionSection>

				{/* ════════════ SCHEDULE ════════════ */}
				<AccordionSection
					id="schedule"
					icon={Clock}
					title="Schedule"
					subtitle={
						scheduleEnabled
							? `${FREQUENCIES.find((f) => f.value === frequency)?.label} · ${scheduleTime} IST`
							: 'Not scheduled'
					}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					<div className="divide-y divide-slate-100">
						<FieldRow
							label="Scheduled Execution"
							description="Run this workflow automatically on a recurring basis"
						>
							<Switch
								checked={scheduleEnabled}
								onCheckedChange={markChanged(setScheduleEnabled)}
							/>
						</FieldRow>

						{scheduleEnabled && (
							<>
								<FieldRow
									label="Frequency"
									description="How often the workflow should run"
								>
									<InlineSelect
										value={frequency}
										options={FREQUENCIES}
										onChange={markChanged(setFrequency)}
										className="w-36"
									/>
								</FieldRow>

								{(frequency === 'weekly' ||
									frequency === 'biweekly') && (
									<FieldRow label="Day of Week">
										<InlineSelect
											value={scheduleDay}
											options={[
												{ value: 'monday', label: 'Monday' },
												{
													value: 'tuesday',
													label: 'Tuesday',
												},
												{
													value: 'wednesday',
													label: 'Wednesday',
												},
												{
													value: 'thursday',
													label: 'Thursday',
												},
												{ value: 'friday', label: 'Friday' },
											]}
											onChange={markChanged(setScheduleDay)}
											className="w-36"
										/>
									</FieldRow>
								)}

								<FieldRow
									label="Time"
									description="Execution time in local timezone"
								>
									<input
										type="time"
										value={scheduleTime}
										onChange={(e) => {
											setScheduleTime(e.target.value);
											setHasChanges(true);
										}}
										className="text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
									/>
								</FieldRow>

								<FieldRow label="Timezone">
									<InlineSelect
										value={timezone}
										options={[
											{
												value: 'Asia/Kolkata',
												label: 'IST (UTC+5:30)',
											},
											{
												value: 'America/New_York',
												label: 'EST (UTC-5)',
											},
											{
												value: 'America/Los_Angeles',
												label: 'PST (UTC-8)',
											},
											{
												value: 'Europe/London',
												label: 'GMT (UTC+0)',
											},
											{
												value: 'Asia/Singapore',
												label: 'SGT (UTC+8)',
											},
										]}
										onChange={markChanged(setTimezone)}
										className="w-44"
									/>
								</FieldRow>
							</>
						)}

						<FieldRow
							label="Retry on Failure"
							description="Automatically retry if the workflow execution fails"
						>
							<Switch
								checked={retryOnFail}
								onCheckedChange={markChanged(setRetryOnFail)}
							/>
						</FieldRow>

						{retryOnFail && (
							<FieldRow label="Max Retries">
								<InlineSelect
									value={maxRetries}
									options={[
										{ value: '1', label: '1 retry' },
										{ value: '2', label: '2 retries' },
										{ value: '3', label: '3 retries' },
										{ value: '5', label: '5 retries' },
									]}
									onChange={markChanged(setMaxRetries)}
									className="w-32"
								/>
							</FieldRow>
						)}

						<FieldRow
							label="Execution Timeout"
							description="Maximum time allowed for a single run"
						>
							<InlineSelect
								value={timeoutMinutes}
								options={[
									{ value: '15', label: '15 min' },
									{ value: '30', label: '30 min' },
									{ value: '60', label: '1 hour' },
									{ value: '120', label: '2 hours' },
								]}
								onChange={markChanged(setTimeoutMinutes)}
								className="w-32"
							/>
						</FieldRow>
					</div>

					{scheduleEnabled && (
						<div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-3">
							<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
								Upcoming Runs
							</p>
							<div className="space-y-1.5">
								{[
									'Mon, Apr 14 · 09:00 IST',
									'Mon, Apr 21 · 09:00 IST',
									'Mon, Apr 28 · 09:00 IST',
								].map((date) => (
									<div
										key={date}
										className="flex items-center gap-2.5"
									>
										<Calendar className="size-3 text-slate-400" />
										<span className="text-[12px] text-slate-600">
											{date}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</AccordionSection>

				{/* ════════════ APPROVALS ════════════ */}
				<AccordionSection
					id="approvals"
					icon={Shield}
					title="Approvals"
					subtitle={
						requireApproval
							? `Threshold ₹${Number(approvalThreshold).toLocaleString('en-IN')} · ${approvalMode === 'any' ? 'Any reviewer' : approvalMode === 'all' ? 'All reviewers' : 'Majority'}`
							: 'No approval required'
					}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					<div className="divide-y divide-slate-100">
						<FieldRow
							label="Require Approval"
							description="Flagged items must be reviewed before the report is finalized"
						>
							<Switch
								checked={requireApproval}
								onCheckedChange={markChanged(setRequireApproval)}
							/>
						</FieldRow>

						{requireApproval && (
							<>
								<FieldRow
									label="Approval Threshold"
									description="Items above this amount always require approval"
								>
									<div className="flex items-center gap-1">
										<span className="text-[13px] text-slate-400">
											₹
										</span>
										<input
											type="text"
											value={approvalThreshold}
											onChange={(e) => {
												setApprovalThreshold(e.target.value);
												setHasChanges(true);
											}}
											className="text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 text-right"
										/>
									</div>
								</FieldRow>

								<FieldRow
									label="Approval Mode"
									description="How many reviewers must approve flagged items"
								>
									<InlineSelect
										value={approvalMode}
										options={[
											{ value: 'any', label: 'Any reviewer' },
											{ value: 'all', label: 'All reviewers' },
											{
												value: 'majority',
												label: 'Majority (>50%)',
											},
										]}
										onChange={markChanged(setApprovalMode)}
										className="w-40"
									/>
								</FieldRow>

								<FieldRow
									label="Auto-approve Clean Runs"
									description="Skip review if no flags or variances are detected"
								>
									<Switch
										checked={autoApproveClean}
										onCheckedChange={markChanged(
											setAutoApproveClean,
										)}
									/>
								</FieldRow>

								<FieldRow
									label="Escalation"
									description="Automatically escalate if approval is pending too long"
								>
									<Switch
										checked={escalationEnabled}
										onCheckedChange={markChanged(
											setEscalationEnabled,
										)}
									/>
								</FieldRow>

								{escalationEnabled && (
									<FieldRow
										label="Escalation After"
										description="Hours before escalating to the workflow owner"
									>
										<InlineSelect
											value={escalationHours}
											options={[
												{ value: '4', label: '4 hours' },
												{ value: '8', label: '8 hours' },
												{ value: '24', label: '24 hours' },
												{ value: '48', label: '48 hours' },
												{ value: '72', label: '72 hours' },
											]}
											onChange={markChanged(
												setEscalationHours,
											)}
											className="w-32"
										/>
									</FieldRow>
								)}
							</>
						)}
					</div>

					{requireApproval && (
						<div className="mt-4 bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
							<AlertTriangle className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-[12px] font-semibold text-amber-800">
									Active approval gate
								</p>
								<p className="text-[11px] text-amber-600 mt-0.5">
									Flagged items exceeding ₹
									{Number(approvalThreshold).toLocaleString(
										'en-IN',
									)}{' '}
									require{' '}
									{approvalMode === 'any'
										? 'at least one reviewer'
										: approvalMode === 'all'
											? 'all reviewers'
											: 'a majority of reviewers'}{' '}
									to approve.
									{escalationEnabled &&
										` Escalates after ${escalationHours}h.`}
								</p>
							</div>
						</div>
					)}
				</AccordionSection>

				{/* ════════════ NOTIFICATIONS ════════════ */}
				<AccordionSection
					id="notifications"
					icon={Bell}
					title="Notifications"
					subtitle={`${notifyChannel === 'both' ? 'Email + Slack' : notifyChannel === 'slack' ? 'Slack' : 'Email'} · ${[notifyOnComplete, notifyOnFailure, notifyOnFlagged, notifyOnApproval].filter(Boolean).length} events`}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					<div className="mb-4">
						<p className="text-[13px] font-semibold text-slate-700 mb-2">
							Delivery Channel
						</p>
						<div className="flex gap-2">
							{[
								{ value: 'email', label: 'Email', icon: Mail },
								{ value: 'slack', label: 'Slack', icon: Bell },
								{ value: 'both', label: 'Both', icon: Bell },
							].map((ch) => (
								<button
									key={ch.value}
									onClick={() => {
										setNotifyChannel(ch.value);
										setHasChanges(true);
									}}
									className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${
										notifyChannel === ch.value
											? 'bg-violet-50 border-violet-200 text-violet-700'
											: 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
									}`}
								>
									<ch.icon className="size-3.5" />
									{ch.label}
								</button>
							))}
						</div>
					</div>

					{(notifyChannel === 'slack' || notifyChannel === 'both') && (
						<div className="mb-4 py-3 border-t border-slate-100">
							<FieldRow
								label="Slack Webhook URL"
								description="Incoming webhook for your Slack channel"
							>
								<InlineInput
									value={slackWebhook}
									onChange={(val) => {
										setSlackWebhook(val);
										setHasChanges(true);
									}}
									placeholder="https://hooks.slack.com/..."
									className="w-72"
								/>
							</FieldRow>
						</div>
					)}

					<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 mt-1">
						Events
					</p>
					<div className="divide-y divide-slate-100">
						<FieldRow
							label="Workflow Completed"
							description="Notify when a run finishes successfully"
						>
							<Switch
								checked={notifyOnComplete}
								onCheckedChange={markChanged(setNotifyOnComplete)}
							/>
						</FieldRow>
						<FieldRow
							label="Execution Failed"
							description="Alert immediately when a run errors out"
						>
							<Switch
								checked={notifyOnFailure}
								onCheckedChange={markChanged(setNotifyOnFailure)}
							/>
						</FieldRow>
						<FieldRow
							label="Items Flagged"
							description="Notify when items are flagged for review"
						>
							<Switch
								checked={notifyOnFlagged}
								onCheckedChange={markChanged(setNotifyOnFlagged)}
							/>
						</FieldRow>
						<FieldRow
							label="Approval Requested"
							description="Alert reviewers when their approval is needed"
						>
							<Switch
								checked={notifyOnApproval}
								onCheckedChange={markChanged(setNotifyOnApproval)}
							/>
						</FieldRow>
					</div>

					<div className="border-t border-slate-100 mt-3 pt-1">
						<FieldRow
							label="Daily Digest"
							description="Receive a summary of all workflow activity once daily"
						>
							<Switch
								checked={digestEnabled}
								onCheckedChange={markChanged(setDigestEnabled)}
							/>
						</FieldRow>
					</div>
				</AccordionSection>

				{/* ════════════ VERSION HISTORY & AUDIT LOG (merged) ════════════ */}
				<AccordionSection
					id="history"
					icon={GitCompareArrows}
					title="Version History & Audit Log"
					subtitle={`v3.2 current · ${MOCK_AUDIT_LOG.length} recent actions`}
					expandedSections={expandedSections}
					onToggle={toggleSection}
				>
					{/* Sub-tabs */}
					<div className="flex items-center gap-1 mb-4">
						{[
							{
								id: 'versions',
								label: 'Versions',
								icon: GitCompareArrows,
							},
							{ id: 'audit', label: 'Audit Log', icon: History },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setHistoryTab(tab.id)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
									historyTab === tab.id
										? 'bg-violet-100 text-violet-700'
										: 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
								}`}
							>
								<tab.icon className="size-3" />
								{tab.label}
							</button>
						))}
					</div>

					{historyTab === 'versions' && (
						<div className="space-y-2.5">
							{MOCK_VERSIONS.map((v) => (
								<div
									key={v.version}
									className={`border rounded-xl p-3.5 transition-colors ${
										v.current
											? 'border-violet-200 bg-violet-50/50'
											: 'border-slate-200 bg-white hover:bg-slate-50'
									}`}
								>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center gap-2.5">
											<span
												className={`text-[13px] font-bold ${v.current ? 'text-violet-700' : 'text-slate-800'}`}
											>
												{v.version}
											</span>
											{v.current && (
												<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wider">
													Current
												</span>
											)}
										</div>
										{!v.current && (
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="text-[11px] h-6 text-slate-500 hover:text-slate-700"
												>
													<Eye className="size-3 mr-1" />
													View
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="text-[11px] h-6 text-slate-500 hover:text-violet-700"
												>
													<RefreshCw className="size-3 mr-1" />
													Restore
												</Button>
											</div>
										)}
									</div>
									<p className="text-[12px] text-slate-600 mb-1.5">
										{v.changes}
									</p>
									<div className="flex items-center gap-3 text-[11px] text-slate-400">
										<span className="font-medium">
											{v.author}
										</span>
										<span>
											{new Date(v.date).toLocaleDateString(
												'en-IN',
												{
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												},
											)}
										</span>
										<span>
											{new Date(v.date).toLocaleTimeString(
												'en-IN',
												{
													hour: '2-digit',
													minute: '2-digit',
												},
											)}
										</span>
									</div>
								</div>
							))}
						</div>
					)}

					{historyTab === 'audit' && (
						<div>
							{MOCK_AUDIT_LOG.map((entry, i) => (
								<div
									key={i}
									className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0"
								>
									<div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
										<entry.icon className="size-3.5 text-slate-500" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-[13px] font-medium text-slate-700">
											{entry.action}
										</p>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-[11px] font-medium text-slate-500">
												{entry.user}
											</span>
											<span className="text-[11px] text-slate-400">
												{entry.time}
											</span>
										</div>
									</div>
								</div>
							))}
							<div className="mt-3 text-center">
								<Button
									variant="ghost"
									size="sm"
									className="text-[12px] text-slate-400 hover:text-slate-600"
								>
									Load more activity
								</Button>
							</div>
						</div>
					)}
				</AccordionSection>
			</div>
		</div>
	);
};

export default WorkflowManager;
