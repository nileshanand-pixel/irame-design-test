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
			<pre className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3 text-xs text-[#26064A] overflow-x-auto max-h-60 overflow-y-auto">
				{jsonString}
			</pre>
		</div>
	);
};

const AccordionSection = ({ title, isOpen, onToggle, children }) => {
	return (
		<div className="border border-[#E6E2E9] rounded-lg overflow-hidden">
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between p-3 hover:bg-[#F9FAFB] transition-colors"
			>
				<span className="text-sm font-semibold text-[#26064A]">{title}</span>
				{isOpen ? (
					<ChevronUp className="size-4 text-[#26064A99]" />
				) : (
					<ChevronDown className="size-4 text-[#26064A99]" />
				)}
			</button>
			{isOpen && <div className="p-3 pt-0">{children}</div>}
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

	if (!hasMetadata && !hasTechnical) {
		return (
			<div className="border border-[#E6E2E9] rounded-lg p-4">
				<div className="text-sm text-[#26064A99] text-center">
					No additional details available
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{hasMetadata && (
				<AccordionSection
					title="Event Metadata"
					isOpen={openSections.metadata}
					onToggle={() => toggleSection('metadata')}
				>
					<JsonViewer
						data={log.details}
						onCopy={() => handleCopyJson(log.details, 'Metadata')}
					/>
				</AccordionSection>
			)}

			{hasTechnical && (
				<AccordionSection
					title="Technical Information"
					isOpen={openSections.technical}
					onToggle={() => toggleSection('technical')}
				>
					<div className="space-y-2">
						{log.technical.source && (
							<div className="flex justify-between items-start">
								<span className="text-xs text-[#26064A99] font-medium">
									Source
								</span>
								<span className="text-xs text-[#26064A] font-medium capitalize">
									{log.technical.source}
								</span>
							</div>
						)}

						{log.technical.request_id && (
							<div className="flex justify-between items-start gap-2">
								<span className="text-xs text-[#26064A99] font-medium">
									Request ID
								</span>
								<div className="flex items-center gap-1">
									<span className="text-xs text-[#26064A] font-mono max-w-[200px] truncate">
										{log.technical.request_id}
									</span>
									<button
										onClick={() => {
											navigator.clipboard.writeText(
												log.technical.request_id,
											);
											toast.success('Request ID copied');
										}}
										className="p-0.5 rounded hover:bg-[#E6E2E9] text-[#26064A99]"
									>
										<Copy className="size-3" />
									</button>
								</div>
							</div>
						)}

						{log.technical.correlation_id && (
							<div className="flex justify-between items-start gap-2">
								<span className="text-xs text-[#26064A99] font-medium">
									Correlation ID
								</span>
								<div className="flex items-center gap-1">
									<span className="text-xs text-[#26064A] font-mono max-w-[200px] truncate">
										{log.technical.correlation_id}
									</span>
									<button
										onClick={() => {
											navigator.clipboard.writeText(
												log.technical.correlation_id,
											);
											toast.success('Correlation ID copied');
										}}
										className="p-0.5 rounded hover:bg-[#E6E2E9] text-[#26064A99]"
									>
										<Copy className="size-3" />
									</button>
								</div>
							</div>
						)}

						{log.technical.ip_address && (
							<div className="flex justify-between items-start">
								<span className="text-xs text-[#26064A99] font-medium">
									IP Address
								</span>
								<span className="text-xs text-[#26064A] font-mono">
									{log.technical.ip_address}
								</span>
							</div>
						)}

						{log.technical.user_agent && (
							<div>
								<div className="text-xs text-[#26064A99] font-medium mb-1">
									User Agent
								</div>
								<div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-2 text-xs text-[#26064A] break-all">
									{log.technical.user_agent}
								</div>
							</div>
						)}
					</div>
				</AccordionSection>
			)}
		</div>
	);
}
