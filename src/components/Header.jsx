import useLocalStorage from '@/hooks/useLocalStorage';
import ThemeToggle from './ThemeToggle';
import { logout } from './features/login/service/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { tokenCookie, getToken, getInitials, cn } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { API_URL } from '@/config';

const Header = () => {
	const [value, setValue] = useLocalStorage('userDetails');
	const { pathname } = useRouter();
	return (
		<header
			className={cn(
				'flex justify-between px-5 py-4 text-lg text-primary100',
				pathname.includes('/dashboard') ? 'bg-gray-muted' : 'bg-white',
			)}
		>
			<span>{'Irame.ai'}</span>
			<div className="flex gap-6">
				{/* <ThemeToggle /> */}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Avatar>
							<AvatarImage src={value.avatar} />
							<AvatarFallback>
								{getInitials(value.userName)}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-46 mr-5">
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="text-primary100 text-sm font-medium"
								onClick={() =>
									window.location.replace(
										`${API_URL}/oauth/google/logout`,
									)
								}
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
