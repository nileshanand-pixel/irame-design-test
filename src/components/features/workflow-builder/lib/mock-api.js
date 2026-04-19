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
						columnUsage: {
							input_1: [
								{ column: 'emp_id', role: 'join_key' },
								{ column: 'emp_name', role: 'output' },
								{ column: 'gross_pay', role: 'output' },
								{ column: 'bank_account', role: 'output' },
								{ column: 'department', role: 'filter' },
								{ column: 'pay_date', role: 'filter' },
							],
							input_2: [
								{ column: 'employee_id', role: 'join_key' },
								{ column: 'full_name', role: 'output' },
								{ column: 'grade', role: 'filter' },
								{ column: 'approved_salary', role: 'compare' },
								{ column: 'joining_date', role: 'filter' },
							],
						},
					},
					{
						id: 'step_2',
						name: 'Ghost Employee Check',
						description: 'IDs in payroll not in HR',
						type: 'compare',
						dataFiles: ['input_1', 'input_2'],
						columnUsage: {
							input_1: [
								{ column: 'emp_id', role: 'join_key' },
								{ column: 'emp_name', role: 'output' },
								{ column: 'department', role: 'filter' },
							],
							input_2: [
								{ column: 'employee_id', role: 'join_key' },
								{ column: 'full_name', role: 'compare' },
							],
						},
					},
					{
						id: 'step_3',
						name: 'Duplicate Bank Scan',
						description: 'Shared bank accounts',
						type: 'flag',
						dataFiles: ['input_1'],
						columnUsage: {
							input_1: [
								{ column: 'emp_id', role: 'output' },
								{ column: 'emp_name', role: 'output' },
								{ column: 'bank_account', role: 'compare' },
							],
						},
					},
					{
						id: 'step_4',
						name: 'Salary Band Validation',
						description: 'Pay vs approved band',
						type: 'validate',
						dataFiles: ['input_1', 'input_3'],
						columnUsage: {
							input_1: [
								{ column: 'emp_id', role: 'join_key' },
								{ column: 'gross_pay', role: 'compare' },
								{ column: 'department', role: 'filter' },
							],
							input_3: [
								{ column: 'grade', role: 'join_key' },
								{ column: 'min_salary', role: 'compare' },
								{ column: 'max_salary', role: 'compare' },
							],
						},
					},
					{
						id: 'step_5',
						name: 'Executive Summary',
						description: 'Risk-ranked findings',
						type: 'summarize',
						dataFiles: ['input_1', 'input_2'],
						columnUsage: {
							input_1: [
								{ column: 'emp_id', role: 'output' },
								{ column: 'emp_name', role: 'output' },
								{ column: 'gross_pay', role: 'output' },
								{ column: 'department', role: 'filter' },
							],
							input_2: [
								{ column: 'employee_id', role: 'join_key' },
								{ column: 'full_name', role: 'output' },
								{ column: 'grade', role: 'output' },
							],
						},
					},
				],
				tags: ['payroll', 'ghost-employee', 'fraud', 'hr'],
				category: 'HR & Payroll',
				racm: {
					risks: [
						{
							id: 'R-HR-001',
							description:
								'Ghost employees on the payroll leading to fraudulent disbursements',
							category: 'Fraud',
							rating: 'High',
							likelihood: 'Medium',
							impact: 'High',
							processArea: 'Payroll Processing',
							assertions: ['Existence', 'Occurrence'],
							preSelected: true,
							controls: [
								{
									id: 'C-HR-001',
									activity:
										'Monthly reconciliation of payroll register against HR master headcount',
									type: 'Detective',
									nature: 'Manual',
									frequency: 'Monthly',
									owner: 'HR Manager',
									effectiveness: 'effective',
									preSelected: true,
								},
								{
									id: 'C-HR-002',
									activity:
										'System-enforced unique employee ID validation before payroll processing',
									type: 'Preventive',
									nature: 'Automated',
									frequency: 'Per Transaction',
									owner: 'HRIS System',
									effectiveness: 'effective',
									preSelected: true,
								},
							],
						},
						{
							id: 'R-HR-002',
							description:
								'Duplicate or excess salary payments due to shared bank accounts or data entry errors',
							category: 'Financial',
							rating: 'High',
							likelihood: 'Medium',
							impact: 'High',
							processArea: 'Payroll Disbursement',
							assertions: ['Accuracy', 'Valuation'],
							preSelected: true,
							controls: [
								{
									id: 'C-HR-003',
									activity:
										'Pre-disbursement review of bank account uniqueness across all active employees',
									type: 'Preventive',
									nature: 'Manual',
									frequency: 'Per Payroll Run',
									owner: 'Payroll Lead',
									effectiveness: 'effective',
									preSelected: true,
								},
							],
						},
						{
							id: 'R-HR-003',
							description:
								'Salary payments exceeding approved compensation bands without proper authorization',
							category: 'Compliance',
							rating: 'Medium',
							likelihood: 'Low',
							impact: 'High',
							processArea: 'Compensation Management',
							assertions: ['Valuation', 'Completeness'],
							preSelected: false,
							controls: [],
						},
						{
							id: 'R-HR-004',
							description:
								'Unauthorized retroactive salary adjustments lacking approval trail',
							category: 'Operational',
							rating: 'Medium',
							likelihood: 'Medium',
							impact: 'Medium',
							processArea: 'Payroll Adjustments',
							assertions: ['Occurrence', 'Accuracy'],
							preSelected: false,
							controls: [
								{
									id: 'C-HR-004',
									activity:
										'Dual-authorization workflow for all retroactive pay adjustments above threshold',
									type: 'Preventive',
									nature: 'Manual',
									frequency: 'Per Transaction',
									owner: 'Finance Controller',
									effectiveness: 'needs_improvement',
									preSelected: false,
								},
							],
						},
					],
					availableRisks: [
						{
							id: 'R-HR-005',
							description:
								'Segregation of duties violation between payroll preparation and approval',
							category: 'Operational',
							rating: 'High',
						},
						{
							id: 'R-HR-006',
							description:
								'Untimely payroll processing leading to regulatory penalties',
							category: 'Compliance',
							rating: 'Medium',
						},
					],
					availableControls: [
						{
							id: 'C-HR-010',
							activity:
								'Quarterly internal audit of payroll transactions',
							type: 'Detective',
							nature: 'Manual',
							frequency: 'Quarterly',
							owner: 'Internal Audit',
						},
						{
							id: 'C-HR-011',
							activity:
								'Automated SoD enforcement in payroll system access controls',
							type: 'Preventive',
							nature: 'Automated',
							frequency: 'Continuous',
							owner: 'IT Security',
						},
					],
				},
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
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'join_key' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'amount', role: 'output' },
									{ column: 'invoice_date', role: 'filter' },
									{ column: 'po_reference', role: 'join_key' },
								],
								input_2: [
									{ column: 'po_number', role: 'join_key' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'approved_amount', role: 'compare' },
									{ column: 'po_date', role: 'filter' },
									{ column: 'status', role: 'filter' },
								],
								input_3: [
									{ column: 'clause_id', role: 'join_key' },
									{ column: 'description', role: 'output' },
									{ column: 'rate', role: 'compare' },
									{ column: 'scope', role: 'filter' },
									{ column: 'penalty', role: 'output' },
								],
							},
						},
						{
							id: 'step_2',
							name: 'Invoice\u2013PO Matching',
							description: 'Three-way match',
							type: 'compare',
							dataFiles: ['input_1', 'input_2'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'join_key' },
									{ column: 'amount', role: 'compare' },
									{ column: 'po_reference', role: 'join_key' },
								],
								input_2: [
									{ column: 'po_number', role: 'join_key' },
									{ column: 'approved_amount', role: 'compare' },
								],
							},
						},
						{
							id: 'step_3',
							name: 'Rate Variance Check',
							description: 'Flag rate overcharges >2%',
							type: 'flag',
							dataFiles: ['input_1', 'input_3'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'amount', role: 'compare' },
								],
								input_3: [
									{ column: 'rate', role: 'compare' },
									{ column: 'scope', role: 'filter' },
									{ column: 'penalty', role: 'output' },
								],
							},
						},
						{
							id: 'step_4',
							name: 'Scope Compliance',
							description: 'Out-of-contract services',
							type: 'validate',
							dataFiles: ['input_1', 'input_3'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'amount', role: 'compare' },
								],
								input_3: [
									{ column: 'clause_id', role: 'join_key' },
									{ column: 'description', role: 'filter' },
									{ column: 'scope', role: 'compare' },
								],
							},
						},
						{
							id: 'step_5',
							name: 'Risk Summary',
							description: 'Rank by exposure',
							type: 'summarize',
							dataFiles: ['input_1', 'input_2'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'amount', role: 'output' },
								],
								input_2: [
									{ column: 'po_number', role: 'output' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'approved_amount', role: 'output' },
								],
							},
						},
					],
					tags: ['vendor', 'contract', 'procurement', 'overbilling'],
					category: 'Procurement Audit',
					racm: {
						risks: [
							{
								id: 'R-PR-001',
								description:
									'Overbilling by vendors through rate inflation beyond contracted terms',
								category: 'Financial',
								rating: 'High',
								likelihood: 'High',
								impact: 'High',
								processArea: 'Vendor Invoicing',
								assertions: ['Accuracy', 'Valuation'],
								preSelected: true,
								controls: [
									{
										id: 'C-PR-001',
										activity:
											'Three-way match of invoice, PO, and GRN before payment approval',
										type: 'Preventive',
										nature: 'Manual',
										frequency: 'Per Transaction',
										owner: 'AP Manager',
										effectiveness: 'effective',
										preSelected: true,
									},
								],
							},
							{
								id: 'R-PR-002',
								description:
									'Payments for out-of-scope services not covered under the master contract',
								category: 'Compliance',
								rating: 'High',
								likelihood: 'Medium',
								impact: 'High',
								processArea: 'Contract Management',
								assertions: ['Occurrence', 'Completeness'],
								preSelected: true,
								controls: [
									{
										id: 'C-PR-002',
										activity:
											'Contract scope validation against invoice line items before processing',
										type: 'Preventive',
										nature: 'Manual',
										frequency: 'Per Transaction',
										owner: 'Procurement Lead',
										effectiveness: 'needs_improvement',
										preSelected: true,
									},
								],
							},
							{
								id: 'R-PR-003',
								description:
									'Duplicate invoice submissions leading to excess payments',
								category: 'Financial',
								rating: 'Medium',
								likelihood: 'Medium',
								impact: 'Medium',
								processArea: 'Invoice Processing',
								assertions: ['Existence', 'Occurrence'],
								preSelected: false,
								controls: [],
							},
						],
						availableRisks: [
							{
								id: 'R-PR-004',
								description:
									'Vendor kickbacks through inflated contract awards',
								category: 'Fraud',
								rating: 'High',
							},
							{
								id: 'R-PR-005',
								description:
									'Missing GRN documentation for received goods',
								category: 'Operational',
								rating: 'Medium',
							},
						],
						availableControls: [
							{
								id: 'C-PR-010',
								activity:
									'Annual vendor contract renewal review by legal',
								type: 'Detective',
								nature: 'Manual',
								frequency: 'Annual',
								owner: 'Legal Team',
							},
							{
								id: 'C-PR-011',
								activity:
									'Automated duplicate invoice detection before payment batch',
								type: 'Preventive',
								nature: 'Automated',
								frequency: 'Per Batch',
								owner: 'ERP System',
							},
						],
					},
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
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'join_key' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'amount', role: 'output' },
									{ column: 'gl_code', role: 'output' },
									{ column: 'invoice_date', role: 'filter' },
								],
								input_2: [
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'registration_no', role: 'output' },
									{ column: 'status', role: 'filter' },
									{ column: 'country', role: 'filter' },
								],
								input_3: [
									{ column: 'gl_code', role: 'join_key' },
									{ column: 'account_name', role: 'output' },
									{ column: 'debit', role: 'output' },
									{ column: 'credit', role: 'output' },
									{ column: 'period', role: 'filter' },
								],
							},
						},
						{
							id: 'step_2',
							name: 'Vendor Validation',
							description: 'Check vendor master',
							type: 'validate',
							dataFiles: ['input_1', 'input_2'],
							columnUsage: {
								input_1: [
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'invoice_no', role: 'output' },
								],
								input_2: [
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'vendor_name', role: 'output' },
									{ column: 'status', role: 'filter' },
								],
							},
						},
						{
							id: 'step_3',
							name: 'Duplicate Detection',
							description: 'Find duplicate invoices',
							type: 'flag',
							dataFiles: ['input_1'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'compare' },
									{ column: 'vendor_id', role: 'compare' },
									{ column: 'amount', role: 'compare' },
									{ column: 'invoice_date', role: 'filter' },
								],
							},
						},
						{
							id: 'step_4',
							name: 'GL Coding Review',
							description: 'Validate account codes',
							type: 'analyze',
							dataFiles: ['input_1', 'input_3'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'gl_code', role: 'join_key' },
									{ column: 'amount', role: 'compare' },
								],
								input_3: [
									{ column: 'gl_code', role: 'join_key' },
									{ column: 'account_name', role: 'output' },
								],
							},
						},
						{
							id: 'step_5',
							name: 'SoD Breach Check',
							description: 'Same requester and approver',
							type: 'flag',
							dataFiles: ['input_1', 'input_4'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'amount', role: 'output' },
								],
								input_4: [
									{ column: 'po_number', role: 'output' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'requester', role: 'compare' },
								],
							},
						},
						{
							id: 'step_6',
							name: 'Summary',
							description: 'Clean vs exception totals',
							type: 'summarize',
							dataFiles: ['input_1', 'input_2', 'input_3'],
							columnUsage: {
								input_1: [
									{ column: 'invoice_no', role: 'output' },
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'amount', role: 'output' },
								],
								input_2: [
									{ column: 'vendor_id', role: 'join_key' },
									{ column: 'vendor_name', role: 'output' },
								],
								input_3: [
									{ column: 'gl_code', role: 'join_key' },
									{ column: 'account_name', role: 'output' },
									{ column: 'debit', role: 'output' },
									{ column: 'credit', role: 'output' },
								],
							},
						},
					],
					tags: ['ap', 'invoice', 'duplicate', 'gl', 'sod'],
					category: 'Financial Audit',
					racm: {
						risks: [
							{
								id: 'R-AP-001',
								description:
									'Duplicate invoice payments resulting in financial leakage',
								category: 'Financial',
								rating: 'High',
								likelihood: 'High',
								impact: 'High',
								processArea: 'Accounts Payable',
								assertions: ['Existence', 'Occurrence'],
								preSelected: true,
								controls: [
									{
										id: 'C-AP-001',
										activity:
											'Automated duplicate detection on invoice number, amount, and vendor before payment',
										type: 'Preventive',
										nature: 'Automated',
										frequency: 'Per Transaction',
										owner: 'ERP System',
										effectiveness: 'effective',
										preSelected: true,
									},
									{
										id: 'C-AP-002',
										activity:
											'Monthly AP aging review to identify and reverse duplicate postings',
										type: 'Detective',
										nature: 'Manual',
										frequency: 'Monthly',
										owner: 'AP Manager',
										effectiveness: 'effective',
										preSelected: true,
									},
								],
							},
							{
								id: 'R-AP-002',
								description:
									'Payments to unapproved or fictitious vendors',
								category: 'Fraud',
								rating: 'Critical',
								likelihood: 'Low',
								impact: 'Critical',
								processArea: 'Vendor Management',
								assertions: ['Existence', 'Accuracy'],
								preSelected: true,
								controls: [
									{
										id: 'C-AP-003',
										activity:
											'Vendor master onboarding requires dual approval with KYC documentation',
										type: 'Preventive',
										nature: 'Manual',
										frequency: 'Per Vendor',
										owner: 'Procurement Head',
										effectiveness: 'effective',
										preSelected: true,
									},
								],
							},
							{
								id: 'R-AP-003',
								description:
									'GL miscoding causing inaccurate financial reporting',
								category: 'Financial',
								rating: 'Medium',
								likelihood: 'Medium',
								impact: 'Medium',
								processArea: 'General Ledger',
								assertions: ['Accuracy', 'Presentation'],
								preSelected: true,
								controls: [
									{
										id: 'C-AP-004',
										activity:
											'GL account validation rules enforced at invoice entry with valid code lookup',
										type: 'Preventive',
										nature: 'Automated',
										frequency: 'Per Transaction',
										owner: 'ERP System',
										effectiveness: 'needs_improvement',
										preSelected: true,
									},
								],
							},
							{
								id: 'R-AP-004',
								description:
									'Segregation of duties breach between purchase requisition, approval, and payment',
								category: 'Operational',
								rating: 'High',
								likelihood: 'Medium',
								impact: 'High',
								processArea: 'Procure-to-Pay',
								assertions: ['Occurrence'],
								preSelected: false,
								controls: [],
							},
						],
						availableRisks: [
							{
								id: 'R-AP-005',
								description:
									'Unauthorized changes to vendor bank details before payment run',
								category: 'Fraud',
								rating: 'Critical',
							},
							{
								id: 'R-AP-006',
								description:
									'Late payment penalties due to delayed invoice processing',
								category: 'Operational',
								rating: 'Low',
							},
						],
						availableControls: [
							{
								id: 'C-AP-010',
								activity:
									'Quarterly SoD access review across procure-to-pay roles',
								type: 'Detective',
								nature: 'Manual',
								frequency: 'Quarterly',
								owner: 'Internal Audit',
							},
							{
								id: 'C-AP-011',
								activity:
									'Automated three-way match (PO, GRN, Invoice) before payment release',
								type: 'Preventive',
								nature: 'Automated',
								frequency: 'Per Transaction',
								owner: 'ERP System',
							},
						],
					},
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
				'4 issues detected \u2014 1 critical, 2 high, 1 medium. Immediate review recommended.',
			metrics: { records_analyzed: 1842, issues_found: 4, risk_level: 'high' },
			flags: [
				{
					id: 'F-001',
					description:
						'Employee ID EMP-4821 appears in payroll but not in HR master. Possible ghost employee.',
					severity: 'critical',
					reference: 'Payroll row 214 \u2014 \u20b987,500/month',
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
						'EMP-0567 gross pay \u20b92,14,000 exceeds Grade B3 ceiling of \u20b91,90,000 by \u20b924,000.',
					severity: 'high',
					reference: 'Payroll row 58',
					recommendation: 'Obtain exception letter or correct entry.',
				},
				{
					id: 'F-004',
					description:
						'Retroactive adjustment of \u20b942,000 for EMP-1890 lacks approver sign-off.',
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
				'24 invoices processed. 5 exceptions \u2014 2 duplicates, 2 unapproved vendors, 1 GL miscoding.',
			metrics: { records_analyzed: 24, issues_found: 5, risk_level: 'medium' },
			table: {
				headers: [
					'Invoice No',
					'Vendor',
					'Amount (\u20b9)',
					'Status',
					'Exception',
				],
				rows: [
					['INV-001', 'Tata Consultancy', '4,82,000', 'Clean', '\u2014'],
					['INV-002', 'Infosys Ltd', '2,15,500', 'Clean', '\u2014'],
					[
						'INV-003',
						'Apex Supplies',
						'98,750',
						'Exception',
						'Unapproved vendor',
					],
					['INV-004', 'Wipro Technologies', '3,67,000', 'Clean', '\u2014'],
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
					['INV-007', 'HCL Technologies', '5,90,000', 'Clean', '\u2014'],
					[
						'INV-008',
						'Shadow Ventures LLC',
						'74,000',
						'Exception',
						'Foreign entity, no registration',
					],
					[
						'INV-009',
						'Mahindra & Mahindra',
						'2,88,000',
						'Clean',
						'\u2014',
					],
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

/* ────────────────────────────────────────────────────────────
   Analytics — cross-run comparison data for a workflow
   ──────────────────────────────────────────────────────────── */

export function getAnalyticsData(_workflowId) {
	const runs = [
		{
			id: 'run-8921',
			date: '2025-03-14T01:54:00Z',
			user: 'Samarth C.',
			status: 'completed',
			anomalyCount: 8,
			totalVariance: 875000,
			confidence: 94,
		},
		{
			id: 'run-8845',
			date: '2025-03-10T11:20:00Z',
			user: 'System (Auto)',
			status: 'completed',
			anomalyCount: 12,
			totalVariance: 1240000,
			confidence: 92,
		},
		{
			id: 'run-8712',
			date: '2025-03-05T09:15:00Z',
			user: 'Ayush T.',
			status: 'completed',
			anomalyCount: 16,
			totalVariance: 1680000,
			confidence: 89,
		},
		{
			id: 'run-8650',
			date: '2025-02-28T16:30:00Z',
			user: 'Samarth C.',
			status: 'completed',
			anomalyCount: 4,
			totalVariance: 350000,
			confidence: 91,
		},
	];

	const kpis = {
		totalAnomalies: { value: 20, delta: -23, polarity: 'negative' },
		totalVariance: { value: 2430000, delta: 19.7, polarity: 'negative' },
		avgConfidence: { value: 93, delta: 3.3, polarity: 'positive' },
		resolutionRate: { value: 72, delta: 12.5, polarity: 'positive' },
	};

	const anomalies = [
		{
			id: 'A-001',
			entity: 'Madison Media',
			description: 'Rate slab mismatch for print ads',
			type: 'overpaid',
			amount: 45000,
			variance: 15.2,
			runId: 'run-8921',
			recurring: true,
			occurrences: 3,
		},
		{
			id: 'A-002',
			entity: 'Titan Brand Ads',
			description: 'Missing supporting metadata',
			type: 'underpaid',
			amount: 12000,
			variance: 5.4,
			runId: 'run-8921',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-003',
			entity: 'Invoice #INV-442',
			description: 'Recurring duplicate across 3 runs',
			type: 'duplicate',
			amount: 8500,
			variance: 100,
			runId: 'run-8845',
			recurring: true,
			occurrences: 3,
		},
		{
			id: 'A-004',
			entity: 'Global Reach',
			description: 'Approved amount exceeds estimate',
			type: 'overpaid',
			amount: 22000,
			variance: 8.1,
			runId: 'run-8712',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-005',
			entity: 'Spark Digital',
			description: 'Vendor not in approved master list',
			type: 'unauthorized',
			amount: 67000,
			variance: 100,
			runId: 'run-8921',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-006',
			entity: 'Zenith Corp',
			description: 'Duplicate PO reference across invoices',
			type: 'duplicate',
			amount: 34000,
			variance: 100,
			runId: 'run-8845',
			recurring: true,
			occurrences: 2,
		},
		{
			id: 'A-007',
			entity: 'Horizon Logistics',
			description: 'Freight charge exceeds contracted rate',
			type: 'overpaid',
			amount: 18500,
			variance: 12.3,
			runId: 'run-8712',
			recurring: true,
			occurrences: 2,
		},
		{
			id: 'A-008',
			entity: 'Apex Supplies',
			description: 'Credit note not applied to invoice',
			type: 'underpaid',
			amount: 9200,
			variance: 4.1,
			runId: 'run-8712',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-009',
			entity: 'Madison Media',
			description: 'Late payment penalty not waived per contract',
			type: 'overpaid',
			amount: 15000,
			variance: 6.7,
			runId: 'run-8845',
			recurring: true,
			occurrences: 2,
		},
		{
			id: 'A-010',
			entity: 'ClearView Analytics',
			description: 'Service period outside contract term',
			type: 'unauthorized',
			amount: 43000,
			variance: 100,
			runId: 'run-8650',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-011',
			entity: 'FreshPrint Co.',
			description: 'Quantity billed exceeds delivery receipt',
			type: 'overpaid',
			amount: 28000,
			variance: 22.4,
			runId: 'run-8921',
			recurring: false,
			occurrences: 1,
		},
		{
			id: 'A-012',
			entity: 'Invoice #INV-891',
			description: 'Possible duplicate \u2014 similar amount and date',
			type: 'duplicate',
			amount: 11500,
			variance: 100,
			runId: 'run-8650',
			recurring: true,
			occurrences: 2,
		},
	];

	const trendData = [
		{
			label: 'Feb 28',
			runId: 'run-8650',
			anomalies: 4,
			variance: 3.5,
			confidence: 91,
		},
		{
			label: 'Mar 05',
			runId: 'run-8712',
			anomalies: 16,
			variance: 16.8,
			confidence: 89,
		},
		{
			label: 'Mar 10',
			runId: 'run-8845',
			anomalies: 12,
			variance: 12.4,
			confidence: 92,
		},
		{
			label: 'Mar 14',
			runId: 'run-8921',
			anomalies: 8,
			variance: 8.75,
			confidence: 94,
		},
	];

	const breakdownData = [
		{ type: 'Overpaid', count: 8, amount: 1285000 },
		{ type: 'Duplicate', count: 5, amount: 540000 },
		{ type: 'Unauthorized', count: 4, amount: 1100000 },
		{ type: 'Underpaid', count: 3, amount: 212000 },
	];

	const recurringPatterns = [
		{
			entity: 'Madison Media',
			issue: 'Rate slab mismatch on print ad billing',
			frequency: '3/4',
			trend: 'worsening',
			firstSeen: 'run-8650',
			latestVariance: 15.2,
			cumulativeExposure: 135000,
		},
		{
			entity: 'Invoice #INV-442',
			issue: 'Recurring duplicate invoice submission',
			frequency: '3/4',
			trend: 'stable',
			firstSeen: 'run-8712',
			latestVariance: 100,
			cumulativeExposure: 25500,
		},
		{
			entity: 'Horizon Logistics',
			issue: 'Freight overcharge vs contracted rate',
			frequency: '2/4',
			trend: 'improving',
			firstSeen: 'run-8712',
			latestVariance: 12.3,
			cumulativeExposure: 37000,
		},
		{
			entity: 'Zenith Corp',
			issue: 'Duplicate PO references across invoices',
			frequency: '2/4',
			trend: 'stable',
			firstSeen: 'run-8845',
			latestVariance: 100,
			cumulativeExposure: 68000,
		},
	];

	const aiInsights = [
		{
			severity: 'critical',
			title: 'Recurring Overpayment Pattern',
			description:
				'Madison Media shows a recurring 15% variance in print ads across last 3 runs. Cumulative exposure: \u20b91.35L. This pattern is worsening \u2014 variance increased from 11% to 15%.',
			action: 'Investigate vendor',
		},
		{
			severity: 'high',
			title: 'Duplicate Invoice Cluster',
			description:
				'INV-442 has appeared as a duplicate in 3 of 4 runs. Consider adding to exclusion list or escalating to the vendor for correction.',
			action: 'Flag vendor',
		},
		{
			severity: 'info',
			title: 'Confidence Score Trending Up',
			description:
				'Average confidence score improved from 89% to 94% over the last 4 runs, indicating data quality and matching accuracy are improving.',
			action: null,
		},
	];

	const varianceTrend = [
		{ label: 'Feb 28', approved: 1120000, actual: 1155000 },
		{ label: 'Mar 05', approved: 1340000, actual: 1508000 },
		{ label: 'Mar 10', approved: 1280000, actual: 1404000 },
		{ label: 'Mar 14', approved: 1350000, actual: 1437500 },
	];

	return {
		runs,
		kpis,
		anomalies,
		trendData,
		breakdownData,
		recurringPatterns,
		aiInsights,
		varianceTrend,
	};
}
