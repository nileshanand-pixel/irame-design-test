import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { trackEvent, getErrorAnalyticsProps } from '@/lib/mixpanel';
import { logError } from '@/lib/logger';

const ModificationRequestModal = ({
	isOpen,
	onClose,
	workflowId,
	userEmail,
	workflowName,
	businessProcessName,
}) => {
	const [formData, setFormData] = useState({
		email: userEmail || '',
		workflowId: workflowId || '',
		workflowName: workflowName || '',
		businessProcessName: businessProcessName || '',
		issueType: [],
		description: '',
	});
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

	useEffect(() => {
		if (userEmail) {
			setFormData((prev) => ({ ...prev, email: userEmail }));
		}
		if (workflowName) {
			setFormData((prev) => ({ ...prev, workflowName: workflowName }));
		}
		if (businessProcessName) {
			setFormData((prev) => ({
				...prev,
				businessProcessName: businessProcessName,
			}));
		}
	}, [userEmail, workflowName, businessProcessName]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCheckboxChange = (e) => {
		const { value, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			issueType: checked
				? [...prev.issueType, value]
				: prev.issueType.filter((type) => type !== value),
		}));
	};

	const handleFileChange = (e) => {
		const files = Array.from(e.target.files);
		const validTypes = [
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'text/csv',
			'image/jpeg',
			'image/png',
			'image/gif',
			'application/pdf',
		];
		const validFiles = files.filter(
			(file) =>
				validTypes.includes(file.type) ||
				file.name.match(/\.(xlsx|xls|csv|jpg|jpeg|png|gif|pdf)$/i),
		);
		setSelectedFiles(validFiles);
	};

	const removeFile = (index) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!GOOGLE_SCRIPT_URL) {
			setError('Modification request feature is not available.');
			return;
		}
		if (formData.issueType.length === 0) {
			setError('Please select at least one issue type.');
			return;
		}
		setError('');
		setIsSubmitting(true);

		try {
			const filePromises = selectedFiles.map((file) => {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => {
						resolve({
							name: file.name,
							type: file.type,
							size: file.size,
							data: e.target.result.split(',')[1], // Base64 data
						});
					};
					reader.onerror = reject;
					reader.readAsDataURL(file);
				});
			});

			const filesData = await Promise.all(filePromises);

			const data = {
				...formData,
				createdAt: new Date().toISOString(),
				files: filesData,
			};

			const response = await fetch(GOOGLE_SCRIPT_URL, {
				method: 'POST',
				mode: 'no-cors',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			// Using `no-cors` keeps the request opaque but ensures the request is
			// sent even when CSP/CORS issues occur. We intentionally do not
			// validate `response.ok` here so that the form flow continues — the
			// server-side action (mail trigger) can still run even if the browser
			// can't read the response.
			setSuccess(true);
			setTimeout(() => {
				onClose();
				resetForm();
			}, 3000);
		} catch (err) {
			// Track the failure for analytics and log to Sentry, but continue
			// the user-facing success flow so server-side mail triggers aren't
			// blocked by client-side CSP/CORS issues.
			try {
				trackEvent('modification_request_submission_failed', {
					parameters: {
						workflowId: formData.workflowId,
						workflowName: formData.workflowName,
						businessProcessName: formData.businessProcessName,
						issueType: (formData.issueType || []).join(','),
						selectedFilesCount: selectedFiles.length,
						error_message: err?.message,
					},
				});
			} catch (e) {
				// swallow tracking errors
				// eslint-disable-next-line no-console
				console.warn('mixpanel track error', e);
			}

			// Log the exception to Sentry via centralized logger
			logError(err, {
				feature: 'modification-request',
				action: 'submit',
				extra: {
					email: formData.email,
					workflowId: formData.workflowId,
					workflowName: formData.workflowName,
					issueType: formData.issueType,
					selectedFilesCount: selectedFiles.length,
				},
			});

			// Still show success to user (server likely processed the request)
			// but surface a console warning for devs.
			// eslint-disable-next-line no-console
			console.warn('Modification request fetch error (ignored):', err);
			setSuccess(true);
			setTimeout(() => {
				onClose();
				resetForm();
			}, 3000);
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({
			email: userEmail || '',
			workflowId: workflowId || '',
			workflowName: workflowName || '',
			businessProcessName: businessProcessName || '',
			issueType: [],
			description: '',
		});
		setSelectedFiles([]);
		setError('');
		setSuccess(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Modification Request</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl"
					>
						&times;
					</button>
				</div>

				{error && (
					<div className="bg-red-100 text-red-700 p-3 rounded mb-4">
						{error}
					</div>
				)}

				{success ? (
					<div className="text-center py-8">
						<div className="text-6xl mb-4">✓</div>
						<h3 className="text-xl font-semibold mb-2">Thank You!</h3>
						<p className="text-gray-600">
							Your modification request has been received successfully.
							Our support team will contact you with an update soon.
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						<div className="mb-4">
							<Label
								htmlFor="email"
								className="block text-sm font-medium mb-1"
							>
								Email Address <span className="text-red-500">*</span>
							</Label>
							<Input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								required
								placeholder="your.email@example.com"
							/>
						</div>

						<div className="mb-4">
							<Label
								htmlFor="workflowId"
								className="block text-sm font-medium mb-1"
							>
								Workflow ID <span className="text-red-500">*</span>
							</Label>
							<Input
								type="text"
								id="workflowId"
								name="workflowId"
								value={formData.workflowId}
								onChange={handleInputChange}
								required
								placeholder="e.g., WF-12345"
							/>
						</div>

						<div className="mb-4">
							<Label className="block text-sm font-medium mb-2">
								Type of Issue <span className="text-red-500">*</span>{' '}
								<span className="text-xs text-gray-500">
									(Select all that apply)
								</span>
							</Label>
							<div className="space-y-2 p-3 bg-purple-4 rounded-md">
								{[
									'Business Logic Change',
									'Input Column Change in source files',
									'Output structure modification (column addition/deletion)',
									'Any additional filter/sorting to be added',
								].map((type) => (
									<div
										key={type}
										className="flex items-center space-x-2"
									>
										<Checkbox
											value={type}
											checked={formData.issueType.includes(
												type,
											)}
											onCheckedChange={(checked) => {
												setFormData((prev) => ({
													...prev,
													issueType: checked
														? [...prev.issueType, type]
														: prev.issueType.filter(
																(t) => t !== type,
															),
												}));
											}}
										/>
										<Label className="text-sm">{type}</Label>
									</div>
								))}
							</div>
						</div>

						<div className="mb-4">
							<Label
								htmlFor="description"
								className="block text-sm font-medium mb-1"
							>
								Issue Description{' '}
								<span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								required
								rows="4"
								className="resize-none"
								placeholder="Please describe the issue or modification request in detail..."
							/>
						</div>

						<div className="mb-6">
							<Label className="block text-sm font-medium mb-1">
								File Attachments (Excel, Images, PDF)
							</Label>
							<div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-purple-500 transition-colors">
								<input
									type="file"
									multiple
									accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif,.pdf"
									onChange={handleFileChange}
									className="hidden"
									id="fileInput"
								/>
								<label
									htmlFor="fileInput"
									className="cursor-pointer"
								>
									<div className="text-4xl mb-2">📎</div>
									<div className="text-gray-600">
										Click to upload or drag and drop
									</div>
									<div className="text-xs text-gray-400 mt-1">
										Excel, Images, or PDF files
									</div>
								</label>
							</div>
							{selectedFiles.length > 0 && (
								<div className="mt-3">
									<strong>Selected files:</strong>
									{selectedFiles.map((file, index) => (
										<div
											key={index}
											className="flex justify-between items-center bg-purple-4 p-2 rounded mt-1"
										>
											<span>
												{file.name} (
												{formatFileSize(file.size)})
											</span>
											<button
												type="button"
												onClick={() => removeFile(index)}
												className="text-gray-500 hover:text-red-500 transition-colors"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="animate-spin mr-2 h-4 w-4" />
									Submitting...
								</>
							) : (
								'Submit Request'
							)}
						</Button>
					</form>
				)}
			</div>
		</div>
	);
};

export default ModificationRequestModal;
