import React, { useState, useMemo } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getUserSession } from '@/components/features/new-chat/service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { FaSearch } from 'react-icons/fa';
import { MessagesSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { logError } from '@/lib/logger';

const ChooseQuerySessionModal = ({ open, onOpenChange }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedSessionId, setSelectedSessionId] = useState(null);
	const { navigate } = useRouter();

	const { data: sessionsData, isLoading } = useQuery({
		queryKey: ['user-sessions'],
		queryFn: () => getUserSession(),
		enabled: open,
	});

	const sessions = useMemo(() => {
		if (!sessionsData?.session_list) return [];
		return sessionsData.session_list;
	}, [sessionsData]);

	const filteredSessions = useMemo(() => {
		if (!searchQuery.trim()) return sessions;
		const query = searchQuery.toLowerCase();
		return sessions.filter((session) => {
			const firstQuery = session?.query_list?.[0];
			const queryText = firstQuery?.query || session?.title || '';
			return queryText.toLowerCase().includes(query);
		});
	}, [sessions, searchQuery]);

	const handleContinue = (e) => {
		e?.preventDefault();
		e?.stopPropagation();

		if (!selectedSessionId) {
			// Removed console.warn - validation handled by UI state
			return;
		}

		// Find session in both sessions and filteredSessions
		const selectedSession =
			sessions.find((s) => s.session_id === selectedSessionId) ||
			filteredSessions.find((s) => s.session_id === selectedSessionId);

		if (!selectedSession) {
			logError(new Error('Selected session not found'), {
				feature: 'dashboard',
				action: 'navigate-to-session',
				sessionId: selectedSessionId,
			});
			return;
		}

		const firstQuery = selectedSession?.query_list?.[0];
		const datasourceId =
			selectedSession?.datasource_id || firstQuery?.datasource_id;

		const url = `/app/new-chat/session?sessionId=${selectedSessionId}&source=dashboard${
			datasourceId ? `&datasource_id=${datasourceId}` : ''
		}`;

		try {
			navigate(url);
			onOpenChange(false);
		} catch (error) {
			logError(error, {
				feature: 'dashboard',
				action: 'navigate-to-session',
				sessionId: selectedSessionId,
				url,
			});
		}
	};

	const handleClose = () => {
		setSearchQuery('');
		setSelectedSessionId(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[60vh] overflow-hidden flex flex-col p-0 font-sans">
				<DialogHeader className="flex-shrink-0 border-b py-3 px-6">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 bg-[#FAF5FF] rounded-md flex items-center justify-center">
									<MessagesSquare className="w-5 h-5 text-primary80" />
								</div>
							</div>
							<div className="flex-1">
								<DialogTitle className="text-[#26064A] font-sans text-base font-medium leading-6">
									Choose a Query Session
								</DialogTitle>
								<DialogDescription className=" text-primary80 font-sans text-xs font-normal leading-4">
									Select one session to proceed.
								</DialogDescription>
							</div>
						</div>
					</div>
				</DialogHeader>

				{/* Search Bar */}

				{/* Sessions List */}
				<div className="flex-1 overflow-y-auto px-6 pb-4">
					<div className="flex-shrink-0 pb-3 ">
						<div className="relative ">
							<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary40" />
							<Input
								type="text"
								placeholder="Search query sessions"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 py-3 h-9 border rounded-lg border-[rgba(38, 6, 74, 0.10)] placeholder:[rgba(0, 0, 0, 0.4)] focus:border-[#6A12CD] focus:ring-[#6A12CD]"
							/>
						</div>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-sm text-gray-500">
								Loading sessions...
							</div>
						</div>
					) : filteredSessions.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-sm text-gray-500">
								{searchQuery
									? 'No sessions found matching your search'
									: 'No query sessions available'}
							</div>
						</div>
					) : (
						<div className="space-y-2">
							{filteredSessions.map((session) => {
								const firstQuery = session?.query_list?.[0];
								const queryText =
									firstQuery?.query ||
									session?.title ||
									'Untitled Query';
								const isSelected =
									selectedSessionId === session.session_id;

								return (
									<div
										key={session.session_id}
										onClick={() =>
											setSelectedSessionId(session.session_id)
										}
										className={cn(
											'flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-colors',
											isSelected
												? 'border-[1.5px] border-[#6A12CD]'
												: 'bg-white border-gray-200 hover:bg-purple-50',
										)}
									>
										<div className="flex-shrink-0 mt-0.5">
											<MessagesSquare className="w-5 h-5 text-primary80" />
										</div>

										<div className="flex-1 min-w-0">
											<p
												className={cn(
													'text-sm font-medium leading-5',
													isSelected
														? 'text-[#26064A]'
														: 'text-[#26064A]',
												)}
											>
												{queryText}
											</p>
										</div>

										<div className="flex-shrink-0 mt-0.5">
											<div
												className={cn(
													'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
													isSelected
														? 'border-[#6A12CD] bg-[#6A12CD]'
														: 'border-gray-300 bg-white',
												)}
											>
												{isSelected && (
													<div className="w-2 h-2 rounded-full bg-white"></div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="flex-shrink-0 flex items-center justify-end gap-3 border-t py-3 px-6 ">
					<Button
						onClick={handleContinue}
						disabled={!selectedSessionId}
						className="rounded-lg bg-[#6A12CD] hover:bg-[#6912CC] text-sm text-white font-semibold px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ChooseQuerySessionModal;
