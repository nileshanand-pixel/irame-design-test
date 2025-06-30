import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReportCardSources } from '../service/reports.service';
import { getFileIcon, getToken } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useReportId } from '../hooks/useReportId';
import { ArrowSquareOut, BoxArrowDown } from '@phosphor-icons/react';
import { Hint } from '@/components/Hint';

export default function TabSheet({ open = true, onOpenChange, queryCardId }) {
	const reportId = useReportId();
	const { data, isLoading } = useQuery({
		queryKey: ['report-card-sources', reportId, queryCardId],
		queryFn: () => getReportCardSources(getToken(), reportId, queryCardId),
	});

	const sources = data?.sources || [];

	const downloadFile = (fileUrl, fileName) => {
		const link = document.createElement('a');
		link.href = fileUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openFile = (fileUrl) => {
		window.open(fileUrl, '_blank', 'noopener,noreferrer');
	};

	const tabsConfig = [
		{
			key: 'sources',
			label: 'Actual Sources',
			description:
				'Added sources from the report can be viewed and downloaded from here.',
			icon: (
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 2L2 7L12 12L22 7L12 2Z"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M2 17L12 22L22 17"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M2 12L12 17L22 12"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			),
		},
		{
			key: 'attachments',
			label: 'All Attachments',
			description: 'View all attachments added to the report here.',
			icon: (
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 2L2 7L12 12L22 7L12 2Z"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M2 17L12 22L22 17"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M2 12L12 17L22 12"
						stroke="#6E56CF"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			),
		},
	];

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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				className="w-full text-primary80 max-w-md md:max-w-xl p-0 border-l"
				side="right"
			>
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-between ">
						<Tabs
							defaultValue={tabsConfig[0].key}
							className="w-full py-4"
						>
							<TabsList
								className={`flex justify-start gap-6 w-full border-b p-0 h-auto bg-transparent text-black/80`}
							>
								{tabsConfig.map(({ key, label }) => (
									<TabsTrigger
										key={key}
										value={key}
										className="data-[state=active]:border-b-[3px] data-[state=active]:rounded-sm ml-6 data-[state=active]:border-purple-100 data-[state=active]:shadow-none rounded-none py-2 font-medium text-base"
									>
										{label}
									</TabsTrigger>
								))}
							</TabsList>

							{tabsConfig.map(({ key, description, icon }) => (
								<TabsContent key={key} value={key}>
									<div className="p-4">
										<div className="flex items-center gap-4 mb-4">
											<div className="bg-purple-50 p-4 rounded-full">
												{icon}
											</div>
											<div>
												<h2 className="text-xl font-semibold ">
													{key === 'sources'
														? 'Sources'
														: key
																.charAt(0)
																.toUpperCase() +
															key.slice(1)}
												</h2>
												<p className="text-black/60 line-clamp-2 text-sm font-normal">
													{description}
												</p>
											</div>
										</div>

										<div className="mt-6 w-full">
											{key === 'sources' ? (
												isLoading ? (
													<div className="flex flex-col gap-4">
														<Shimmer />
													</div>
												) : sources.length === 0 ? (
													<EmptyState />
												) : (
													<div className="w-full space-y-4">
														{sources.map((source) => (
															<div
																key={
																	source.file_id ||
																	source.id
																}
																className="border border-[#EAE8FA] rounded-lg py-2 px-4 flex items-center justify-between"
															>
																<div className="flex gap-2 w-4/5 items-center">
																	<div className="p-1 shrink-0 rounded mr-2">
																		<img
																			src={getFileIcon(
																				source.file_name,
																			)}
																			className="size-8"
																			alt="icon"
																		/>
																	</div>
																	<span className="font-semibold truncate text-base">
																		{
																			source.file_name
																		}
																	</span>
																</div>
																<div className="flex items-center gap-4">
																	<Hint label="Download">
																		<Button
																			variant="ghost"
																			size="iconSm"
																			onClick={() =>
																				downloadFile(
																					source.url,
																					source.file_name,
																				)
																			}
																		>
																			<BoxArrowDown
																				size={
																					20
																				}
																			/>
																		</Button>
																	</Hint>
																	<Hint label="Open in new tab">
																		<Button
																			variant="ghost"
																			size="iconSm"
																			onClick={() =>
																				openFile(
																					source.url,
																				)
																			}
																		>
																			<ArrowSquareOut
																				size={
																					20
																				}
																			/>
																		</Button>
																	</Hint>
																</div>
															</div>
														))}
													</div>
												)
											) : (
												<div className="text-center py-8 text-gray-500">
													Coming soon
												</div>
											)}
										</div>
									</div>
								</TabsContent>
							))}
						</Tabs>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
