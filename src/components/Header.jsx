import useLocalStorage from '@/hooks/useLocalStorage';
import ThemeToggle from './ThemeToggle';
import { fullLogout, logout } from './features/login/service/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getToken, getInitials, cn } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getUserDetailsFromToken } from '@/lib/cookies';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

const Header = () => {
	const [value, setValue] = useLocalStorage('userDetails');
	const { pathname, query } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const renderAvatar = () => {
		return (
			<Avatar>
				<AvatarImage src={value?.avatar} />
				<AvatarFallback>{getInitials(value?.userName)}</AvatarFallback>
			</Avatar>
		);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (value.userName && value.email && value.userId) return;
				const userData = getUserDetailsFromToken();

				// Update local state with user details
				setValue({
					...userData,
					token: getToken(),
				});
			} catch (error) {
				console.error('Error fetching user details:', error);
			}
		};
		fetchData();
	}, []);

	const showDataSourceName =
		utilReducer?.selectedDataSource?.name && pathname.includes('/new-chat');

	const openReportGenerateModal = () => {
		dispatch(updateUtilProp([{key: 'isGenerateReportModalOpen', value: true}]))
	}

	const renderGenerateSessionReport = () => {
		const validPath = pathname.includes('session');
		const validSession = !!query.sessionId;
		const enabled = validPath && validSession;
		let uiContent = '';
		if (enabled) {
			uiContent = (
				<div className={`flex gap-1 mb-4 p-2  items-center rounded-lg ${enabled ? 'cursor-pointer bg-purple-10 text-primary80': 'bg-gray-1 text-primary40'}`} onClick={() => enabled && openReportGenerateModal()} >
					<span className="material-symbols-outlined">description</span>
					<span className='text-sm font-medium'>Generate Session Report</span>
				</div>
			);
		}
		return uiContent;
	};
	return (
		<header
			className={cn(
				'flex justify-between px-5 py-4 text-lg text-primary100',
				pathname.includes('/dashboard') ? 'bg-gray-muted' : 'bg-white',
			)}
		>
			<div className='flex gap-6'>
			{showDataSourceName ? (
				<div className="mb-4 flex gap-2 items-center rounded-lg px-3 py-2 bg-purple-10 text-primary80 text-sm font-medium w-fit truncate">
					<img
						src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
						alt="edit-prompt"
					/>
					{utilReducer?.selectedDataSource?.name}
					<span className="relative flex size-3 ">
						<span className="absolute inline-flex h-full w-full rounded-full bg-green-500"></span>
						<span className="animate-ping relative inline-flex rounded-full size-3 bg-green-500"></span>
					</span>
				</div>
			) : (
				<span className="font-medium text-lg leading-[21.78px]">
					{'Irame.ai'}
				</span>
			)}
			{renderGenerateSessionReport()}
			</div>
			
			<div className="flex gap-6">
				{/* <ThemeToggle /> */}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{renderAvatar()}
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-46 mr-5">
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="text-primary100 text-sm font-medium"
								onClick={() => {
									fullLogout();
									setValue({});
								}}
							>
								<i className="bi-box-arrow-left mr-2 text-primary100"></i>
								Logout
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
};

export default Header;
