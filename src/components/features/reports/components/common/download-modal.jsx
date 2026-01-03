import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { generatePDF } from '@/utils/reportDownload';

export function DownloadModal({ open, onClose, reportId, reportName }) {
	const [format, setFormat] = useState('pdf');
	const [isDownloading, setIsDownloading] = useState(false);

	const handleGenerateDownload = async (format) => {
		if (!reportId) {
			toast.error('Report ID is missing');
			return;
		}

		setIsDownloading(true);
		toast.info('Generating report...');

		try {
			await generatePDF(reportId, reportName, format);
			toast.success('Report downloaded successfully');
			onClose && onClose();
		} catch (error) {
			console.error('Error downloading report:', error);
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Failed to download report';
			toast.error(errorMessage);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="rounded-2xl max-w-lg p-6 bg-white gap-0">
				<div className="flex items-start gap-4">
					<DialogTitle className="text-base text-primary80 font-semibold flex gap-4 items-center">
						<div className="relative flex items-center justify-center w-14 h-14">
							<div className="absolute inset-0 rounded-full bg-purple-8" />
							<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
							<Download className="relative w-5 h-5 text-primary" />
						</div>
						<div className="flex flex-col">
							Download Report
							<p className="text-primary60 text-sm font-normal">
								Select the format to download report.
							</p>
						</div>
					</DialogTitle>
				</div>

				<div className="mt-6 flex flex-col items-center gap-2">
					{[
						// { id: 'docx', label: 'Microsoft Word (.docx)' },
						{ id: 'pdf', label: 'PDF Document (.pdf)' },
					].map((opt) => (
						<div
							key={opt.id}
							onClick={() => setFormat(opt.id)}
							className={`p-3 rounded-md border cursor-pointer w-full
                          ${format === opt.id ? 'bg-purple-50 border-primary' : 'border-primary10'}
                        `}
						>
							<div className="flex items-center gap-2">
								<div
									className={`w-4 h-4 rounded-full border ${format === opt.id ? 'border-primary border-[4px]' : 'border-primary40'}`}
								/>
								<span className="text-primary80">{opt.label}</span>
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-end gap-2 mt-6">
					<Button
						className="text-sm px-4 py-2 bg-primary rounded-lg text-white font-medium"
						onClick={() => handleGenerateDownload(format)}
						disabled={isDownloading}
					>
						{isDownloading ? 'Downloading...' : 'Download'}
					</Button>

					<Button
						variant="outline"
						className="text-sm px-4 py-2 border border-primary rounded-lg !text-primary font-medium"
						onClick={onClose}
						disabled={isDownloading}
					>
						Cancel
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
