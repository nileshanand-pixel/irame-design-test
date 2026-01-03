import GraphRenderer from '@/components/elements/GraphRenderer';
import { Label } from '@/components/ui/label';

export const QueryGraphs = ({ graphs = [], reportCardId }) => {
	if (graphs.length === 0) return;
	const visibleGraphs = graphs.filter((graph) => graph.visible);
	if (visibleGraphs.length === 0) return null;

	return (
		<div className="grid grid-cols-1 px-4 py-4 rounded-xl gap-6 border ">
			{visibleGraphs.map((graph, index) => {
				if (!graph.visible) return;
				return (
					<div key={graph.id + reportCardId} className="flex flex-col">
						<div className="flex items-center gap-2 mb-3">
							<Label
								htmlFor={`graph-${graph.id}`}
								className="text-lg font-semibold text-primary80"
							>
								Graph {index + 1} : {graph.title || 'Untitled'}
							</Label>
						</div>
						<div className="w-full">
							<GraphRenderer
								graph={{
									...graph,
								}}
								identifierKey={graph.id + reportCardId}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
};
