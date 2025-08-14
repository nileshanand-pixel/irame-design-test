// components/Breadcrumb.jsx
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import upperFirst from 'lodash.upperfirst';

export default function Breadcrumb({ reportName }) {
	const navigate = useNavigate();
	return (
		<nav
			className="flex min-w-0 items-center gap-1 text-primary80"
			aria-label="Breadcrumb"
		>
			<span
				onClick={() =>
					navigate('/app/reports/datasources/report?datasourceId=audit')
				}
				className="text-sm font-medium cursor-pointer"
			>
				Report
			</span>

			<ChevronRight aria-hidden className="size-4 shrink-0 " />

			<p
				className={clsx(
					'min-w-0 truncate cursor-auto font-medium text-primary80',
					'text-2xl',
				)}
				title={reportName}
			>
				{upperFirst(reportName)}
			</p>
		</nav>
	);
}
