export async function generateWorkflow(messages) {
	const lastMsg = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
	const isPayroll = /payroll|salary|hr|employee/i.test(lastMsg);
	const isVendor = /vendor|contract|supplier/i.test(lastMsg);

	await new Promise((r) => setTimeout(r, 800));

	const workflow = isPayroll
		? {
				name: 'Payroll Integrity Audit',
				description:
					'Cross-validates payroll disbursements against HR master records to detect ghost employees, duplicate payments, and salary anomalies.',
				logicPrompt:
					'Reconcile each disbursement against authorised HR headcount. Flag ghost employees, shared bank accounts, out-of-band salaries, and unapproved retroactive adjustments.',
				inputs: [
					{
						id: 'input_1',
						name: 'Payroll Disbursement File',
						type: 'csv',
						description: 'Monthly payroll run',
						required: true,
						multiple: false,
						columns: [
							'emp_id',
							'emp_name',
							'gross_pay',
							'bank_account',
							'department',
							'pay_date',
						],
					},
					{
						id: 'input_2',
						name: 'HR Master Record',
						type: 'csv',
						description: 'Authorised headcount',
						required: true,
						multiple: false,
						columns: [
							'employee_id',
							'full_name',
							'grade',
							'approved_salary',
							'joining_date',
						],
					},
					{
						id: 'input_3',
						name: 'Approved Salary Structure',
						type: 'pdf',
						description: 'Board-approved bands',
						required: false,
						multiple: false,
						columns: [
							'grade',
							'min_salary',
							'max_salary',
							'effective_date',
						],
					},
				],
				output: {
					type: 'flags',
					title: 'Payroll Audit Findings',
					description: 'Anomaly flags with severity and recommendations',
					fields: [],
				},
				steps: [
					{
						id: 'step_1',
						name: 'Load & Validate',
						description: 'Parse and validate inputs',
						type: 'extract',
						dataFiles: ['input_1', 'input_2'],
					},
					{
						id: 'step_2',
						name: 'Ghost Employee Check',
						description: 'IDs in payroll not in HR',
						type: 'compare',
						dataFiles: ['input_1', 'input_2'],
					},
					{
						id: 'step_3',
						name: 'Duplicate Bank Scan',
						description: 'Shared bank accounts',
						type: 'flag',
						dataFiles: ['input_1'],
					},
					{
						id: 'step_4',
						name: 'Salary Band Validation',
						description: 'Pay vs approved band',
						type: 'validate',
						dataFiles: ['input_1', 'input_3'],
					},
					{
						id: 'step_5',
						name: 'Executive Summary',
						description: 'Risk-ranked findings',
						type: 'summarize',
						dataFiles: ['input_1', 'input_2'],
					},
				],
				tags: ['payroll', 'ghost-employee', 'fraud', 'hr'],
				category: 'HR & Payroll',
			}
		: isVendor
			? {
					name: 'Vendor Contract Compliance Audit',
					description:
						'Reviews vendor invoices and POs against contracts to detect overbilling, unapproved scope, and SLA breaches.',
					logicPrompt:
						'Match each invoice to the PO and contract clause. Flag rate overcharges, out-of-scope billing, missing GRNs, and payment term violations.',
					inputs: [
						{
							id: 'input_1',
							name: 'Vendor Invoices',
							type: 'csv',
							description: 'Invoice register',
							required: true,
							multiple: true,
							columns: [
								'invoice_no',
								'vendor_name',
								'amount',
								'invoice_date',
								'po_reference',
							],
						},
						{
							id: 'input_2',
							name: 'Purchase Orders',
							type: 'csv',
							description: 'Approved POs',
							required: true,
							multiple: false,
							columns: [
								'po_number',
								'vendor_id',
								'approved_amount',
								'po_date',
								'status',
							],
						},
						{
							id: 'input_3',
							name: 'Master Contract',
							type: 'pdf',
							description: 'Signed agreement',
							required: true,
							multiple: false,
							columns: [
								'clause_id',
								'description',
								'rate',
								'scope',
								'penalty',
							],
						},
					],
					output: {
						type: 'flags',
						title: 'Vendor Compliance Flags',
						description: 'Contract breaches and overbilling flags',
						fields: [],
					},
					steps: [
						{
							id: 'step_1',
							name: 'Document Ingestion',
							description: 'Parse all inputs',
							type: 'extract',
							dataFiles: ['input_1', 'input_2', 'input_3'],
						},
						{
							id: 'step_2',
							name: 'Invoice–PO Matching',
							description: 'Three-way match',
							type: 'compare',
							dataFiles: ['input_1', 'input_2'],
						},
						{
							id: 'step_3',
							name: 'Rate Variance Check',
							description: 'Flag rate overcharges >2%',
							type: 'flag',
							dataFiles: ['input_1', 'input_3'],
						},
						{
							id: 'step_4',
							name: 'Scope Compliance',
							description: 'Out-of-contract services',
							type: 'validate',
							dataFiles: ['input_1', 'input_3'],
						},
						{
							id: 'step_5',
							name: 'Risk Summary',
							description: 'Rank by exposure',
							type: 'summarize',
							dataFiles: ['input_1', 'input_2'],
						},
					],
					tags: ['vendor', 'contract', 'procurement', 'overbilling'],
					category: 'Procurement Audit',
				}
			: {
					name: 'Invoice Verification & AP Audit',
					description:
						'Validates AP invoices against POs and GL to catch duplicates, fictitious vendors, and coding errors.',
					logicPrompt:
						'Reconcile each invoice against its PO and GL posting. Flag duplicates, unapproved vendors, GL miscoding, and SoD breaches.',
					inputs: [
						{
							id: 'input_1',
							name: 'AP Invoice Register',
							type: 'csv',
							description: 'All invoices in period',
							required: true,
							multiple: false,
							columns: [
								'invoice_no',
								'vendor_id',
								'amount',
								'gl_code',
								'invoice_date',
							],
						},
						{
							id: 'input_2',
							name: 'Vendor Master',
							type: 'csv',
							description: 'Approved vendor list',
							required: true,
							multiple: false,
							columns: [
								'vendor_id',
								'vendor_name',
								'registration_no',
								'status',
								'country',
							],
						},
						{
							id: 'input_3',
							name: 'GL Trial Balance',
							type: 'csv',
							description: 'GL entries',
							required: true,
							multiple: false,
							columns: [
								'gl_code',
								'account_name',
								'debit',
								'credit',
								'period',
							],
						},
						{
							id: 'input_4',
							name: 'Purchase Orders',
							type: 'csv',
							description: 'Approved POs',
							required: false,
							multiple: false,
							columns: [
								'po_number',
								'vendor_id',
								'approved_amount',
								'po_date',
								'requester',
							],
						},
					],
					output: {
						type: 'table',
						title: 'AP Audit Results',
						description: 'Invoice status with exceptions and risk flags',
						fields: [],
					},
					steps: [
						{
							id: 'step_1',
							name: 'Data Ingestion',
							description: 'Load all inputs',
							type: 'extract',
							dataFiles: ['input_1', 'input_2', 'input_3'],
						},
						{
							id: 'step_2',
							name: 'Vendor Validation',
							description: 'Check vendor master',
							type: 'validate',
							dataFiles: ['input_1', 'input_2'],
						},
						{
							id: 'step_3',
							name: 'Duplicate Detection',
							description: 'Find duplicate invoices',
							type: 'flag',
							dataFiles: ['input_1'],
						},
						{
							id: 'step_4',
							name: 'GL Coding Review',
							description: 'Validate account codes',
							type: 'analyze',
							dataFiles: ['input_1', 'input_3'],
						},
						{
							id: 'step_5',
							name: 'SoD Breach Check',
							description: 'Same requester and approver',
							type: 'flag',
							dataFiles: ['input_1', 'input_4'],
						},
						{
							id: 'step_6',
							name: 'Summary',
							description: 'Clean vs exception totals',
							type: 'summarize',
							dataFiles: ['input_1', 'input_2', 'input_3'],
						},
					],
					tags: ['ap', 'invoice', 'duplicate', 'gl', 'sod'],
					category: 'Financial Audit',
				};

	return {
		workflow,
		message: `I've designed the **${workflow.name}** workflow with ${workflow.inputs.length} inputs and ${workflow.steps.length} steps. Review the preview on the right, then save to run it.`,
	};
}

export async function runWorkflow(workflow) {
	await new Promise((r) => setTimeout(r, 1200));
	const type = workflow.output?.type ?? 'flags';

	if (type === 'flags') {
		return {
			type: 'flags',
			title: workflow.output?.title ?? 'Audit Findings',
			summary:
				'4 issues detected — 1 critical, 2 high, 1 medium. Immediate review recommended.',
			metrics: { records_analyzed: 1842, issues_found: 4, risk_level: 'high' },
			flags: [
				{
					id: 'F-001',
					description:
						'Employee ID EMP-4821 appears in payroll but not in HR master. Possible ghost employee.',
					severity: 'critical',
					reference: 'Payroll row 214 — ₹87,500/month',
					recommendation: 'Freeze payment and verify identity with HR.',
				},
				{
					id: 'F-002',
					description:
						'Bank account ending 9034 shared by EMP-1103 and EMP-2287. Duplicate payment risk.',
					severity: 'high',
					reference: 'Payroll rows 89 & 312',
					recommendation: 'Verify ownership before next payroll run.',
				},
				{
					id: 'F-003',
					description:
						'EMP-0567 gross pay ₹2,14,000 exceeds Grade B3 ceiling of ₹1,90,000 by ₹24,000.',
					severity: 'high',
					reference: 'Payroll row 58',
					recommendation: 'Obtain exception letter or correct entry.',
				},
				{
					id: 'F-004',
					description:
						'Retroactive adjustment of ₹42,000 for EMP-1890 lacks approver sign-off.',
					severity: 'medium',
					reference: 'Payroll row 401',
					recommendation: 'Obtain retrospective approval within 5 days.',
				},
			],
		};
	}

	if (type === 'table') {
		return {
			type: 'table',
			title: workflow.output?.title ?? 'Audit Results',
			summary:
				'24 invoices processed. 5 exceptions — 2 duplicates, 2 unapproved vendors, 1 GL miscoding.',
			metrics: { records_analyzed: 24, issues_found: 5, risk_level: 'medium' },
			table: {
				headers: [
					'Invoice No',
					'Vendor',
					'Amount (₹)',
					'Status',
					'Exception',
				],
				rows: [
					['INV-001', 'Tata Consultancy', '4,82,000', 'Clean', '—'],
					['INV-002', 'Infosys Ltd', '2,15,500', 'Clean', '—'],
					[
						'INV-003',
						'Apex Supplies',
						'98,750',
						'Exception',
						'Unapproved vendor',
					],
					['INV-004', 'Wipro Technologies', '3,67,000', 'Clean', '—'],
					[
						'INV-005',
						'Apex Supplies',
						'98,750',
						'Duplicate',
						'Duplicate of INV-003',
					],
					[
						'INV-006',
						'Reliance Industries',
						'1,24,000',
						'Exception',
						'GL suspense account',
					],
					['INV-007', 'HCL Technologies', '5,90,000', 'Clean', '—'],
					[
						'INV-008',
						'Shadow Ventures LLC',
						'74,000',
						'Exception',
						'Foreign entity, no registration',
					],
					['INV-009', 'Mahindra & Mahindra', '2,88,000', 'Clean', '—'],
					[
						'INV-010',
						'Tata Consultancy',
						'4,82,000',
						'Duplicate',
						'Same invoice resubmitted',
					],
				],
			},
		};
	}

	return {
		type: 'summary',
		title: workflow.output?.title ?? 'Audit Summary',
		summary: 'Audit complete. 3 items require follow-up.',
		metrics: { records_analyzed: 320, issues_found: 3, risk_level: 'medium' },
		data: { total_records: 320, clean_records: 317, exceptions: 3 },
	};
}
