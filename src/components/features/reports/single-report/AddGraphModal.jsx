import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { updateVisibleGraphs } from '../service/reports.service';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import GraphRenderer from '@/components/elements/GraphRenderer';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useReportId } from '../hooks/useReportId';
import { queryClient } from '@/lib/react-query';
import { GRAPH_SOURCES } from '@/constants/page.constant';

const arraysEqual = (a, b) => {
	if (a.length !== b.length) return false;
	const sortedA = [...a].sort();
	const sortedB = [...b].sort();
	return sortedA.every((val, index) => val === sortedB[index]);
};

export const AddGraphModal = ({ open, reportCardId, graphs = [], onClose }) => {
	const initialSelectedRef = useRef(
		graphs.filter((graph) => graph.visible).map((graph) => graph.id),
	);
	const [selectedGraphs, setSelectedGraphs] = useState(initialSelectedRef.current);
	const reportId = useReportId();

	const updateVisibleGraphsMutation = useMutation({
		mutationFn: async () => {
			await updateVisibleGraphs({
				reportId,
				reportCardId,
				visibleGraphIds: selectedGraphs,
			});
		},
		onSuccess: () => {
			toast.success('Visible graphs updated successfully');
			queryClient.invalidateQueries(['report-details', reportId]);
			onClose();
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'update-visible-graphs',
				reportId,
				reportCardId,
			});
			toast.error('Failed to update visible graphs');
		},
	});

	const handleSelectAll = (checked) => {
		if (checked) {
			setSelectedGraphs(graphs.map((graph) => graph.id));
		} else {
			setSelectedGraphs([]);
		}
	};

	const handleSelectGraph = (graphId, checked) => {
		if (checked) {
			setSelectedGraphs([...selectedGraphs, graphId]);
		} else {
			setSelectedGraphs(selectedGraphs.filter((id) => id !== graphId));
		}
	};

	const handleClose = () => {
		if (updateVisibleGraphsMutation.isPending) return;
		onClose();
	};

	const isSelected = (graphId) => selectedGraphs.includes(graphId);
	const allSelected = graphs.length > 0 && selectedGraphs.length === graphs.length;

	// True if current selection differs from the initial selection.
	const hasChanges = !arraysEqual(initialSelectedRef.current, selectedGraphs);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-7xl p-0 text-primary80 overflow-hidden max-h-[90vh] flex flex-col">
				<div className="flex items-center justify-between px-6 py-3 border-b">
					<div className="flex items-center gap-4">
						{/* TODO: Add modal svg */}
						<div>
							<h2 className="text-xl font-semibold ">Add Graph</h2>
							<p className="text-black/60 text-sm ">
								You can add or remove graph to cards
							</p>
						</div>
					</div>
				</div>

				<div className="px-6 overflow-y-auto flex-1">
					<div className="flex items-center gap-2 mb-2">
						<Checkbox
							id="select-all"
							checked={allSelected}
							onCheckedChange={handleSelectAll}
							className="h-[1.125rem] w-[1.125rem] text-black/40 border-2 rounded-sm border-black/40 data-[state=checked]:border-purple-100 data-[state=checked]:bg-purple-100"
						/>
						<Label
							htmlFor="select-all"
							className="font-semibold text-base"
						>
							Select All{' '}
							<span className="text-black/60 text-sm">
								({selectedGraphs.length}/{graphs.length})
							</span>
						</Label>
					</div>

					<div className="grid grid-cols-2 bg-purple-4 px-4 py-4 border border-primary4 rounded-xl gap-6">
						{graphs.map((graph, index) => (
							<div className="flex flex-col" key={graph.id}>
								<div className="flex items-center gap-2 mb-3">
									<Checkbox
										id={`graph-${graph.id}`}
										checked={isSelected(graph.id)}
										onCheckedChange={(checked) =>
											handleSelectGraph(graph.id, checked)
										}
										className="h-[1.125rem] w-[1.125rem] text-black/40 border-2 rounded-sm border-black/40 data-[state=checked]:border-purple-100 data-[state=checked]:bg-purple-100"
									/>
									<Label
										htmlFor={`graph-${graph.id}`}
										className="text-base font-semibold truncate text-primary80"
									>
										{graph.title || 'Untitled'}
									</Label>
								</div>
								<div
									onClick={() =>
										handleSelectGraph(
											graph.id,
											!isSelected(graph.id),
										)
									}
									className={`p-3 bg-white border overflow-hidden shadow-graph hover:shadow-md transition-all duration-200 ease-in-out rounded-lg cursor-pointer ${
										isSelected(graph.id)
											? 'border-primary'
											: 'border-[#E5E7EB]'
									}`}
								>
									<GraphRenderer
										graph={{
											...graph,
										}}
										identifierKey={reportCardId}
										source={GRAPH_SOURCES.ADD_TO_REPORTS}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-4">
					<Button
						variant="secondary1"
						className=" text-base p-4"
						onClick={handleClose}
						disabled={updateVisibleGraphsMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						className=" font-base p-4"
						disabled={
							!hasChanges || updateVisibleGraphsMutation.isPending
						}
						onClick={() => updateVisibleGraphsMutation.mutate()}
					>
						{updateVisibleGraphsMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : hasChanges && selectedGraphs.length === 0 ? (
							'Remove Graph'
						) : (
							'Add Graph'
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
