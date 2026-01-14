import GraphRenderer from '@/components/elements/GraphRenderer';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const QueryGraphs = ({ graphs = [], reportCardId, pdfMode }) => {
	if (graphs.length === 0) return null;
	const visibleGraphs = graphs.filter((graph) => graph.visible);
	if (visibleGraphs.length === 0) return null;

	return (
		<div
			className={cn(
				'grid grid-cols-1 px-4 py-4 rounded-xl gap-6 border',
				pdfMode && 'block border-none p-0 space-y-6',
			)}
		>
			{visibleGraphs.map((graph, index) => (
				<div
					key={graph.id + reportCardId}
					className="flex flex-col graph-container"
				>
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
			))}
		</div>
	);
};
