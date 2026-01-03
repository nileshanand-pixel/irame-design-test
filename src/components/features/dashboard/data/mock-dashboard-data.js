import { getTimeAgo } from '@/utils/common';

// Mock data for new dashboard feature
// This will be replaced with API calls when backend is ready

const generateMockDashboards = (count, isShared = false) => {
	const dashboards = [];
	const titles = [
		'Network Security Assessment',
		'API Integration Review',
		'Database Optimization',
		'Mobile App Design',
		'Accessibility Audit',
		'User Experience Research',
		'Performance Analysis',
		'Code Quality Review',
		'Security Compliance Check',
		'Infrastructure Monitoring',
		'User Experience Testing',
		'Content Strategy Workshop',
		'Security Audit',
	];

	const descriptions = [
		'Assessment of third-party API compatibility',
		'Evaluation of network vulnerabilities and defences',
		'Improving database performance and efficiency',
		'Creation of user interface for mobile application',
		'Review of product accessibility features',
		'Analysis of user behavior and preferences',
		'Comprehensive performance metrics analysis',
		'Code review and quality assessment',
		'Security compliance and audit review',
		'Infrastructure monitoring and alerting',
		'Testing user experience and interface interactions',
		'Workshop for content strategy and planning',
		'Comprehensive security audit and review',
	];

	// Owner names for shared dashboards
	const ownerNames = [
		'Tushar Goel',
		'Mina Sanchez',
		'Emily Chen',
		'Liam Johnson',
		'Sarah Williams',
		'Michael Brown',
		'Jessica Martinez',
	];

	const timeAgoOptions = [
		{ hours: 4 },
		{ hours: 2 },
		{ hours: 1 },
		{ minutes: 5 },
		{ minutes: 10 },
		{ hours: 3 },
		{ days: 1 },
		{ days: 2 },
		{ hours: 6 },
		{ hours: 8 },
	];

	for (let i = 0; i < count; i++) {
		const now = new Date();
		const timeOption = timeAgoOptions[i % timeAgoOptions.length];
		let createdAt;

		if (timeOption.days) {
			createdAt = new Date(
				now.getTime() - timeOption.days * 24 * 60 * 60 * 1000,
			);
		} else if (timeOption.hours) {
			createdAt = new Date(now.getTime() - timeOption.hours * 60 * 60 * 1000);
		} else {
			createdAt = new Date(now.getTime() - timeOption.minutes * 60 * 1000);
		}

		const ownerName = isShared ? ownerNames[i % ownerNames.length] : 'You';

		dashboards.push({
			id: `dashboard-${isShared ? 'shared' : 'my'}-${i + 1}`,
			title: titles[i % titles.length] || `Dashboard ${i + 1}`,
			description: descriptions[i % descriptions.length] || '',
			createdAt: createdAt.toISOString(),
			updatedAt: createdAt.toISOString(),
			createdBy: {
				id: isShared ? `user-${i + 2}` : 'user-1',
				name: ownerName,
				email: isShared
					? `${ownerName.toLowerCase().replace(' ', '.')}@example.com`
					: 'you@example.com',
				avatar: isShared ? null : null,
			},
			isShared,
			sharedWith: isShared
				? [
						{
							id: 'user-1',
							name: 'You',
							email: 'you@example.com',
						},
					]
				: [],
			tags: ['Analytics', 'Security', 'Performance'],
			timeAgo: getTimeAgo(createdAt),
		});
	}

	return dashboards;
};

export const mockDashboardData = {
	myDashboards: generateMockDashboards(7, false),
	sharedDashboards: generateMockDashboards(4, true), // Only 4 shared dashboards
};
