import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TableComponent from '@/components/elements/TableComponent';
import { useTableData } from '@/hooks/useTableData';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { LuDownload } from 'react-icons/lu';

/**
 * DetailedRecordsTab - Renders the table
 */
const DetailedRecordsTab = ({
	table,
	dashboardId,
	dashboardName,
	dashboardContentId,
	queryId,
	queryText,
}) => {
	const { isDownloading, downloadS3File } = useS3File();
	const [searchQuery, setSearchQuery] = useState('');

	// Use custom hook to handle both CSV and direct data
	const {
		data: tableDataRows,
		columns: tableColumns,
		isLoading: isTableLoading,
	} = useTableData(table, {
		feature: 'graph-detail-modal',
		action: 'load-detailed-records-table-data',
		extra: {
			dashboardContentId,
		},
	});

	// Filter rows based on search query
	const filteredRows = useMemo(() => {
		if (!searchQuery.trim()) {
			return tableDataRows;
		}

		const query = searchQuery.toLowerCase().trim();
		return tableDataRows.filter((row) => {
			// Search across all cell values in the row
			return Object.values(row).some((value) => {
				if (value === null || value === undefined) return false;
				const stringValue = String(value).toLowerCase();
				return stringValue.includes(query);
			});
		});
	}, [tableDataRows, searchQuery]);

	const handleSearchChange = useCallback((e) => {
		setSearchQuery(e.target.value);
	}, []);

	const handleDownloadCSV = () => {
		if (isDownloading || !table?.csv_url) return;

		trackEvent(
			EVENTS_ENUM.DASHBOARD_DOWNLOAD_CSV_CLICKED,
			EVENTS_REGISTRY.DASHBOARD_DOWNLOAD_CSV_CLICKED,
			() => ({
				dashboard_id: dashboardId,
				dashboard_name: dashboardName,
				dashboard_content_id: dashboardContentId,
				query_id: queryId,
				query_text: queryText,
			}),
		);
		downloadS3File(table.csv_url);
	};

	// Use filtered rows count for display, but show total count in subtitle
	const displayRows = searchQuery.trim() ? filteredRows : tableDataRows;
	const recordCount = searchQuery.trim()
		? filteredRows.length
		: tableDataRows.length;

	if (!table || isTableLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center py-8">
				{isTableLoading ? (
					<div className="flex items-center gap-2 text-primary60 text-sm">
						<CircularLoader size="sm" />
						Loading table data...
					</div>
				) : (
					<p className="text-gray-500">No table data available</p>
				)}
			</div>
		);
	}

	if (!tableDataRows.length || !tableColumns.length) {
		return (
			<div className="w-full h-full flex items-center justify-center py-8">
				<p className="text-gray-500">No table data available</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			{/* Header Section */}
			<div className="px-6 py-3  border-b border-[#F3F4F6]">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-xl font-medium text-primary100">
							Comprehensive Data Table
						</h2>
						<p className="text-sm font-normal text-primary80">
							{recordCount} records with complete details
						</p>
					</div>

					{table?.csv_url && (
						<Button
							onClick={handleDownloadCSV}
							disabled={isDownloading}
							className="flex gap-2 items-center text-sm font-medium"
						>
							{isDownloading ? (
								<>
									<CircularLoader size="sm" />
									<span>Downloading...</span>
								</>
							) : (
								<>
									<LuDownload className="size-4" />
									Download CSV
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Search Bar -- this is for future use, do not remove this code */}
			{/* <div className="px-6 py-2">
				<div className="relative">
					<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10 pr-4 py-2 border-gray-200 rounded-md bg-white focus:border-[#6A12CD] focus:ring-1 focus:ring-[#6A12CD]"
					/>
				</div>
			</div> */}

			{/* Table */}
			<div className="flex-1 px-6 pb-6 pt-4 h-[calc(100%-4.25rem)]">
				<div className="h-full">
					<TableComponent
						data={displayRows}
						columns={tableColumns}
						defaultRowsPerPage={14}
						fitToContainer={true}
					/>
				</div>
			</div>
		</div>
	);
};

export default DetailedRecordsTab;
