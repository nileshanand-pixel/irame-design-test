// components/Breadcrumb.jsx
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import capitalize from 'lodash.capitalize';

export default function Breadcrumb({ reportName }) {
	const navigate = useNavigate();
	return (
		<nav
			className="flex min-w-0 items-center gap-1 text-primary80"
			aria-label="Breadcrumb"
		>
			<span
				onClick={() => navigate('/app/reports/datasources')}
				className="text-sm font-medium cursor-pointer"
			>
				Report
			</span>

			<ChevronRight aria-hidden className="size-4 shrink-0 " />

			<p
				className={clsx(
					'min-w-0 truncate cursor-auto font-medium text-primary80',
					'text-lg sm:text-xl lg:text-2xl',
				)}
				title={reportName}
			>
				{capitalize(reportName)}
			</p>
		</nav>
	);
}
