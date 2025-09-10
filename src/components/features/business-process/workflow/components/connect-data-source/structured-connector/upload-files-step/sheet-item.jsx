import { useState } from 'react';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export const SheetItem = ({
	sheet,
	isLastSheet,
	onDeleteSheet,
	isDeleting = false,
}) => {
	const getStatusIcon = () => {
		if (sheet.status === 'FAILED' || sheet.status === 'ERROR') {
			return <Warning weight="fill" className="w-4 h-4 text-red-500" />;
		}
		if (sheet.status === 'SUCCESS') {
			return <CheckCircle weight="fill" className="w-4 h-4 text-green-500" />;
		}
		return null;
	};

	const getStatusText = () => {
		if (sheet.status === 'FAILED' || sheet.status === 'ERROR') {
			return 'Processing Failed';
		}
		if (sheet.status === 'SUCCESS') {
			return 'Success';
		}
		return sheet.status || 'Unknown';
	};

	const handleDelete = () => {
		onDeleteSheet?.(sheet, isLastSheet);
	};

	const StatusDisplay = () => {
		const hasError = sheet.status === 'FAILED' || sheet.status === 'ERROR';
		const errorMessage = sheet.message || 'An error occurred during processing';

		if (hasError) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex gap-1 items-center cursor-help">
								{getStatusIcon()}
								<span className="text-xs text-destructive font-normal">
									{getStatusText()}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{errorMessage}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}

		return (
			<div className="flex gap-1 items-center">
				{getStatusIcon()}
				<span className="text-xs text-primary100 font-normal">
					{getStatusText()}
				</span>
			</div>
		);
	};

	return (
		<div className="flex items-center justify-between border-l-2 border-gray-100 pl-4 py-2 ml-4">
			<div className="flex items-center gap-3 flex-1">
				<div className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-blue-50">
					<span className="text-xs font-bold text-blue-600">SH</span>
				</div>

				<div className="flex flex-1 justify-between items-center">
					<div className="flex flex-col">
						<span className="text-sm font-medium text-primary100 truncate max-w-[12rem]">
							{sheet.worksheet || 'Unnamed Sheet'}
						</span>
						<span className="text-xs text-primary80 font-normal">
							Sheet
						</span>
					</div>

					<div className="flex items-center gap-3">
						<StatusDisplay />

						<Button
							variant="ghost"
							size="sm"
							onClick={handleDelete}
							disabled={isDeleting}
							className="text-gray-400 hover:text-destructive p-1 h-auto"
						>
							{isDeleting ? (
								<div className="w-4 h-4">
									<svg
										className="animate-spin w-4 h-4 text-gray-400"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								</div>
							) : (
								<Trash2 className="w-4 h-4" />
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
