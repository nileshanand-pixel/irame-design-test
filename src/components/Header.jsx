import useLocalStorage from '@/hooks/useLocalStorage';
import { fullLogout } from './features/login/service/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getInitials, cn } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useRef, useState } from 'react';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { logError } from '@/lib/logger';
import { authUserDetails } from './features/login/service/auth.service';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { ReaderIcon } from '@radix-ui/react-icons';
import { RocketIcon } from '@radix-ui/react-icons';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import {
	ArrowUpDown,
	Database,
	DatabaseIcon,
	Download,
	FileText,
	Search,
	Share2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSession } from './features/new-chat/service/new-chat.service';
import { useNavigate } from 'react-router-dom';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { getDataSourcesV2 } from './features/configuration/service/configuration.service';
import { ShareChatModal } from './ShareChatModal';
import bellIcon from '@/assets/icons/bell.svg';
import NotificationDrawer from './features/notification/components/notification-drawer';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';

export function useDataSources() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['data-sources'],
		queryFn: async () => {
			const response = await getDataSourcesV2();
			return Array.isArray(response) ? response : [];
		},
		staleTime: 1000 * 60,
	});

	return { dataSources: data || [], isLoading, error };
}

export const DataSourceSwitcher = () => {
	const { dataSources, isLoading } = useDataSources();
	const { query } = useRouter();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [searchTerm, setSearchTerm] = useState('');
	const [open, setOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingDataSource, setPendingDataSource] = useState(null);

	const containerRef = useRef(null);
	const inputRef = useRef(null);

	const activeDataSourceId = query?.datasource_id || query?.dataSourceId || null;

	const filteredDatasources = useMemo(
		() =>
			dataSources.filter((ds) =>
				ds.name?.toLowerCase().includes(searchTerm.toLowerCase()),
			),
		[dataSources, searchTerm],
	);

	const activeDataSource = useMemo(
		() =>
			dataSources.find(
				(ds) => String(ds.datasource_id) === String(activeDataSourceId),
			),
		[dataSources, activeDataSourceId],
	);

	const handleConfirmSwitch = () => {
		if (!pendingDataSource) return;

		dispatch(
			updateUtilProp([{ key: 'activeDataSource', value: pendingDataSource }]),
		);
		navigate(
			`/app/new-chat/?step=3&datasource_id=${pendingDataSource.datasource_id}&source=homepage`,
		);

		setConfirmOpen(false);
		setOpen(false);
	};

	const handleDatasourceClick = (ds) => {
		if (String(ds.datasource_id) === String(activeDataSourceId)) return;
		setPendingDataSource(ds);
		setConfirmOpen(true);
	};

	useEffect(() => {
		if (open && inputRef.current) inputRef.current.focus();
	}, [open]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target)
			) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={containerRef} className="relative inline-block">
			<button
				className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 text-primary80 text-sm font-semibold bg-white hover:bg-gray-50 transition-all focus:outline-none"
				onClick={() => setOpen(!open)}
			>
				<DatabaseIcon className="mr-2 size-4 text-primary80" />
				{activeDataSource ? activeDataSource.name : 'Select Datasource'}
				<ChevronDownIcon className="ml-2 size-4 text-primary60" />
			</button>

			{open && (
				<div className="absolute z-50 w-80 mt-2 p-3 flex flex-col gap-2 rounded-lg shadow-lg border border-gray-200 bg-white">
					<h3 className="text-xs font-medium text-primary60 pb-1 border-b">
						Switch Datasource
					</h3>

					<div className="relative">
						<span className="absolute left-3 top-2 text-gray-400">
							<Search className="size-4" />
						</span>
						<input
							ref={inputRef}
							type="text"
							placeholder="Search datasource"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="text-primary80 w-full pl-9 pr-3 py-2 text-xs rounded-md border border-gray-200 focus:outline-none shadow-sm placeholder:text-gray-400"
						/>
					</div>

					<div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto custom-scrollbar">
						{isLoading ? (
							<p className="text-xs text-center text-gray-400 py-2">
								Loading...
							</p>
						) : filteredDatasources.length > 0 ? (
							filteredDatasources.map((ds) => (
								<button
									key={ds.datasource_id}
									className={cn(
										'flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm text-left',
										String(activeDataSourceId) ===
											String(ds.datasource_id)
											? 'bg-purple-4 text-primary60'
											: 'text-primary80 hover:bg-purple-4',
									)}
									onClick={() => handleDatasourceClick(ds)}
								>
									<DatabaseIcon
										className="flex-shrink-0 w-4 h-4 text-primary60"
										strokeWidth={2.5}
									/>
									<span className="truncate flex-1">
										{ds.name}
									</span>
									{ds.datasource_type ===
										DATASOURCE_TYPES.SQL_GENERATED && (
										<span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0">
											<span className="size-1.5 bg-green-600 rounded-full animate-pulse"></span>
											Live
										</span>
									)}
								</button>
							))
						) : (
							<p className="text-xs text-center text-gray-400 py-2">
								No datasource found.
							</p>
						)}
					</div>
				</div>
			)}

			<ConfirmationModal
				isOpen={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleConfirmSwitch}
			/>
		</div>
	);
};

export function DownloadFilesDropdown({ files = [], dataSourceName }) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target)
			) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleDownload = async (file) => {
		try {
			const response = await fetch(file.url);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = file.filename || file.name;
			document.body.appendChild(link);
			link.click();
			link.remove();

			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Download failed:', err);
		}
	};

	return (
		<div ref={containerRef} className="relative inline-block">
			<Button
				variant="outline"
				className="py-2 px-3 text-sm flex items-center font-semibold !text-primary80 rounded-lg"
				onClick={() => setOpen((prev) => !prev)}
			>
				<Download className="size-4 mr-2" />
				Download Files
				<ChevronDownIcon className="ml-2 size-4 text-primary60" />
			</Button>

			{open && (
				<div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg border border-gray-200 text-primary80 bg-white p-3 z-50">
					<div className="flex items-center gap-2 text-primary80 font-medium text-sm mb-2">
						<Database className="size-5 text-primary80 shrink-0" />
						{dataSourceName || 'Datasource Files'}
					</div>

					<div className="border-t border-gray-200 pt-2">
						<div className="relative pl-4">
							<div className="absolute top-0 bottom-0 w-[2px] bg-gray-300 rounded-full"></div>

							<div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
								{files.map((file) => (
									<div
										key={file.id}
										className="relative flex justify-between items-center py-2 pr-1 text-primary80 text-sm"
									>
										<div className="absolute left-0 top-3 h-3 w-4 border-l-2 border-b-2 border-gray-300 rounded-bl-[0.65rem]"></div>

										<div className="flex gap-2 items-center pl-6 min-w-0">
											<FileText className="size-4 text-primary80 flex-shrink-0" />
											<span className="text-sm truncate max-w-full block">
												{file.filename}
											</span>
										</div>

										<button
											className="hover:bg-purple-2 hover:scale-105 transition-all duration-150 rounded-md p-1"
											onClick={() => handleDownload(file)}
										>
											<Download className="size-5 text-primary60 hover:text-primary80" />
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export function ConfirmationModal({ isOpen, onClose, onConfirm }) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md rounded-xl p-4 gap-0">
				<DialogHeader className="flex flex-row justify-between items-center">
					<DialogTitle className="text-lg text-primary80 font-semibold flex gap-3 items-center justify-center">
						<div className="relative flex items-center justify-center w-14 h-14">
							<div className="absolute inset-0 rounded-full bg-purple-8" />
							<div className="absolute w-10 h-10 rounded-full bg-purple-10 opacity-60" />
							<ArrowUpDown
								className="relative w-5 h-5 text-primary"
								strokeWidth={2}
							/>
						</div>
						Switch Datasource?
					</DialogTitle>
				</DialogHeader>

				<p className="text-sm text-primary80 mt-4">
					Are you sure you want to switch datasource in between the ongoing
					session?
				</p>

				<div className="flex justify-end gap-2 mt-6">
					<Button
						variant="outline"
						className="h-8 px-4 text-xs"
						onClick={onClose}
					>
						No
					</Button>
					<Button
						className="bg-primary text-white h-8 px-4 text-xs"
						onClick={onConfirm}
					>
						Yes
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

const Header = () => {
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [value, setValue] = useLocalStorage('userDetails');
	const { pathname, query } = useRouter();
	const [open, setOpen] = useState(false);
	const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

	// const dispatch = useDispatch();
	const renderAvatar = () => {
		return (
			<Avatar>
				<AvatarImage src={value?.avatar} />
				<AvatarFallback>{getInitials(value?.user_name)}</AvatarFallback>
			</Avatar>
		);
	};

	const validPath = pathname.includes('session');
	const validSession = !!query.sessionId;

	const { data: datasourceDetails } = useDatasourceDetailsV2();

	const {
		data: userDetails,
		isLoading: isUserDetailsLoading,
		error,
	} = useQuery({
		queryKey: ['user-details'],
		queryFn: authUserDetails,
		refetchInterval: 10000,
	});

	const { data: sessionData } = useQuery({
		queryKey: ['session', query.sessionId],
		queryFn: () => getSession(query.sessionId),
		enabled: !!query.sessionId,
		staleTime: 60000,
	});

	const enabled = validPath && validSession && !sessionData?.metadata?.shared;

	useEffect(() => {
		if (userDetails) {
			setHasUnreadNotifications(userDetails?.has_notifications);
			setValue({
				...userDetails,
			});
		}
	}, [userDetails]);

	useEffect(() => {
		if (error) {
			logError(error, {
				feature: 'header',
				action: 'fetch_user_details',
				extra: { hasUserData: !!(value.user_name && value.email) },
			});
		}
	}, [error, value.user_name, value.email]);

	const showDataSourceName = datasourceDetails && pathname.includes('/new-chat');

	// const openReportGenerateModal = () => {
	// 	dispatch(
	// 		updateUtilProp([{ key: 'isGenerateReportModalOpen', value: true }]),
	// 	);
	// };

	// const renderGenerateSessionReport = () => {
	// 	const validPath = pathname.includes('session');
	// 	const validSession = !!query.sessionId;
	// 	const enabled = validPath && validSession;
	// 	let uiContent = '';
	// 	if (enabled) {
	// 		uiContent = (
	// 			<div
	// 				className={`flex gap-1 mb-4 p-2  items-center rounded-lg ${enabled ? 'cursor-pointer bg-purple-10 text-primary80' : 'bg-gray-1 text-primary40'}`}
	// 				onClick={() => enabled && openReportGenerateModal()}
	// 			>
	// 				<span className="material-symbols-outlined">description</span>
	// 				<span className="text-sm font-medium">
	// 					Generate Session Report
	// 				</span>
	// 			</div>
	// 		);
	// 	}
	// 	return uiContent;
	// };

	const menuItems = [
		{
			title: (
				<>
					<RocketIcon className="mr-2 size-4" />
					Get Started
				</>
			),
			link: 'https://irame.ai',
		},
		{
			title: (
				<>
					<ReaderIcon className="mr-2 size-4" />
					Terms of Use
				</>
			),
			link: 'https://www.irame.ai/terms-of-use',
		},
		{
			title: (
				<>
					<LockClosedIcon className="mr-2 size-4" />
					Privacy Policy
				</>
			),
			link: 'https://www.irame.ai/privacy-policy',
		},
		{
			title: (
				<>
					<i className="bi-box-arrow-left mr-2 text-primary100"></i>
					Logout
				</>
			),
			onClick: async () => {
				try {
					trackEvent(
						EVENTS_ENUM.LOGOUT_CLICKED,
						EVENTS_REGISTRY.LOGOUT_CLICKED,
					);
					await fullLogout();
					setValue({});
					trackEvent(
						EVENTS_ENUM.LOGOUT_SUCCESSFUL,
						EVENTS_REGISTRY.LOGOUT_SUCCESSFUL,
					);
				} catch (error) {
					trackEvent(
						EVENTS_ENUM.LOGOUT_FAILED,
						EVENTS_REGISTRY.LOGOUT_FAILED,
						() => ({
							...getErrorAnalyticsProps(error),
						}),
					);
				}
			},
		},
	];

	return (
		<header
			className={cn(
				'flex justify-between items-center py-2 pt-4 px-5 text-lg text-primary100 shrink-0',
				pathname.includes('/dashboard') ? 'bg-gray-muted' : 'bg-white',
			)}
		>
			<div className="flex gap-4 items-center">
				{showDataSourceName ? (
					<DataSourceSwitcher />
				) : (
					<span className="font-medium text-lg">{'Irame.ai'}</span>
				)}
				{/* {renderGenerateSessionReport()} */}
			</div>

			<div className="flex gap-6 items-center">
				{/* <ThemeToggle /> */}
				{enabled &&
					datasourceDetails?.files?.length > 0 &&
					datasourceDetails?.datasource_type !==
						DATASOURCE_TYPES.SQL_GENERATED && (
						<DownloadFilesDropdown
							files={datasourceDetails.files}
							dataSourceName={datasourceDetails.name}
						/>
					)}

				{enabled && !sessionData?.metadata?.workflow_run_id && (
					<Button
						variant="outline"
						className="py-2 px-3 text-sm flex items-center font-semibold !text-primary80 rounded-lg"
						onClick={() => setOpen(true)}
					>
						<Share2 className="size-4 mr-2" />
						Share
					</Button>
				)}
				<div
					className="relative p-2 bg-[#F9FAFB] rounded-lg flex items-center justify-center cursor-pointer"
					onClick={() => setIsNotificationOpen(true)}
				>
					<img src={bellIcon} className="size-4" />

					{hasUnreadNotifications && (
						<div className="absolute top-[-0.25rem] right-[-0.25rem] size-3 rounded-full bg-[#6A12CD]"></div>
					)}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{renderAvatar()}
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-46 mr-5">
						<DropdownMenuGroup>
							{menuItems?.map((item, index) => (
								<DropdownMenuItem
									key={index}
									className="text-primary100 text-sm"
									onClick={() => {
										if (item.link) {
											window.open(item.link, '_blank');
										}
										item?.onClick?.();
									}}
								>
									{item.title}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<ShareChatModal
				open={open}
				onClose={() => setOpen(false)}
				sessionId={query?.sessionId}
			/>
			{isNotificationOpen && (
				<NotificationDrawer
					isOpen={isNotificationOpen}
					setIsOpen={setIsNotificationOpen}
				/>
			)}
		</header>
	);
};

export default Header;
