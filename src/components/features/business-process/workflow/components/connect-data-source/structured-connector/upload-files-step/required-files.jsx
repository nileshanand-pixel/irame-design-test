import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useBreakpoint from '@/hooks/useBreakpoint';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';

const RequiredFiles = ({ requiredFiles }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const breakpoint = useBreakpoint();

	const generateDescription = (fileName, fileType) => {
		if (fileType === 'Excel') {
			return 'Contains data records and business information for analysis and reporting.';
		} else {
			return 'Contains important documentation and reference materials.';
		}
	};

	// Combine all files from csv_files and pdf_files
	const repeatFiles = (files, label) =>
		Array(25)
			.fill(0)
			.flatMap(() =>
				(files || []).map((file) => ({
					name: file.file_name,
					label,
					description:
						file.description ||
						generateDescription(file.file_name, label),
				})),
			);

	const allFiles = [
		...repeatFiles(requiredFiles?.csv_files, 'Excel'),
		...repeatFiles(requiredFiles?.pdf_files, 'PDF'),
	];

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	const renderFiles = () => {
		if (allFiles.length === 0) return null;

		if (!isExpanded) {
			let visibleCount = 2; // Default for xs and smaller breakpoints
			if (breakpoint === 'xl' || breakpoint === '2xl') {
				visibleCount = 4;
			} else if (breakpoint === 'md' || breakpoint === 'lg') {
				visibleCount = 3;
			}
			const visibleFiles = allFiles.slice(0, visibleCount);
			const remainingFiles = allFiles.slice(visibleCount);
			const remainingCount = remainingFiles.length;

			return (
				<div className="px-4 py-4">
					<div className="flex flex-wrap items-center gap-6 text-primary100">
						{visibleFiles.map((file, index) => (
							<div
								key={index}
								className="flex items-center gap-2 border border-[#F0F1F3] p-2 rounded-lg"
							>
								<span className="text-sm font-medium">
									{file.name}
								</span>
								<span className="text-xs text-[#344054] bg-[#F2F4F7] px-2 py-1 rounded-full">
									{file.label}
								</span>
							</div>
						))}
						{remainingCount > 0 && (
							<HoverCard closeDelay={100} openDelay={50}>
								<HoverCardTrigger asChild>
									<div className="cursor-pointer text-xs text-[#344054] bg-[#F2F4F7] px-2 py-1 rounded-full">
										+{remainingCount} files
									</div>
								</HoverCardTrigger>
								<HoverCardContent className="w-80 p-0" align="start">
									<div className="max-h-80 overflow-y-auto show-scrollbar p-2">
										<h4 className="text-sm font-medium text-slate-700 mb-2 px-2">
											Remaining Files
										</h4>
										<div className="space-y-2">
											{remainingFiles.map((file, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md"
												>
													<span className="text-sm font-medium text-slate-800">
														{file.name}
													</span>
													<span className="text-xs text-[#344054] bg-[#F2F4F7] px-2 py-1 rounded-full">
														{file.label}
													</span>
												</div>
											))}
										</div>
										{/* {remainingFiles.length > 10 && (
											<div className="text-xs text-slate-500 mt-2 px-2">
												+{remainingFiles.length - 10} more
												files
											</div>
										)} */}
									</div>
								</HoverCardContent>
							</HoverCard>
						)}
					</div>
				</div>
			);
		}

		return (
			<div className="py-4 px-4 max-h-[12rem] show-scrollbar overflow-y-auto">
				<div className="grid grid-cols-2 gap-4 ">
					{allFiles.map((file, index) => (
						<div
							key={index}
							className="border border-slate-200 rounded-lg p-4 bg-white space-y-2"
						>
							<div className="flex items-start justify-between">
								<h4 className="text-sm font-semibold text-slate-800 leading-tight">
									{file.name}
								</h4>
								<span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded ml-2 flex-shrink-0">
									{file.label}
								</span>
							</div>
							<p className="text-xs text-slate-500 leading-relaxed">
								{file.description}
							</p>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="border border-[rgba(0,0,0,0.1)] rounded-lg bg-white">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(0,0,0,0.1)]">
				<div className="flex items-center gap-2">
					<FileText className="w-5 h-5 text-gray-600" />
					<h3 className="text-base font-medium text-gray-900">
						Required Files
					</h3>
				</div>
				<Button
					variant="transparent"
					// size="sm"
					onClick={toggleExpanded}
					className="flex items-center gap-2 text-xs text-primary80 h-auto p-1"
				>
					{isExpanded ? 'Click to Collapse' : 'Click to Expand'}
					{isExpanded ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</Button>
			</div>

			{/* Files Content */}
			<div className="">{renderFiles()}</div>
		</div>
	);
};

export default RequiredFiles;
