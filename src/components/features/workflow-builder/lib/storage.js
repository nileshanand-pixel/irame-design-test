const STORAGE_KEY = 'irame_workflows';

function generateId() {
	return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getWorkflows() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : getSampleWorkflows();
	} catch {
		return getSampleWorkflows();
	}
}

export function getWorkflow(id) {
	return getWorkflows().find((w) => w.id === id) ?? null;
}

export function saveWorkflow(workflow) {
	const all = getWorkflows();
	const now = new Date().toISOString();
	const existing = all.findIndex((w) => w.id === workflow.id);
	const saved = {
		...workflow,
		id: workflow.id || generateId(),
		createdAt: workflow.createdAt || now,
		updatedAt: now,
		runCount: workflow.runCount ?? 0,
		status: workflow.status ?? 'active',
	};
	if (existing >= 0) {
		all[existing] = saved;
	} else {
		all.unshift(saved);
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	return saved;
}

export function deleteWorkflow(id) {
	const all = getWorkflows().filter((w) => w.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function incrementRunCount(id) {
	const all = getWorkflows();
	const idx = all.findIndex((w) => w.id === id);
	if (idx >= 0) {
		all[idx].runCount = (all[idx].runCount ?? 0) + 1;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	}
}

function getSampleWorkflows() {
	const samples = [
		{
			id: 'sample_1',
			name: 'Vendor Contract Compliance',
			description:
				'Reviews vendor invoices against contracts to detect overbilling and SLA breaches.',
			category: 'Procurement Audit',
			tags: ['vendor', 'contract', 'overbilling'],
			inputs: [
				{
					id: 'input_1',
					name: 'Vendor Invoices',
					type: 'csv',
					description: 'Invoice register',
					required: true,
					multiple: true,
				},
				{
					id: 'input_2',
					name: 'Purchase Orders',
					type: 'csv',
					description: 'Approved POs',
					required: true,
					multiple: false,
				},
				{
					id: 'input_3',
					name: 'Master Contract',
					type: 'pdf',
					description: 'Signed agreement',
					required: true,
					multiple: false,
				},
			],
			output: {
				type: 'flags',
				title: 'Vendor Compliance Flags',
				description: 'Contract breaches',
				fields: [],
			},
			steps: [
				{
					id: 'step_1',
					name: 'Document Ingestion',
					description: 'Parse all inputs',
					type: 'extract',
				},
				{
					id: 'step_2',
					name: 'Invoice–PO Matching',
					description: 'Three-way match',
					type: 'compare',
				},
				{
					id: 'step_3',
					name: 'Rate Variance Check',
					description: 'Flag rate overcharges',
					type: 'flag',
				},
				{
					id: 'step_4',
					name: 'Risk Summary',
					description: 'Rank by exposure',
					type: 'summarize',
				},
			],
			logicPrompt:
				'Match each invoice line to the PO and contract. Flag overbilling, out-of-scope, and missing GRN.',
			status: 'active',
			runCount: 7,
			createdAt: '2026-03-01T10:00:00Z',
			updatedAt: '2026-03-20T14:30:00Z',
		},
		{
			id: 'sample_2',
			name: 'Financial Statement Reconciliation',
			description:
				'Cross-validates GL entries against bank statements to catch unrecorded transactions.',
			category: 'Financial Audit',
			tags: ['reconciliation', 'gl', 'bank'],
			inputs: [
				{
					id: 'input_1',
					name: 'GL Trial Balance',
					type: 'csv',
					description: 'General ledger entries',
					required: true,
					multiple: false,
				},
				{
					id: 'input_2',
					name: 'Bank Statement',
					type: 'csv',
					description: 'Bank transactions',
					required: true,
					multiple: false,
				},
			],
			output: {
				type: 'table',
				title: 'Reconciliation Report',
				description: 'Matched and unmatched entries',
				fields: [],
			},
			steps: [
				{
					id: 'step_1',
					name: 'Load Data',
					description: 'Parse both files',
					type: 'extract',
				},
				{
					id: 'step_2',
					name: 'Match Entries',
					description: 'Match GL to bank',
					type: 'compare',
				},
				{
					id: 'step_3',
					name: 'Flag Gaps',
					description: 'Unrecorded transactions',
					type: 'flag',
				},
				{
					id: 'step_4',
					name: 'Summary',
					description: 'Total reconciled vs unmatched',
					type: 'summarize',
				},
			],
			logicPrompt:
				'Reconcile GL entries with bank statement. Flag unmatched amounts and timing differences.',
			status: 'active',
			runCount: 3,
			createdAt: '2026-03-05T09:00:00Z',
			updatedAt: '2026-03-18T11:00:00Z',
		},
		{
			id: 'sample_3',
			name: 'Invoice Verification & AP Audit',
			description:
				'Validates AP invoices against POs and GL to catch duplicates and fictitious vendors.',
			category: 'Financial Audit',
			tags: ['ap', 'invoice', 'duplicate'],
			inputs: [
				{
					id: 'input_1',
					name: 'AP Invoice Register',
					type: 'csv',
					description: 'All invoices',
					required: true,
					multiple: false,
				},
				{
					id: 'input_2',
					name: 'Vendor Master',
					type: 'csv',
					description: 'Approved vendors',
					required: true,
					multiple: false,
				},
				{
					id: 'input_3',
					name: 'GL Trial Balance',
					type: 'csv',
					description: 'GL entries',
					required: true,
					multiple: false,
				},
			],
			output: {
				type: 'table',
				title: 'AP Audit Results',
				description: 'Invoice status with exceptions',
				fields: [],
			},
			steps: [
				{
					id: 'step_1',
					name: 'Data Ingestion',
					description: 'Load all inputs',
					type: 'extract',
				},
				{
					id: 'step_2',
					name: 'Vendor Validation',
					description: 'Check vendor master',
					type: 'validate',
				},
				{
					id: 'step_3',
					name: 'Duplicate Detection',
					description: 'Find duplicate invoices',
					type: 'flag',
				},
				{
					id: 'step_4',
					name: 'SoD Check',
					description: 'Segregation of duties',
					type: 'flag',
				},
				{
					id: 'step_5',
					name: 'Summary',
					description: 'Clean vs exception count',
					type: 'summarize',
				},
			],
			logicPrompt:
				'Validate invoices against vendor master and GL. Flag duplicates, unapproved vendors, and SoD breaches.',
			status: 'active',
			runCount: 12,
			createdAt: '2026-02-20T08:00:00Z',
			updatedAt: '2026-03-22T16:00:00Z',
		},
	];
	localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
	return samples;
}
