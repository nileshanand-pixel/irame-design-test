import { getShareableUsers } from '@/api/share.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import SearchableDropdown from './searchable-dropdown';

export function OwnerDropdown({ value, onChange }) {
	const [hasOpened, setHasOpened] = useState(false);

	const { data: shareableUsersData, isLoading } = useQuery({
		queryKey: ['shareable-users'],
		queryFn: getShareableUsers,
		enabled: hasOpened,
	});

	const handleOpenChange = (open) => {
		if (open && !hasOpened) setHasOpened(true);
	};

	const ownerOptions = useMemo(() => {
		return (shareableUsersData || []).map((user) => ({
			value: user.user_id,
			label: user.name,
			email: user.email,
		}));
	}, [shareableUsersData]);

	if (hasOpened && isLoading) {
		return (
			<Button
				variant="outline"
				className="!focus:outline-none !outline-none !focus:ring-0 !ring-0 flex font-medium items-center mr-2 h-10 gap-2 border-1 border-primary10 rounded-lg text-sm !text-primary80 cursor-pointer bg-white"
				disabled
			>
				<span>Loading...</span>
			</Button>
		);
	}

	return (
		<SearchableDropdown
			options={ownerOptions}
			value={value}
			onChange={onChange}
			placeholder="owners"
			searchPlaceholder="Search Owners"
			buttonLabel="Owner"
			isMultiSelect={true}
			onOpenChange={handleOpenChange}
			renderOption={(opt) => (
				<div className="flex flex-col gap-1">
					<div className="text-sm truncate-ellipsis-1">{opt.label}</div>
					<div className="text-xs text-primary60 truncate-ellipsis-1">
						{opt.email}
					</div>
				</div>
			)}
		/>
	);
}
