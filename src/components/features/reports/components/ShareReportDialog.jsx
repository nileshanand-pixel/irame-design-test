import React, { useState, useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AccessDropdown from './AccessDropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReportAccessDetails, shareReport } from '../service/reports.service';
import { getToken } from '@/lib/utils';
import { toast } from 'sonner';
import useLocalStorage from '@/hooks/useLocalStorage';
import AccessSkeletonList from './AccessSkeleton';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';
import { closeModal } from '@/redux/reducer/modalReducer';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useReportId } from '../hooks/useReportId';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';

const ShareReportDialog = React.memo(() => {
	const dispatch = useDispatch();
	const modalState = useSelector((state) => state.modalReducer);
	const reportReducer = useSelector((state) => state.reportStoreReducer);
	const authStoreReducer = useSelector((state) => state.authStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);

	const [invitedEmails, setInvitedEmails] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [currentUser] = useLocalStorage('userDetails');
	const queryClient = useQueryClient();

	const reportIdFromRoute = useReportId();
	const selectedReport = reportReducer?.selectedReport;
	const reportId = reportIdFromRoute || selectedReport?.report_id;

	const handleClose = () => {
		dispatch(closeModal('shareReport'));
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: null }]));
		setInvitedEmails([]);
		setInputValue('');
	};

	const shareMutation = useMutation({
		mutationFn: async (data) => {
			await shareReport(getToken(), data.reportId, {
				accesses: data.accesses,
			});
		},
		onSuccess: () => {
			toast.success('Report Shared Successfully');
			setInvitedEmails([]);
			queryClient.invalidateQueries(['get-report-user-access'], {
				refetchActive: true,
				refetchInactive: true,
			});
			handleClose();
		},
		onError: (err) => {
			toast.error('Something went wrong while sharing report');
		},
	});

	const queryFn = useCallback(() => {
		if (!reportId) return;
		return getReportAccessDetails(getToken(), reportId);
	}, [reportId]);

	const reportSharedData = useQuery({
		queryKey: ['get-report-user-access', reportId],
		queryFn,
		enabled: !!reportId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const handleAddEmail = useCallback(
		(e) => {
			if (
				(e.key === 'Enter' || e.key === 'Tab' || e.key === ',') &&
				inputValue.trim()
			) {
				e.preventDefault();
				const trimmedValue = inputValue.trim();
				if (isValidEmail(trimmedValue)) {
					setInvitedEmails([
						...invitedEmails,
						{ email: trimmedValue, level: 'view' },
					]);
					setInputValue('');
				}
			}
		},
		[inputValue, invitedEmails],
	);

	const handleRemoveEmail = useCallback(
		(index) => {
			setInvitedEmails(invitedEmails.filter((_, i) => i !== index));
		},
		[invitedEmails],
	);

	const handleChangeLevel = useCallback(
		(index, level) => {
			const updatedEmails = [...invitedEmails];
			updatedEmails[index].level = level;
			setInvitedEmails(updatedEmails);
		},
		[invitedEmails],
	);

	const handleSave = useCallback(() => {
		let currentuser_id = authStoreReducer?.user_id;
		if (!currentuser_id) {
			currentuser_id = utilReducer?.sessionHistory?.[0]?.user_id;
		}
		if (!authStoreReducer?.user_id)
			dispatch(
				updateAuthStoreProp([{ key: 'user_id', value: currentuser_id }]),
			);
		if (selectedReport?.user_id !== currentuser_id) {
			toast.error('You are not authorized for this operation!');
			setInvitedEmails([]);
			return;
		}
		shareMutation.mutate({
			reportId: reportId,
			accesses: invitedEmails,
		});
		trackEvent(EVENTS_ENUM.REPORT_SHARED, EVENTS_REGISTRY.REPORT_SHARED);
	}, [invitedEmails, reportId, shareMutation, selectedReport?.user_id]);

	const isValidEmail = (email) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	};

	const SHARING_WEIGHT_ENUM = {
		owner: 20,
		edit: 15,
		remove: 10,
		view: 5,
	};

	const accessOptions = [
		{ value: 'owner', label: 'Owner', disabled: true, show: true },
		{ value: 'edit', label: 'Can Edit', disabled: false, show: false },
		{ value: 'view', label: 'Can View', disabled: false, show: true },
		{ value: 'remove', label: 'Remove', disabled: false, show: false },
	];

	const renderSharedPeopleData = () => {
		const peopleWithAccess = [];
		const dataFromAPI = reportSharedData?.data?.accesses?.map((item) => ({
			...item,
		}));

		if (dataFromAPI && dataFromAPI.length > 0) {
			const ownerEntry = dataFromAPI.filter((item) => item.level === 'owner');
			const otherEntries = dataFromAPI.filter(
				(item) => item.level !== 'owner',
			);

			peopleWithAccess.push(...ownerEntry, ...otherEntries);
		}

		const currentUserAccessData = peopleWithAccess.find(
			(people) => people.email === currentUser?.email,
		);

		if (!currentUserAccessData) return;

		peopleWithAccess.forEach((person) => {
			person.options = [];
			if (person.level === 'owner') {
				person.options = accessOptions.filter(
					(accessOption) => accessOption.value === 'owner',
				);
			} else {
				person.options = accessOptions.filter((accessOption) => {
					const currentUserWeight =
						SHARING_WEIGHT_ENUM[currentUserAccessData?.level];
					const optionWeight = SHARING_WEIGHT_ENUM[accessOption.value];
					return (
						currentUserWeight >= optionWeight &&
						accessOption.value !== 'owner' &&
						accessOption.show
					);
				});
			}
		});

		return peopleWithAccess?.map((item, index) => (
			<li
				key={item?.user_id}
				className="flex justify-between items-center pb-1"
			>
				<div className="flex gap-1 items-center">
					<i className="bi bi-person text-xl text-[#00000066]" />
					<span className="text-black/80">{item.name}</span>
				</div>
				<AccessDropdown
					options={item.options}
					selectedValue={item.level}
					onChange={(value) => handleChangeLevel(index, value)}
				/>
			</li>
		));
	};

	return (
		<Dialog open={!!modalState.shareReport} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="border-b pb-3">
					<DialogTitle>Share this Report</DialogTitle>
					<DialogDescription>
						You can invite people to view the Report.
					</DialogDescription>
				</DialogHeader>

				<div className="mb-2">
					<Label className="text-[#00000099]">Invite People</Label>
					<div className="border border-gray-300 p-2 mt-1 rounded text-[#00000099] font-medium">
						<div className="flex flex-wrap gap-2">
							{invitedEmails?.map((item, index) => (
								<div
									key={index}
									className="flex space-x-2 text-sm bg-white-100 px-3 items-center rounded-full border-[1px] border-[#0000001A]"
								>
									<i className="bi bi-person-fill text-xl text-[#00000066]" />
									<span>{item.email}</span>
									<i
										onClick={() => handleRemoveEmail(index)}
										className="bi bi-x text-2xl text-[#00000066] cursor-pointer"
									/>
								</div>
							))}
						</div>
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleAddEmail}
							placeholder={
								invitedEmails.length === 0
									? 'Type email and press enter'
									: ''
							}
							className="w-full outline-none border-none"
						/>
					</div>
				</div>

				<div className="mb-2">
					<p className="text-sm text-black/60 mb-2">Who has access</p>
					{reportSharedData?.isPending ? (
						<AccessSkeletonList />
					) : (
						<ul className="space-y-2">{renderSharedPeopleData()}</ul>
					)}
				</div>

				<DialogFooter className="flex w-full">
					<Button
						onClick={handleSave}
						className="rounded-lg hover:bg-purple-100 w-full hover:text-white hover:opacity-80"
						disabled={!invitedEmails.length || shareMutation.isPending}
					>
						{shareMutation.isPending ? (
							<i className="bi-arrow-clockwise animate-spin me-2"></i>
						) : null}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});

export default ShareReportDialog;
