import React, { useState, useMemo } from 'react';
import { getUserSession } from '@/components/features/new-chat/service/new-chat.service';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ModalSearch from '@/components/elements/search/ModalSearch';
import { useQuery } from '@tanstack/react-query';
import messageIcon from '@/assets/icons/message.svg';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ChooseQuerySessionDialog({ open, onClose }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSessionId, setSelectedSessionId] = useState('');
	const navigate = useNavigate();
	const {
		data: sessionsData,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		Sentinel,
	} = useInfiniteScroll({
		queryKey: ['chat-history'],
		queryFn: getUserSession,
		paginationType: 'cursor',
		options: {
			limit: 20, // Back to original limit
			refetchInterval: 20000,
		},
	});

	const dataToShow = useMemo(() => {
		if (!sessionsData) return [];
		return sessionsData.filter((session) =>
			session?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [sessionsData, searchTerm]);

	const handleOpenChange = (isOpen) => {
		if (!isOpen) {
			onClose();
			setSelectedSessionId('');
			setSearchTerm('');
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-3xl p-0">
				<DialogHeader className="p-6 pb-2">
					<div className="flex gap-4 items-center mb">
						<div className="p-2.5 bg-purple-50 rounded-xl">
							<img
								src={messageIcon}
								alt="message"
								className="size-5"
							/>
						</div>
						<div className="flex flex-col">
							<h2 className="text-base font-medium text-[#26064A]">
								Choose a Query Session
							</h2>
							<p className="text-xs text-[#26064ACC] font-normal">
								Select one session to proceed.
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="px-6 pb-6 pt-4">
					<div className="mb-4">
						<ModalSearch
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search query sessions"
							aria-label="Search query sessions"
						/>
					</div>

					<RadioGroup
						value={selectedSessionId}
						onValueChange={(value) => {
							setSelectedSessionId(value);
						}}
						className="h-[25rem] overflow-y-auto space-y-3"
					>
						{isLoading && (
							<div className="flex items-center justify-center h-full">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
							</div>
						)}
						{dataToShow?.length > 0 &&
							dataToShow?.map((session) => (
								<div
									className={cn(
										'rounded-lg border border-[#6A12CD33] p-4 flex items-center gap-4 cursor-pointer',
										session?.session_id === selectedSessionId &&
											'border-2 border-[#6A12CD]',
									)}
									key={session?.session_id}
									onClick={() =>
										setSelectedSessionId(session?.session_id)
									}
								>
									<div className="flex items-center justify-between w-full space-x-2">
										<Label
											htmlFor={session.session_id}
											className="w-full flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-7 cursor-pointer truncate"
										>
											<img
												src={messageIcon}
												alt="message"
												className="size-5 mr-2"
											/>
											<div className="text-sm font-medium text-[#26064A] truncate w-[90%]">
												{session?.title}
											</div>
										</Label>
										<RadioGroupItem
											id={session?.session_id}
											value={session?.session_id}
										/>
									</div>
								</div>
							))}

						{dataToShow?.length === 0 && (
							<div className="flex items-center justify-center h-full">
								<p className="text-sm text-gray-500">
									No sessions found
								</p>
							</div>
						)}
						<Sentinel />
					</RadioGroup>

					<div className="flex justify-end mt-6">
						<Button
							onClick={() => {
								navigate(
									`/app/new-chat/session?sessionId=${selectedSessionId}`,
								);
							}}
							disabled={!selectedSessionId || isLoading}
							className="bg-purple-600 hover:bg-purple-700 text-white px-6 disabled:opacity-50"
						>
							Continue →
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
