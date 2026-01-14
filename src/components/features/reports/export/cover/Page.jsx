import { useQuery } from '@tanstack/react-query';
import { useReportId } from '../../hooks/useReportId';
import { getUserReport } from '../../service/reports.service';

export default function ReportCoverPage() {
	const reportId = useReportId();

	if (!reportId) {
		return null;
	}

	const {
		data: reportDetails,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: async () => {
			const result = await getUserReport(reportId);
			return result;
		},
		enabled: Boolean(reportId),
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) {
		return (
			<div className="p-10 text-red-500">
				<h1 className="text-2xl font-bold">Error loading report</h1>
				<p>Status: {error.response?.status}</p>
				<p>Details: {error.message}</p>
			</div>
		);
	}

	return (
		<div className="relative w-full h-screen  mx-auto bg-white overflow-hidden shadow-sm">
			{reportDetails && (
				<div id="api-data-loaded" style={{ display: 'none' }}></div>
			)}
			{/* <div className="absolute top-0 right-0 w-[170px] h-[296px] overflow-hidden">
				<img src="/assets/icons/layer-pattern.svg" alt="sox-logo" />
			</div> */}

			<div className="absolute top-0 right-0 w-[170px] h-[296px] overflow-hidden">
				<svg
					width="170"
					height="296"
					viewBox="0 0 170 296"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full"
				>
					<g clipPath="url(#clip1_370_148619)">
						<path
							d="M126.102 0L0 126.349H57.8561L170 14.0018V0H126.102Z"
							fill="#7D5AA6"
						/>
						<path
							d="M169.32 295.999L0 126.348H57.8561L170 238.695V252.696L169.32 295.999Z"
							fill="#5E3996"
						/>
						<path
							d="M169.998 135.944L34.3203 0H169.998V135.944Z"
							fill="#C0A5CE"
						/>
					</g>
					<defs>
						<clipPath id="clip1_370_148619">
							<rect width="170" height="296" fill="white" />
						</clipPath>
					</defs>
				</svg>
			</div>

			{/* Bottom left corner - mirrored version */}
			<div className="absolute bottom-0 left-0 w-[170px] h-[296px] overflow-hidden">
				<svg
					width="170"
					height="296"
					viewBox="0 0 170 296"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full transform scale-x-[-1] scale-y-[-1]"
				>
					<g clipPath="url(#clip1_370_148619)">
						<path
							d="M126.102 0L0 126.349H57.8561L170 14.0018V0H126.102Z"
							fill="#7D5AA6"
						/>
						<path
							d="M169.32 295.999L0 126.348H57.8561L170 238.695V252.696L169.32 295.999Z"
							fill="#5E3996"
						/>
						<path
							d="M169.998 135.944L34.3203 0H169.998V135.944Z"
							fill="#C0A5CE"
						/>
					</g>
					<defs>
						<clipPath id="clip1_370_148619">
							<rect width="170" height="296" fill="white" />
						</clipPath>
					</defs>
				</svg>
			</div>

			{/* Content area */}
			<div className="relative z-10 px-8 pt-8  h-full flex flex-col">
				{/* SOX Logo */}
				<div className="mb-8 flex flex-col">
					<img
						src="/assets/icons/good-svg-logo-sox.svg"
						alt="sox-logo"
						className="size-56 object-contain"
					/>
					<div className="w-2/3 h-0.5 bg-[#6A12CD] mt-6"></div>
				</div>
				{/* Purple separator line */}

				{/* Main content area */}
				<div className="flex-1 flex items-center justify-center">
					<div className="w-3/4 mx-auto text-center">
						<p
							className="text-9xl font-bold text-gray-900 mb-4 break-words"
							id="report-name-display"
						>
							{reportDetails?.report?.name || 'Report'}
						</p>
						<h2 className="text-6xl text-gray-700">Audit Report</h2>
					</div>
				</div>

				{/* Footer */}
				<div className="flex absolute bottom-8 right-8 justify-end items-end text-purple-80 text-sm ">
					<span className="text-3xl font-medium relative -top-5">
						Created on
					</span>
					<img
						src="http://d2vkmtgu2mxkyq.cloudfront.net/irame-logo.svg"
						alt="FRAME"
						className="ml-3 relative top-10 size-44 object-contain"
					/>
				</div>
			</div>
		</div>
	);
}
