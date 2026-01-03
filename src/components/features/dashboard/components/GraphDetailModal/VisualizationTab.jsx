import React, { useMemo, useState, useCallback } from 'react';
import GraphRenderer from '@/components/elements/GraphRenderer';
import TableComponent from '@/components/elements/TableComponent';
import { useCsvData } from '@/hooks/useCsvData';
import { normalizeGraphData } from '@/utils/graph.utils';
import { normalizeColumnNameToKey } from '@/utils/table.utils';
import CircularLoader from '@/components/elements/loading/CircularLoader';

/**
 * VisualizationTab - Displays graph visualization and data table
 *
 * @param {Object} graph - Graph data object
 * @param {string} identifierKey - Unique identifier for the graph
 * @param {string} chartType - Chart type override (line, bar, area)
 */
const VisualizationTab = ({ graph, identifierKey, chartType }) => {
	const [zoomRange, setZoomRange] = useState(null);

	const normalizedGraph = useMemo(() => {
		return normalizeGraphData(graph);
	}, [graph]);

	const csvUrl = normalizedGraph?.csv_url;

	// Fetch CSV data for table using custom hook
	const {
		data: loadedData,
		columns,
		isLoading: isTableLoading,
	} = useCsvData(csvUrl, {
		feature: 'graph-detail-modal',
		action: 'load-graph-csv-data',
		extra: {
			graphId: graph?.id,
		},
	});

	if (!normalizedGraph) {
		return (
			<div className="w-full h-full flex items-center justify-center py-8">
				<p className="text-primary80">No graph data available</p>
			</div>
		);
	}

	// Handle zoom range change from GraphRenderer
	const handleZoomRangeChange = useCallback((range) => {
		setZoomRange(range);
	}, []);

	// Filter table data based on zoom range
	const filteredTableData = useMemo(() => {
		if (
			!zoomRange ||
			!zoomRange.selectedLabels ||
			!zoomRange.xAxisColumn ||
			zoomRange.selectedLabels.length === 0
		) {
			// No zoom - show all data
			return loadedData;
		}

		// Normalize the X-axis column name to match table data keys
		const normalizedXAxisColumn = normalizeColumnNameToKey(
			zoomRange.xAxisColumn,
		);

		// Extract actual date values from labels (handle formatted labels like "Vendor Inactive Date(08-01-2028)")
		const selectedValues = zoomRange.selectedLabels.map((label) => {
			// Extract the actual value from label if it's formatted (e.g., "Vendor Inactive Date(08-01-2028)")
			if (label.includes('(') && label.includes(')')) {
				const match = label.match(/\(([^)]+)\)/);
				return match ? match[1].trim() : label.trim();
			}
			return label.trim();
		});

		// Filter rows where the X-axis column value matches any selected label
		return loadedData.filter((row) => {
			const rowValue = row[normalizedXAxisColumn];
			if (!rowValue) return false;

			// Compare values (handle string comparison, case-insensitive)
			const normalizedRowValue = String(rowValue).trim();
			return selectedValues.some((selectedValue) => {
				return normalizedRowValue === selectedValue;
			});
		});
	}, [loadedData, zoomRange]);

	const hasTableData = filteredTableData.length > 0 && columns.length > 0;

	return (
		<div className="w-full h-full flex flex-col p-6 pt-4 overflow-y-auto">
			{/* Graph Section */}
			<div className="rounded-[0.875rem] border w-full min-h-[calc(90vh-10rem)] max-h-[calc(90vh-10rem)] border-primary4 bg-purple-4 p-4 mb-6">
				<GraphRenderer
					graph={normalizedGraph}
					identifierKey={identifierKey}
					chartTypeOverride={chartType}
					onZoomRangeChange={handleZoomRangeChange}
				/>
			</div>

			{/* Table Section */}
			{csvUrl && (
				<div
					className={`bg-white rounded-[0.875rem] p-4 shadow-sm border hover:shadow-md transition-shadow border-[#E2E8F0] group w-full min-w-0 cursor-pointer`}
				>
					<div className="mb-3">
						<h3 className="font-medium text-[#26064A]">
							Detailed Records
						</h3>
					</div>

					{isTableLoading ? (
						<div className="rounded-2xl border w-full border-primary4 p-4 flex items-center justify-center">
							<div className="flex gap-2 items-center text-primary60 text-sm">
								<CircularLoader size="sm" />
								Loading table data...
							</div>
						</div>
					) : hasTableData ? (
						<div className="rounded-2xl border w-full custom-scrollbar-graph border-primary4">
							<TableComponent
								data={filteredTableData}
								columns={columns}
							/>
						</div>
					) : (
						<div className="rounded-2xl border w-full border-primary4 p-4 flex items-center justify-center">
							<div className="text-primary60 text-sm">
								No table data available
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default VisualizationTab;
