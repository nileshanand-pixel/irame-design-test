import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	addReportCardComment,
	getReportCardComments,
	getReportCardSources,
} from '../service/reports.service';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useReportId } from '../hooks/useReportId';
import SourceRow from './source-row';
import { TABS } from './QuerySourcesAndComments';
import CommentList from '@/components/elements/comments/comment-list';
import CommentForm from '@/components/elements/comments/comment-form';
import { queryClient } from '@/lib/react-query';
import { cn } from '@/lib/utils';

export default function TabSheet({
	open = true,
	onOpenChange,
	queryCardId,
	tabsConfig,
	openTab,
	commentsData,
	setCommentsData,
}) {
	const [selectedTab, setSelectedTab] = useState(openTab);
	const reportId = useReportId();
	const lastCommentRef = useRef(null);

	// Sync selectedTab with openTab prop when it changes
	useEffect(() => {
		setSelectedTab(openTab);
	}, [openTab]);
	const { data, isLoading } = useQuery({
		queryKey: ['report-card-sources', reportId, queryCardId],
		queryFn: () => getReportCardSources(reportId, queryCardId),
	});

	const sources = data?.sources || [];

	// Shimmer component
	const Shimmer = () => (
		<div className="animate-pulse space-y-4">
			{Array.from({ length: 4 }).map((_, idx) => (
				<div key={idx} className="flex gap-2">
					<div className="h-6 bg-gray-200 rounded w-4/5"></div>
					<div className="h-6 bg-gray-200 rounded w-[10%]"></div>
					<div className="h-6 bg-gray-200 rounded w-[10%]"></div>
				</div>
			))}
		</div>
	);

	// Empty state component
	const EmptyState = () => (
		<div className="text-center py-8">
			<p className="text-primary60">No sources available.</p>
		</div>
	);

	const renderCount = (key) => {
		if (key === TABS.SOURCES) {
			return sources.length;
		}
		if (key === TABS.COMMENTS) {
			return commentsData.length;
		}
		if (key === TABS.ATTACHMENTS) {
			return 0;
		}
	};

	const { data: fetchedCommentsData, isLoading: isLoadingComments } = useQuery({
		queryKey: ['fetch-report-card-comments', queryCardId],
		queryFn: () => getReportCardComments(reportId, queryCardId),
		enabled: open,
	});

	useEffect(() => {
		if (fetchedCommentsData) {
			console.log(fetchedCommentsData, 'fetchedCommentsData');
			setCommentsData(fetchedCommentsData.comments);
		}
	}, [fetchedCommentsData]);

	// Function to scroll comments to bottom
	const scrollToBottom = useCallback(() => {
		if (lastCommentRef.current) {
			lastCommentRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, []);

	// Scroll to bottom when drawer opens
	useEffect(() => {
		if (open && selectedTab === TABS.COMMENTS) {
			// Small delay to ensure DOM is rendered
			setTimeout(() => {
				scrollToBottom();
			}, 100);
		}
	}, [open, selectedTab, scrollToBottom]);

	// Scroll to bottom when comments tab is selected
	useEffect(() => {
		if (selectedTab === TABS.COMMENTS && commentsData.length > 0) {
			setTimeout(() => {
				scrollToBottom();
			}, 100);
		}
	}, [selectedTab, scrollToBottom, commentsData.length]);

	// Scroll to bottom when new comment is added
	useEffect(() => {
		if (commentsData.length > 0 && selectedTab === TABS.COMMENTS) {
			setTimeout(() => {
				scrollToBottom();
			}, 100);
		}
	}, [commentsData, selectedTab, scrollToBottom]);

	const addComment = useCallback(
		async (commentData) => {
			const response = await addReportCardComment(
				reportId,
				queryCardId,
				commentData,
			);
			return response;
		},
		[reportId, queryCardId],
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				className="w-full text-primary80 max-w-2xl p-0 border-l"
				side="right"
			>
				<div className="text-[#26064ACC] text-lg font-medium p-6">
					Studio
				</div>
				<div>
					<Tabs
						value={selectedTab}
						className="w-full"
						onValueChange={(value) => setSelectedTab(value)}
					>
						<TabsList
							className={`flex justify-start gap-6 w-full border-b p-0 h-auto bg-transparent text-[#26064A99]`}
						>
							{tabsConfig.map(({ key, label }) => (
								<TabsTrigger
									key={key}
									value={key}
									className="data-[state=active]:border-b-[0.18rem] ml-6 data-[state=active]:border-purple-100 data-[state=active]:shadow-none rounded-none py-2 data-[state=active]:text-[#6A12CE] font-semibold flex items-center gap-2"
								>
									<span>{label}</span>
									<span className="size-5 bg-[#26064A1A] rounded-full text-[0.625rem]">
										{renderCount(key)}
									</span>
								</TabsTrigger>
							))}
						</TabsList>

						{tabsConfig.map(({ key, description, icon }) => (
							<TabsContent key={key} value={key}>
								<div className="p-4 pb-5">
									<div className="w-full pb-5">
										{key === TABS.SOURCES ? (
											isLoading ? (
												<div className="flex flex-col gap-4">
													<Shimmer />
												</div>
											) : sources.length === 0 ? (
												<EmptyState />
											) : (
												<div className="w-full space-y-4">
													{sources.map((source) => (
														<SourceRow source={source} />
													))}
												</div>
											)
										) : key === TABS.ATTACHMENTS ? (
											<div className="text-center py-8 text-gray-500">
												Coming soon
											</div>
										) : (
											<div className="h-[calc(100vh-10rem)] flex flex-col">
												<div
													className={cn(
														'flex-1 overflow-auto',
													)}
												>
													<CommentList
														commentsData={commentsData}
														isLoadingComments={
															isLoadingComments
														}
														className="border-none"
													/>
													<div ref={lastCommentRef} />
												</div>

												<div className="shrink-0">
													<CommentForm
														commetsAdder={addComment}
														onSuccessCommentAddition={() => {
															queryClient.invalidateQueries(
																['activity-trail'],
															);
															queryClient.invalidateQueries(
																[
																	'fetch-report-card-comments',
																	queryCardId,
																],
															);
														}}
														toastPosition="bottom-center"
													/>
												</div>
											</div>
										)}
									</div>
								</div>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
