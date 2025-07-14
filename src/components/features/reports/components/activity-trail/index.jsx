import { useQuery } from '@tanstack/react-query';
import { useReportId } from '../../hooks/useReportId';
import { getActivityTrail } from '../../service/reports.service';
import ActivityTrailSkeleton from './skeleton';
import { formatRelativeTime } from '@/utils/date-utils';
import UserProfileIcon from '@/components/elements/user-profile-icon';

export default function ActivityTrail() {
	const reportId = useReportId();

	const { data: activities, isLoading } = useQuery({
		queryKey: ['activity-trail', reportId],
		queryFn: () => getActivityTrail(reportId),
	});

	return (
		<div className="mt-8">
			{isLoading ? (
				<ActivityTrailSkeleton />
			) : (
				<>
					<div className="text-base font-semibold mb-6">Activity</div>

					<div className="flex flex-col gap-4">
						{activities?.activity_trail?.length === 0
							? 'No activity'
							: activities?.activity_trail?.map((activity) => (
									<div className="flex gap-[6px] items-center">
										<UserProfileIcon
											userName={activity.user}
											userEmail={activity.email}
										/>

										<div className="text-sm">
											{activity.text}
										</div>

										<div className="w-1 h-1 rounded-full bg-[#999]"></div>

										<div className="text-sm text-[#26064A99]">
											{formatRelativeTime(activity.create_at)}
										</div>
									</div>
								))}
					</div>
				</>
			)}
		</div>
	);
}
