import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { QueryCard } from './QueryCard';
import { DotsSixVertical } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { updateReportCardOrder } from '../service/reports.service';
import { toast } from 'sonner';
import { cn, getToken } from '@/lib/utils';
import { queryClient } from '@/lib/react-query';
import { useReportId } from '../hooks/useReportId';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export default function QueryList({ reportDetails }) {
	const [cards, setCards] = useState([]);
	const reportId = useReportId();
	const { isOwner } = useReportPermission();

	useEffect(() => {
		if (reportDetails?.cards?.length) {
			const sorted = reportDetails.cards.sort(
				(a, b) => a.order_no - b.order_no,
			);
			setCards(sorted);
		}
	}, [reportDetails]);

	const updateOrderMutation = useMutation({
		mutationFn: updateReportCardOrder,
		onSuccess: () => {
			toast.success('Order updated successfully!');
			queryClient.invalidateQueries(['report-details', reportId]);
		},
		onError: () => {
			toast.error('Failed to update order!');
		},
	});

	const handleDragEnd = (result) => {
		if (!result.destination) return;

		const reordered = Array.from(cards);
		const [moved] = reordered.splice(result.source.index, 1);
		reordered.splice(result.destination.index, 0, moved);

		// Update order_no based on new index
		const updatedCards = reordered.map((card, index) => ({
			...card,
			order_no: index + 1,
		}));

		// Check if order has changed
		const hasOrderChanged = cards.some(
			(card, index) => card.external_id !== updatedCards[index].external_id,
		);

		setCards(updatedCards);

		if (hasOrderChanged) {
			const reportId = reportDetails.report.report_id;
			const reportCardIds = updatedCards.map((card) => card.external_id);

			updateOrderMutation.mutate({
				token: getToken(),
				reportId,
				reportCardIds,
			});
		}
	};

	return (
		<div className="mt-8 -ml-6 overflow-x-hidden w-full">
			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="query-list">
					{(provided) => (
						<div
							{...provided.droppableProps}
							ref={provided.innerRef}
							className="space-y-8"
						>
							{cards.map((card, index) => (
								<Draggable
									key={card.external_id}
									draggableId={String(card.external_id)}
									index={index}
									isDragDisabled={!isOwner}
								>
									{(provided) => (
										<div
											ref={provided.innerRef}
											{...provided.draggableProps}
											className="flex items-center gap-2"
										>
											<div
												{...provided.dragHandleProps}
												className={cn("cursor-grab", 
													!isOwner && 'cursor-not-allowed'
												)}
												
											>
												<DotsSixVertical size={20} />
											</div>
											<div className="flex-1 overflow-x-hidden">
												<QueryCard
													report={reportDetails.report}
													card={card}
												/>
											</div>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		</div>
	);
}
