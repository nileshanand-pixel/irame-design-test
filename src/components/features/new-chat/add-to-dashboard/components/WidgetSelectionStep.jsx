import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FaArrowLeft } from 'react-icons/fa';
import SelectedDashboardCard from './SelectedDashboardCard';
import WidgetSection from './WidgetSection';
import { WIDGET_TYPES } from '../constants';
import { useWidgets } from '../hooks/useWidgets';
import { useWidgetSelection } from '../hooks/useWidgetSelection';
import { useExistingDashboardContent } from '../hooks/useExistingDashboardContent';
import { useAddToDashboard } from '../hooks/useAddToDashboard';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import { getQueryById } from '../../../new-chat/service/new-chat.service';
import { removeQueryString } from '@/utils/url';
import CircularLoader from '@/components/elements/loading/CircularLoader';

/**
 * WidgetSelectionStep Component
 *
 * Handles Step 2 of the Add to Dashboard flow:
 * - Fetches widgets from query data (graphs, tables, KPIs)
 * - Pre-selects widgets that already exist in selected dashboard
 * - Manages widget selection state
 * - Handles submission to backend
 *
 * @param {object} selectedDashboard - The dashboard selected in Step 1
 * @param {string} queryId - ID of the current query
 * @param {function} onBack - Callback when user clicks Back
 * @param {function} onSuccess - Callback when submission succeeds
 */
const WidgetSelectionStep = ({ selectedDashboard, queryId, onBack, onSuccess }) => {
	// Fetch widgets from query data
	const { widgets, isLoading: isLoadingWidgets } = useWidgets({
		enabled: true,
		queryId,
	});

	// Fetch existing dashboard content to pre-select widgets
	const existingContent = useExistingDashboardContent({
		dashboard: selectedDashboard,
		queryId,
		enabled: !!selectedDashboard && !!queryId,
	});

	// Determine initial graph ID from existing content
	const initialGraphId = useMemo(() => {
		if (
			!existingContent.hasExistingContent ||
			existingContent.existingGraphIds.length === 0
		) {
			return null;
		}
		return existingContent.existingGraphIds[0];
	}, [existingContent]);

	// Determine initial table ID from existing content
	const initialTableId = useMemo(() => {
		if (
			!existingContent.hasExistingContent ||
			!existingContent.existingTableUrl
		) {
			return null;
		}

		const normalizedExistingUrl = existingContent.existingTableUrl;

		// Find matching table widget by comparing normalized URLs
		const matchingTable = widgets.tables?.find((table) => {
			if (table.id === normalizedExistingUrl) {
				return true;
			}

			if (table.csv_url) {
				const normalizedCsvUrl = removeQueryString(table.csv_url);
				if (normalizedCsvUrl === normalizedExistingUrl) {
					return true;
				}
			}

			if (table.sample_url) {
				const normalizedSampleUrl = removeQueryString(table.sample_url);
				if (normalizedSampleUrl === normalizedExistingUrl) {
					return true;
				}
			}

			return false;
		});

		return matchingTable ? matchingTable.id : normalizedExistingUrl;
	}, [existingContent, widgets.tables]);

	// Widget selection state management
	const { selectedGraph, selectedTable, toggleWidget } = useWidgetSelection({
		initialGraphId,
		initialTableId,
	});

	// Fetch query data for validation
	const queryDataQuery = useQuery({
		queryKey: QUERY_KEYS.QUERY_DATA(queryId),
		queryFn: () => getQueryById(queryId),
		enabled: !!queryId,
	});

	// Add to dashboard submission handler
	const { isSubmitting, submit } = useAddToDashboard({
		onSuccess,
	});

	// Handler: Submit widgets to dashboard
	const handleSubmit = useCallback(async () => {
		await submit({
			dashboard: selectedDashboard,
			queryId,
			selectedGraph,
			selectedTable,
			widgets,
			queryDataQuery,
			existingContent,
		});
	}, [
		submit,
		selectedDashboard,
		queryId,
		selectedGraph,
		selectedTable,
		widgets,
		queryDataQuery,
		existingContent,
	]);

	return (
		<>
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				<SelectedDashboardCard dashboard={selectedDashboard} />

				<WidgetSection
					title="Graphs"
					widgets={widgets.graphs}
					type={WIDGET_TYPES.GRAPH}
					selectedWidgetId={selectedGraph}
					onToggleSelect={toggleWidget}
					isLoading={isLoadingWidgets}
					gridCols="grid-cols-2"
				/>

				<WidgetSection
					title="Tables"
					widgets={widgets.tables}
					type={WIDGET_TYPES.TABLE}
					selectedWidgetId={selectedTable}
					onToggleSelect={toggleWidget}
					isLoading={isLoadingWidgets}
				/>

				{widgets.kpis && widgets.kpis.length > 0 && (
					<WidgetSection
						title="KPIs"
						widgets={widgets.kpis}
						type={WIDGET_TYPES.KPI}
						selectedWidgetId={null}
						onToggleSelect={() => {}}
						isLoading={false}
						gridCols="grid-cols-3"
					/>
				)}
			</div>

			<div className="flex-shrink-0 flex items-center justify-between border-t border-[#6A12CD1A] p-4">
				<Button
					variant="outline"
					onClick={onBack}
					disabled={isSubmitting}
					className="py-2 px-4 flex gap-2 items-center border border-[#26064A1A] text-[#26064ACC] font-medium"
				>
					<FaArrowLeft className="size-3" />
					<span>Back</span>
				</Button>

				<Button
					onClick={handleSubmit}
					disabled={
						!selectedDashboard ||
						(!selectedGraph && !selectedTable) ||
						isSubmitting
					}
					className="font-semibold py-2 px-4 flex items-center gap-2"
				>
					{isSubmitting ? (
						<>
							<CircularLoader size="sm" />
							Adding...
						</>
					) : (
						'Add to Dashboard'
					)}
				</Button>
			</div>
		</>
	);
};

export default WidgetSelectionStep;
