import React, { useState, useMemo, useEffect } from 'react';
import {
	getUserSession,
	getSqlSessions,
} from '@/components/features/new-chat/service/new-chat.service';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ModalSearch from '@/components/elements/search/ModalSearch';
import messageIcon from '@/assets/icons/message.svg';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { useQuery } from '@tanstack/react-query';
import { logError } from '@/lib/logger';

export default function ChooseQuerySessionDialog({
	open,
	onOpenChange,
	showLiveSessions = false,
}) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedSessionId, setSelectedSessionId] = useState(null);
	const { navigate } = useRouter();

	const { data: sessionsData, isLoading } = useQuery({
		queryKey: showLiveSessions ? ['sql-sessions'] : ['user-sessions'],
		queryFn: () => (showLiveSessions ? getSqlSessions() : getUserSession()),
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
								Choose a Query Session{' '}
								{showLiveSessions ? ' (Live)' : ''}
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
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search query sessions"
							aria-label="Search query sessions"
						/>
					</div>

					<RadioGroup
						value={selectedSessionId}
						onValueChange={(value) => {
							setSelectedSessionId(value);
						}}
						className="h-[25rem] overflow-y-auto space-y-3 flex flex-col"
					>
						{isLoading && (
							<div className="flex items-center justify-center h-full">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
							</div>
						)}
						{filteredSessions?.length > 0 &&
							filteredSessions?.map((session) => (
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

						{filteredSessions?.length === 0 && (
							<div className="flex items-center justify-center h-full">
								<p className="text-sm text-gray-500">
									No sessions found
								</p>
							</div>
						)}
					</RadioGroup>

					<div className="flex justify-end mt-6">
						<Button
							onClick={handleContinue}
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
