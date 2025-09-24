import useLocalStorage from '@/hooks/useLocalStorage';
import ThemeToggle from './ThemeToggle';
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
import { useEffect } from 'react';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { logError } from '@/lib/logger';
import { authUserDetails } from './features/login/service/auth.service';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { ReaderIcon } from '@radix-ui/react-icons';
import { RocketIcon } from '@radix-ui/react-icons';
import { useDatasourceId } from '@/hooks/use-datasource-id';
import useDataSourceDetails from '@/api/datasource/hooks/useDataSourceDetails';
import { data } from 'autoprefixer';

const Header = () => {
	const [value, setValue] = useLocalStorage('userDetails');
	const { pathname, query } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const renderAvatar = () => {
		return (
			<Avatar>
				<AvatarImage src={value?.avatar} />
				<AvatarFallback>{getInitials(value?.user_name)}</AvatarFallback>
			</Avatar>
		);
	};

	const { data: datasourceDetails } = useDataSourceDetails();

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (value.user_name && value.email && value.user_id) return;
				const userData = await authUserDetails();

				// Update local state with user details
				setValue({
					...userData,
				});
			} catch (error) {
				logError(error, {
					feature: 'header',
					action: 'fetch_user_details',
					extra: { hasUserData: !!(value.user_name && value.email) },
				});
			}
		};
		fetchData();
	}, []);

	const showDataSourceName = datasourceDetails && pathname.includes('/new-chat');

	const openReportGenerateModal = () => {
		dispatch(
			updateUtilProp([{ key: 'isGenerateReportModalOpen', value: true }]),
		);
	};

	const renderGenerateSessionReport = () => {
		const validPath = pathname.includes('session');
		const validSession = !!query.sessionId;
		const enabled = validPath && validSession;
		let uiContent = '';
		if (enabled) {
			uiContent = (
				<div
					className={`flex gap-1 mb-4 p-2  items-center rounded-lg ${enabled ? 'cursor-pointer bg-purple-10 text-primary80' : 'bg-gray-1 text-primary40'}`}
					onClick={() => enabled && openReportGenerateModal()}
				>
					<span className="material-symbols-outlined">description</span>
					<span className="text-sm font-medium">
						Generate Session Report
					</span>
				</div>
			);
		}
		return uiContent;
	};

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
				'flex justify-between items-center py-2 px-5 text-lg text-primary100 shrink-0',
				pathname.includes('/dashboard') ? 'bg-gray-muted' : 'bg-white',
			)}
		>
			<div className="flex gap-6 items-center">
				{showDataSourceName ? (
					<div className="flex gap-2 items-center rounded-lg px-3 py-2 bg-purple-10 text-primary80 text-sm font-medium w-fit truncate">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
							alt="edit-prompt"
							className="size-[1.25rem]"
						/>
						{datasourceDetails?.name}
						<span className="relative flex size-3 ">
							<span className="absolute inline-flex h-full w-full rounded-full bg-green-500"></span>
							<span className="animate-ping relative inline-flex rounded-full size-3 bg-green-500"></span>
						</span>
					</div>
				) : (
					<span className="font-medium text-lg">{'Irame.ai'}</span>
				)}
				{/* {renderGenerateSessionReport()} */}
			</div>

			<div className="flex gap-6">
				{/* <ThemeToggle /> */}

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
		</header>
	);
};

export default Header;
