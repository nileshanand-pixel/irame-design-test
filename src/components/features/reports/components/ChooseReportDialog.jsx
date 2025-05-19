import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserReports } from '../service/reports.service';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import ModalSearch from '@/components/elements/search/ModalSearch';
import ReportRadioCardItem from './ReportRadioCardItem';

export default function ChooseReportDialog({
	open,
	onClose,
	onAddNewReport,
	onContinue,
	token,
}) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedReportId, setSelectedReportId] = useState('');

	const { data, isLoading, isError } = useQuery({
		queryKey: ['user-reports'],
		queryFn: () => getUserReports(token),
		enabled: open,
		staleTime: 5 * 60 * 1000,
	});

	const filteredReports = useMemo(() => {
		if (!data?.reports) return [];
		return data.reports.filter((report) =>
			report.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data?.reports, searchTerm]);

	const handleContinue = () => {
		const selectedReport = data?.reports.find(
			(r) => r.report_id === selectedReportId,
		);
		if (selectedReport) onContinue(selectedReport);
	};

	const handleOpenChange = (isOpen) => {
		if (!isOpen) onClose();
		setSelectedReportId('');
		setSearchTerm('');
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg rounded-lg p-4 bg-white shadow-lg">
				<DialogHeader>
					<div className="flex gap-4 items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/choose_report_modal.svg"
							alt=""
							className="w-10 h-10"
						/>
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold text-black/90">
								Choose Report
							</h2>
							<p className="text-sm text-black/60">
								Select an existing report or create a new report
							</p>
						</div>
					</div>
				</DialogHeader>
				<div className="my-4">
					<ModalSearch
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search Report"
						aria-label="Search reports"
					/>
				</div>
				<RadioGroup
					value={selectedReportId}
					onValueChange={(value) => {
						setSelectedReportId(value);
					}}
					className="max-h-60 overflow-y-auto space-y-3"
				>
					{isLoading && (
						<p className="text-sm text-center text-gray-500 py-4">
							Loading reports...
						</p>
					)}
					{isError && (
						<p className="text-sm text-center text-red-600 py-4">
							Failed to load reports.
						</p>
					)}
					{!isLoading && !isError && filteredReports.length === 0 && (
						<p className="text-sm text-center text-gray-500 py-4">
							{searchTerm
								? 'No reports match your search.'
								: 'No reports found.'}
						</p>
					)}
					{!isLoading &&
						!isError &&
						filteredReports.map((report) => (
							<ReportRadioCardItem
								key={report.report_id}
								id={report.report_id}
								value={report.report_id}
								title={report.name}
								description={
									report.data?.description ||
									'No description available.'
								}
								isSelected={selectedReportId === report.report_id} // Pass the selectedReportId directly
								date={report.created_at}
							/>
						))}
				</RadioGroup>
				<div className="mt-4">
					<Button
						variant="secondary1"
						onClick={onAddNewReport}
						className="w-full justify-center"
					>
						Add New Report
					</Button>
				</div>
				<DialogFooter className="mt-4 sm:justify-end gap-2">
					<Button
						variant="secondary1"
						onClick={onClose}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						onClick={handleContinue}
						disabled={!selectedReportId || isLoading}
						className="bg-primary flex-1 text-primary-foreground  disabled:opacity-50"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
