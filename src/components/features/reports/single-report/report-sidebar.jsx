import { useReportPermission } from '@/contexts/ReportPermissionContext';
import { cn } from '@/lib/utils';
import { DotsSixVertical } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { updateReportCardOrder } from '../service/reports.service';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { logError } from '@/lib/logger';
import { useReportId } from '../hooks/useReportId';
import { BsLayoutSidebar } from 'react-icons/bs';

export const REPORT_SECTION_IDS = {
	SUMMARY: 'summary',
	APPENDIX: 'appendix',
};

export default function ReportSidebar({ reportDetails, cards, setCards }) {
	const [showIndex, setShowIndex] = useState(false);
	const [activeTab, setActiveTab] = useState('');
	const { isOwner } = useReportPermission();
	const reportId = useReportId();

	const TOP_TABS = useMemo(() => {
		return [
			{
				title: 'Report Summary',
				id: REPORT_SECTION_IDS?.SUMMARY,
			},
		];
	}, [reportDetails?.report?.name, cards]);

	const CARD_TABS = useMemo(() => {
		return cards?.map((card) => ({
			title: card.title,
			id: card.external_id,
		}));
	}, [cards]);

	const BOTTOM_TABS = useMemo(() => {
		return [
			{
				title: 'Appendix',
				id: REPORT_SECTION_IDS?.APPENDIX,
			},
		];
	}, []);

	const handleTabClick = (tabId) => {
		setActiveTab(tabId);

		// get the element by id and scroll to it
		const element = document.getElementById(tabId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const updateOrderMutation = useMutation({
		mutationFn: updateReportCardOrder,
		onSuccess: () => {
			toast.success('Order updated successfully!');
			queryClient.invalidateQueries({
				queryKey: ['report-details', reportId],
			});
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'update-query-order',
				reportId,
			});
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
				reportId,
				reportCardIds,
			});
		}
	};

	return (
		<div className="pt-6 px-3 flex flex-col">
			<div
				className="p-4 rounded-full hover:bg-[#6A12CD1A] cursor-pointer mb-2 size-[3rem]"
				onClick={() => setShowIndex((prev) => !prev)}
			>
				<BsLayoutSidebar className="size-4 text-[#26064A99]" />
			</div>

			{showIndex && (
				<div className="w-[12.5rem] pr-3 flex flex-col overflow-auto">
					<div className="p-2 pl-0 pt-1 border-b border-[#26064A33] mb-2 truncate">
						{reportDetails?.report?.name}
					</div>

					<div className="flex-1 overflow-auto">
						<div>
							{TOP_TABS.map((tab) => (
								<div
									key={tab.id}
									className={cn(
										'p-2 pl-3 truncate border-l-2 border-[#26064A33] cursor-pointer hover:bg-[#6A12CD0A]',
										activeTab === tab.id &&
											'bg-[#6A12CD0A] border-[#6A12CD]',
									)}
									onClick={() => handleTabClick(tab.id)}
								>
									{tab.title}
								</div>
							))}
						</div>

						<DragDropContext onDragEnd={handleDragEnd}>
							<Droppable roppable droppableId="query-list">
								{(provided) => (
									<div
										{...provided.droppableProps}
										ref={provided.innerRef}
									>
										{CARD_TABS.map((tab, index) => (
											<Draggable
												key={tab.id}
												draggableId={String(tab.id)}
												index={index}
												isDragDisabled={!isOwner}
											>
												{(provided) => (
													<div
														ref={provided.innerRef}
														{...provided.draggableProps}
														className={cn(
															'group p-2 truncate border-l-2 border-[#26064A33] cursor-pointer hover:bg-[#6A12CD0A] flex items-center gap-1',
															activeTab === tab.id &&
																'bg-[#6A12CD0A] border-[#6A12CD]',
														)}
														onClick={() =>
															handleTabClick(tab.id)
														}
													>
														<div
															{...provided.dragHandleProps}
															className={cn(
																'cursor-grab hidden group-hover:block',
																!isOwner &&
																	'cursor-not-allowed',
															)}
														>
															<DotsSixVertical className="size-5" />
														</div>
														<div className="flex-1 truncate">
															{tab.title}
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

						<div>
							{BOTTOM_TABS.map((tab) => (
								<div
									key={tab.id}
									className={cn(
										'p-2 pl-3 truncate border-l-2 border-[#26064A33] cursor-pointer hover:bg-[#6A12CD0A]',
										activeTab === tab.id &&
											'bg-[#6A12CD0A] border-[#6A12CD]',
									)}
									onClick={() => handleTabClick(tab.id)}
								>
									{tab.title}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
