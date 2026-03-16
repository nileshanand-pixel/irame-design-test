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
import {
	getInitials,
	cn,
	toTitleCase,
	capitalizeFirstLetterFullText,
} from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useRef, useState } from 'react';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { syncAuthIdentity } from '@/redux/reducer/authReducer';
import { logError } from '@/lib/logger';
import { authUserDetails } from './features/login/service/auth.service';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { ENABLE_RBAC } from '@/config';
import { useRbac } from '@/hooks/useRbac';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
	ArrowUpDown,
	Database,
	DatabaseIcon,
	Download,
	FileText,
	Search,
	Share2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getSession,
	updateSessionMetadata,
} from './features/new-chat/service/new-chat.service';
import { useNavigate } from 'react-router-dom';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { useDataSources } from '@/hooks/useDataSources';
import { ShareChatModal } from './ShareChatModal';
import bellIcon from '@/assets/icons/bell.svg';
import NotificationDrawer from './features/notification/components/notification-drawer';
import LiveTag from './elements/live-tag';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';

import userProfileIcon from '@/assets/icons/user-profile.svg';
import shieldIcon from '@/assets/icons/shield.svg';
import questionIcon from '@/assets/icons/question.svg';
import chevronRightIcon from '@/assets/icons/chevron-right.svg';
import logoutIcon from '@/assets/icons/logout.svg';
import redirect from '@/assets/icons/redirect.svg';

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

	// console.log(activeDataSource?.datasource_type, "activeDataSource");
	return (
		<div ref={containerRef} className="relative inline-block">
			<button
				className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 text-primary80 text-sm font-semibold bg-white hover:bg-gray-50 transition-all focus:outline-none"
				onClick={() => setOpen(!open)}
			>
				<DatabaseIcon className="mr-2 size-4 text-primary80" />
				<span className="mr-2">
					{activeDataSource ? activeDataSource.name : 'Select Datasource'}
				</span>
				{activeDataSource?.datasource_type ===
					DATASOURCE_TYPES.SQL_GENERATED && <LiveTag />}
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
										'flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer text-sm text-left',
										String(activeDataSourceId) ===
											String(ds.datasource_id)
											? 'bg-purple-4 text-primary60'
											: 'text-primary80 hover:bg-purple-4',
									)}
									onClick={() => handleDatasourceClick(ds)}
								>
									<div className="flex items-center gap-2 w-[calc(100%-5rem)]">
										<DatabaseIcon
											className="flex-shrink-0 w-4 h-4 text-primary60"
											strokeWidth={2.5}
										/>
										{/* <div className="flex items-center justify-between"> */}
										<span className="truncate">{ds.name}</span>
									</div>

									{ds?.datasource_type ===
										DATASOURCE_TYPES.SQL_GENERATED && (
										<LiveTag />
									)}
									{/* </div> */}
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

export function HelpCenterSubmenu({ isOpen, onClose, parentRef }) {
	const submenuRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				submenuRef.current &&
				!submenuRef.current.contains(event.target) &&
				parentRef.current &&
				!parentRef.current.contains(event.target)
			) {
				onClose();
			}
		};
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose, parentRef]);

	const helpItems = [
		{
			title: 'Get Started',
			link: 'https://irame.ai',
		},
		{
			title: 'Term of Use',
			link: 'https://www.irame.ai/terms-of-use',
		},
		{
			title: 'Privacy Policy',
			link: 'https://www.irame.ai/privacy-policy',
		},
	];

	if (!isOpen) return null;

	return (
		<div
			ref={submenuRef}
			className="absolute w-[10rem] rounded-xl shadow-lg border border-gray-200 bg-white p-2 z-[100] right-[calc(100%+1.25rem)] top-[-1rem]"
		>
			<div className="flex flex-col gap-1">
				{helpItems.map((item, index) => (
					<div
						key={index}
						className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
						onClick={() => {
							window.open(item.link, '_blank');
						}}
					>
						<span className="text-xs text-[#26064A] font-normal">
							{item.title}
						</span>
						<img src={redirect} className="size-4 ml-auto" />
					</div>
				))}
			</div>
		</div>
	);
}

const Header = () => {
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [value, setValue] = useLocalStorage('userDetails');
	const { pathname, query } = useRouter();
	const [open, setOpen] = useState(false);
	const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
	const [isHelpSubmenuOpen, setIsHelpSubmenuOpen] = useState(false);
	const helpCenterRef = useRef(null);
	const [isPlanMode, setIsPlanMode] = useState(false);
	const queryClient = useQueryClient();

	const navigate = useNavigate();

	const dispatch = useDispatch();
	const { isRbacActive } = useRbac();
	const renderAvatar = () => {
		return (
			<Avatar>
				<AvatarImage src={value?.avatar} />
				<AvatarFallback>{getInitials(value?.user_name)}</AvatarFallback>
			</Avatar>
		);
	};

	const isSessionPage = pathname.includes('session');
	const isValidSession = !!query.sessionId;

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

	const { data: sessionData, isLoading: isSessionDataLoading } = useQuery({
		queryKey: ['session', query.sessionId],
		queryFn: () => getSession(query.sessionId),
		enabled: !!query.sessionId,
		staleTime: 60000,
	});

	const updateMetadataMutation = useMutation({
		mutationFn: ({ sessionId, metadata }) =>
			updateSessionMetadata(sessionId, metadata),
		onSuccess: (data, variables) => {
			// Update state only after successful API call
			setIsPlanMode(variables.metadata.plan_mode);
			// Invalidate session query to refetch the updated data
			queryClient.invalidateQueries({
				queryKey: ['session', query.sessionId],
			});
		},
	});

	const handlePlanModeChange = (checked) => {
		if (query.sessionId) {
			updateMetadataMutation.mutate({
				sessionId: query.sessionId,
				metadata: {
					plan_mode: checked,
				},
			});
		}
	};

	useEffect(() => {
		if (sessionData) {
			setIsPlanMode(sessionData?.metadata?.plan_mode || false);
		}
	}, [sessionData]);

	const isShareEnabled =
		isSessionPage && isValidSession && !sessionData?.metadata?.shared;

	const isDownloadEnabled =
		isSessionPage &&
		isValidSession &&
		datasourceDetails?.datasource_type !== DATASOURCE_TYPES.SQL_GENERATED;

	useEffect(() => {
		if (userDetails) {
			setHasUnreadNotifications(userDetails?.has_notifications);
			setValue({
				...userDetails,
			});

			// Sync identity to Redux store (non-destructive for selectedTeamId)
			dispatch(syncAuthIdentity(userDetails));
		}
	}, [userDetails, dispatch, setValue]);

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
		...(isRbacActive
			? [
					{
						title: 'Access Management',
						icon: <img src={shieldIcon} className="size-4 mr-3" />,
						onClick: () => {
							navigate('/app/access-management');
						},
					},
				]
			: []),
		{
			title: 'Help Center',
			icon: <img src={questionIcon} className="size-4 mr-3" />,
			hasSubmenu: true,
			subMenuComponent: HelpCenterSubmenu,
			onClick: (e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsHelpSubmenuOpen(!isHelpSubmenuOpen);
			},
		},
	];

	return (
		<header
			className={cn(
				'flex justify-between items-center py-2 pt-4 px-5 text-lg text-primary100 shrink-0',
				'bg-white',
			)}
		>
			<div className="flex gap-4 items-center">
				{showDataSourceName ? (
					<DataSourceSwitcher />
				) : (
					<span className="font-medium text-lg">
						{pathname.includes('access-management') ? (
							<div className="space-y-[0.125rem]">
								<div className="text-[#26064A] font-semibold">
									Access Management
								</div>
								<div className="text-[#26064ACC] text-sm font-normal">
									Manage users, roles, and permissions across your
									organization
								</div>
							</div>
						) : (
							'Irame.ai'
						)}
					</span>
				)}
				{/* {renderGenerateSessionReport()} */}
			</div>

			<div className="flex gap-6 items-center">
				{/* <ThemeToggle /> */}
				{isSessionPage && isValidSession && (
					<>
						{isSessionDataLoading ? (
							<div className="flex items-center gap-3">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-6 w-11 rounded-full" />
							</div>
						) : (
							<div className="flex items-center gap-3">
								<span className="text-sm text-[#26064ACC]">
									Plan Mode
								</span>
								<Switch
									checked={isPlanMode}
									onCheckedChange={handlePlanModeChange}
									className="data-[state=checked]:bg-primary"
									disabled={updateMetadataMutation.isPending}
								/>
							</div>
						)}
					</>
				)}
				{isDownloadEnabled && datasourceDetails?.files?.length > 0 && (
					<DownloadFilesDropdown
						files={datasourceDetails.files}
						dataSourceName={datasourceDetails.name}
					/>
				)}

				{isShareEnabled && (
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
					<DropdownMenuContent className="w-64 mr-5 p-0 overflow-visible">
						<div className="px-3 py-3 pb-2 border-b border-gray-200 mb-1">
							<div className="flex items-center gap-3">
								<img
									src={userProfileIcon}
									className="size-6 flex-shrink-0"
								/>
								<div className="flex flex-col min-w-0 flex-1">
									<span className="text-sm font-medium text-[#26064A] truncate">
										{capitalizeFirstLetterFullText(
											value?.user_name,
										)}
									</span>
									<span className="text-xs text-[#26064ACC] truncate">
										{value?.email}
									</span>
									{isRbacActive && value?.role_name && (
										<span className="text-[10px] text-[#26064ACC]/80 truncate mt-0.5">
											<span className="font-semibold">
												Role:
											</span>{' '}
											{toTitleCase(value?.role_name)}
										</span>
									)}
									{isRbacActive && value?.tenant_name && (
										<span className="text-[10px] text-[#26064ACC]/80 truncate mt-0.5">
											<span className="font-semibold">
												Organisation:
											</span>{' '}
											{toTitleCase(value?.tenant_name)}
										</span>
									)}
								</div>
							</div>
						</div>
						<DropdownMenuGroup className="p-2 space-y-2">
							{menuItems?.map((item, index) => (
								<DropdownMenuItem
									key={index}
									ref={item.hasSubmenu ? helpCenterRef : null}
									className="text-[#26064A] font-medium relative cursor-pointer"
									onSelect={(e) => {
										// Prevent dropdown from closing when clicking items with submenus
										if (item.hasSubmenu) {
											e.preventDefault();
										}
									}}
									onClick={(e) => {
										if (item.link) {
											window.open(item.link, '_blank');
										}
										item?.onClick?.(e);
									}}
								>
									{item.hasSubmenu && (
										<div className="relative">
											<item.subMenuComponent
												isOpen={isHelpSubmenuOpen}
												onClose={() =>
													setIsHelpSubmenuOpen(false)
												}
												parentRef={helpCenterRef}
											/>
										</div>
									)}
									{item.icon}
									{item.title}
									{item.hasSubmenu && (
										<img
											src={chevronRightIcon}
											className="size-3 ml-auto"
										/>
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>

						<div className="py-[0.375rem] px-[0.5rem] pb-[0.5rem] border-t border-gray-200">
							<div
								className="flex items-center hover:bg-gray-100 rounded-md p-1 px-2"
								onClick={async () => {
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
								}}
							>
								<img src={logoutIcon} className="size-4 mr-3" />
								<div className="text-[#26064A] font-medium relative cursor-pointer">
									Logout
								</div>
							</div>
						</div>
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
