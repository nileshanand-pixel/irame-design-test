import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const BreadCrumbs = ({ items = [] }) => {
	const navigate = useNavigate();

	const handleClick = (item) => {
		if (item.path) navigate(item.path);
		else if (item.onClick) item.onClick();
	};

	return (
		<div className="flex items-center gap-1 pb-2">
			{items.map((item, index) => {
				const isLast = index === items.length - 1;

				return (
					<div
						key={index}
						className={cn(
							'flex items-center gap-1 text-base',
							item.path &&
								!isLast &&
								'cursor-pointer hover:text-primary text-primary80',
						)}
						onClick={() => !isLast && handleClick(item)}
					>
						{/* ICON */}
						{item.icon && (
							<>
								{typeof item.icon === 'string' ? (
									<img
										src={item.icon}
										alt=""
										className="w-5 h-5 object-contain"
									/>
								) : (
									<div className="flex items-center justify-center">
										{item.icon}
									</div>
								)}
							</>
						)}

						{/* LABEL */}
						<span
							className={cn(
								'truncate',
								isLast && 'text-primary font-medium',
							)}
						>
							{item.label}
						</span>

						{/* DIVIDER */}
						{!isLast && (
							<ChevronRight className="size-5 text-primary80" />
						)}
					</div>
				);
			})}
		</div>
	);
};

export default BreadCrumbs;
