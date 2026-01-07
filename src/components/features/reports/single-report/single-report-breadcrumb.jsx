import BreadCrumbs from '@/components/BreadCrumbs';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export default function SingleReportBreadcrumb({ reportDetails }) {
	const { isOwner } = useReportPermission();

	const breadcrumbItems = [
		{
			label: 'Reports',
			icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/report-icon.svg',
		},
		{
			label: isOwner ? 'My Reports' : 'Shared Reports',
			path: isOwner
				? '/app/reports#my-reports'
				: '/app/reports#shared-reports',
		},
		{
			label: reportDetails.report?.name,
		},
	];

	return <BreadCrumbs items={breadcrumbItems} />;
}
