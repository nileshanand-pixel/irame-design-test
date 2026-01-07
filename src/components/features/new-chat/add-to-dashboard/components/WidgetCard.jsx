import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import GraphRenderer from '@/components/elements/GraphRenderer';
import TableComponent from '@/components/elements/TableComponent';
import { useTableData } from '@/hooks/useTableData';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const WidgetCard = ({ widget, isSelected, onToggleSelect, type = 'graph' }) => {
	// Transform widget data to match useTableData expected format
	const tableDataForHook = useMemo(() => {
		if (type !== 'table' || !widget) return null;

		// Support multiple formats: widget.tableUrl, widget.tableData, or widget.csv_url
		return {
			sample_url: widget.tableUrl || widget.tableData?.sample_url,
			csv_url: widget.csv_url || widget.tableData?.csv_url,
			columns: widget.tableData?.columns || widget.columns,
			headers: widget.tableData?.headers,
			rows: widget.tableData?.rows || widget.rows,
			data: widget.tableData?.data,
		};
	}, [type, widget]);

	// Use custom hook to handle both CSV and direct data (same as DashboardTableCard)
	const {
		data: tableData,
		columns: tableColumns,
		isLoading: isTableLoading,
		error: tableError,
	} = useTableData(tableDataForHook, {
		feature: 'widget-card',
		action: 'load-table-data',
		extra: {
			widgetId: widget?.id,
		},
	});

	const handleClick = () => {
		onToggleSelect(widget);
	};

	return (
		<div
			onClick={handleClick}
			className={cn(
				'relative rounded-lg border-[0.09375rem] cursor-pointer transition-all duration-200',
				'bg-white p-[0.625rem]',
				isSelected
					? 'border-[#6A12CD] shadow-md'
					: 'border-[#E5E7EB] hover:shadow-md',
			)}
		>
			<div className="flex gap-2 mb-2">
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<RadioGroup>
						<RadioGroupItem
							id={`widget-radio-${widget.id}`}
							name="widget-radio"
							value={widget.id}
							checked={isSelected}
							onChange={() => {
								onToggleSelect(widget);
							}}
						></RadioGroupItem>
					</RadioGroup>
				</div>

				<div className="">
					<h3 className="text-xs font-medium text-[#26064A] mt-0.5">
						{widget.title}
					</h3>
				</div>
			</div>

			{type === 'graph' && widget.graphData && (
				<div className="rounded-2xl border w-full border-primary4 bg-purple-4 p-2 min-w-0">
					<GraphRenderer
						graph={widget.graphData}
						identifierKey={`widget-${widget.id}`}
					/>
				</div>
			)}

			{type === 'table' && (
				<div className="min-h-60 overflow-hidden">
					{isTableLoading ? (
						<div className="flex items-center justify-center h-full">
							<CircularLoader size="sm" />
							<span className="ml-2 text-xs text-gray-600">
								Loading table...
							</span>
						</div>
					) : tableError ? (
						<div className="flex flex-col items-center justify-center h-full text-xs text-gray-500 px-2">
							<span className="text-center">
								This table is not available
							</span>
						</div>
					) : tableData &&
					  tableData.length > 0 &&
					  tableColumns &&
					  tableColumns.length > 0 ? (
						<div className="h-full overflow-auto">
							<TableComponent
								data={tableData}
								columns={tableColumns}
								onSortingChange={() => {}}
							/>
						</div>
					) : (
						<div className="flex items-center justify-center h-full text-xs text-gray-500">
							No table data available
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default WidgetCard;
