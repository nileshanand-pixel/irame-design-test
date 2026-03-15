import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

const JsonViewer = ({ data, onCopy }) => {
	if (!data || typeof data !== 'object') return null;

	const jsonString = JSON.stringify(data, null, 2);

	return (
		<div className="relative">
			<button
				onClick={onCopy}
				className="absolute top-2 right-2 p-1.5 rounded hover:bg-[#E6E2E9] text-[#26064A99] hover:text-[#26064A] transition-colors"
				title="Copy to clipboard"
			>
				<Copy className="size-3.5" />
			</button>
			<pre className="bg-[#f9fafb] border border-[#E5E7EB] rounded p-3 text-xs text-[#26064A] overflow-x-auto max-h-60 overflow-y-auto">
				{jsonString}
			</pre>
		</div>
	);
};

export const AccordionSection = ({ title, isOpen, onToggle, children }) => {
	return (
		<div className="border border-[#E6E2E9] rounded-lg overflow-hidden">
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between p-3 bg-purple-4 transition-colors"
			>
				<span className="text-sm font-semibold text-[#26064A]">{title}</span>
				{isOpen ? (
					<ChevronUp className="size-4 text-[#26064A99]" />
				) : (
					<ChevronDown className="size-4 text-[#26064A99]" />
				)}
			</button>
			{isOpen && <div className="p-3 bg-purple-4 pt-0">{children}</div>}
		</div>
	);
};

export default function AdditionalDetailsAccordion({ log }) {
	const [openSections, setOpenSections] = useState({
		metadata: false,
		technical: false,
	});

	const toggleSection = (section) => {
		setOpenSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const handleCopyJson = (data, label) => {
		try {
			navigator.clipboard.writeText(JSON.stringify(data, null, 2));
			toast.success(`${label} copied to clipboard`);
		} catch (error) {
			toast.error('Failed to copy');
		}
	};

	const hasMetadata = log.details && Object.keys(log.details).length > 0;
	const hasTechnical =
		log.technical &&
		(log.technical.source ||
			log.technical.request_id ||
			log.technical.correlation_id ||
			log.technical.ip_address ||
			log.technical.user_agent);

	return (
		<div className="space-y-3">
			<AccordionSection
				title="Log Metadata"
				isOpen={openSections.metadata}
				onToggle={() => toggleSection('metadata')}
			>
				{hasMetadata ? (
					<JsonViewer
						data={log.details}
						onCopy={() => handleCopyJson(log.details, 'Metadata')}
					/>
				) : (
					<div className="text-xs text-[#26064A99] italic py-2">
						No metadata available for this log
					</div>
				)}
			</AccordionSection>
		</div>
	);
}
