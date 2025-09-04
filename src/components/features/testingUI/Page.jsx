import React, { useState } from 'react';
import QueryDisplay from '../new-chat/session/components/QueryDisplay';
import { Button } from '@/components/ui/button';
import ComboBoxOnFire from './ComboBoxOnFire';
import axios from 'axios';
import { toast } from '@/lib/toast';

const TestRoute = () => {
	const [bulkPrompt, setBulkPrompt] = useState([
		{
			id: 1,
			text: 'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful places to see on an upcoming long road trip  Suggest beautiful places to see on an upcoming long road trip Suggest beautiful ',
		},
		{
			id: 2,
			text: 'Suggest beautiful places to see on an upcoming long road trip',
		},
		{
			id: 3,
			text: 'Suggest beautiful places to see on an upcoming long road trip',
		},
	]);
	const [inputUrl, setInputUrl] = useState('');
	const [pdfUrl, setPdfUrl] = useState(null);
	const [loading, setLoading] = useState(false);

	const [step, setStep] = useState(0); // <-- Add this line

	const handleSelection = (item) => {
		// console.log('Selected:', item);
	};

	const options = [
		{
			group: 'X',
			items: [
				{ label: 'Eastern Standard Time (EST)', value: 'EST' },
				{ label: 'Central Standard Time (CST)', value: 'CST' },
			],
		},
		{
			group: 'Z',
			items: [
				{ label: 'Greenwich Mean Time (GMT)', value: 'GMT' },
				{ label: 'Central European Time (CET)', value: 'CET' },
			],
		},
	];

	const base64ToBlob = (base64, mimeType) => {
		const byteCharacters = atob(base64);
		const byteArrays = [];
		for (let offset = 0; offset < byteCharacters.length; offset += 512) {
			const slice = byteCharacters.slice(offset, offset + 512);
			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		return new Blob(byteArrays, { type: mimeType });
	};

	// const handleConvertUrl = async (e) => {
	// 	e.preventDefault();
	// 	setPdfUrl(null);
	// 	setLoading(true);
	// 	const cookies = [
	// 		{
	// 			name: 'termsAccepted',
	// 			value: 'true',
	// 			path: '/',
	// 			domain: '.irame.ai',
	// 		},
	// 	];
	// 	try {
	// 		const response = await axios.post(
	// 			`${import.meta.env.VITE_PDF_SERVER_ENDPOINT}/convert/url`,
	// 			{
	// 				url: inputUrl,
	// 				cookies: cookies,
	// 				waitDelay: '3s',
	// 				responseType: 'base64',
	// 			},
	// 			{ headers: { 'Content-Type': 'application/json' } },
	// 		);

	// 		const pdfBase64 = response.data.pdf;
	// 		const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
	// 		const url = window.URL.createObjectURL(pdfBlob);
	// 		setPdfUrl(url);
	// 	} catch (error) {
	// 		console.error('Failed:', error);
	// 		alert('PDF generation failed.');
	// 	}
	// 	setLoading(false);
	// };

	return (
		<div className="w-full p-20 flex flex-col items-center">
			<button onClick={() => toast.success('success toast')}>
				Show success toast
			</button>
			<button onClick={() => toast.error('error toast')}>
				Show error toast
			</button>
			{step > 0 && (
				<QueryDisplay
					className="w-full"
					bulkPrompt={bulkPrompt}
					prompt=""
					mode="workflow"
				/>
			)}

			{step > 1 && (
				<Button
					variant="outline"
					onClick={() => localStorage.setItem('stopPolling', 'yes')}
					className="rounded-lg mt-4 px-3 py-4 text-purple-100 hover:text-purple-80 bg-purple-8 hover:bg-purple-4 w-full"
				>
					Stop Global Report Polling
				</Button>
			)}

			{step > 2 && (
				<div className="p-10">
					<ComboBoxOnFire
						options={options}
						onSelection={handleSelection}
						placeholder="Select a timezone..."
					/>
				</div>
			)}

			{/* {step > 3 && (
				<div className="w-full max-w-2xl mb-8">
					<form onSubmit={handleConvertUrl} className="flex gap-2 mb-2">
						<input
							type="text"
							placeholder="Enter URL to convert to PDF"
							value={inputUrl}
							onChange={(e) => setInputUrl(e.target.value)}
							className="border px-2 py-1 rounded w-full"
							required
						/>
						<Button type="submit" disabled={loading}>
							{loading ? 'Generating...' : 'Get PDF'}
						</Button>
						{pdfUrl && (
							<Button
								type="button"
								variant="outline"
								onClick={() => window.open(pdfUrl, '_blank')}
							>
								Open in new tab
							</Button>
						)}
					</form>
					{pdfUrl && (
						<iframe
							src={pdfUrl}
							title="PDF Preview"
							width="100%"
							height="500px"
							className="border"
						/>
					)}
				</div>
			)} */}

			{step < 4 && (
				<Button className="mt-8" onClick={() => setStep((prev) => prev + 1)}>
					Next
				</Button>
			)}
		</div>
	);
};

export default TestRoute;
