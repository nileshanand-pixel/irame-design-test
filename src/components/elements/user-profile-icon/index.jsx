import useLocalStorage from '@/hooks/useLocalStorage';
import { getDarkColorFromString, getUserInitials } from '@/utils/common';
import { useMemo } from 'react';

export default function UserProfileIcon({
	userName,
	userEmail,
	fontSize = 'text-[0.5rem]',
	width = 'w-6',
	height = 'h-6',
}) {
	const [value] = useLocalStorage('userDetails');

	const isCurrentUser = useMemo(() => {
		return userEmail === value.email;
	}, [value, userEmail]);

	const initials = getUserInitials(userName);

	return (
		<div
			className={`${isCurrentUser && 'bg-[#333333]'} text-[#FFFFFF] ${fontSize} ${width} ${height} rounded-full font-semibold flex items-center justify-center`}
			style={{
				backgroundColor: !isCurrentUser && getDarkColorFromString(initials),
			}}
		>
			{initials}
		</div>
	);
}
