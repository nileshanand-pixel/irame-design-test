import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const AiConciergeTile = ({ feature }) => {
	const navigate = useNavigate();
	const Icon = feature.icon;

	return (
		<Card
			className="hover:bg-[#F9F6FD]/80 hover:border-primary16 cursor-pointer transition-colors"
			onClick={() => navigate(`/app/ai-concierge/${feature.route}`)}
		>
			<CardHeader>
				<div className="flex items-center">
					<span className="rounded-lg bg-white p-2.5 border border-primary10 inline-flex">
						<Icon className="text-primary80 size-6" strokeWidth={1.5} />
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<h3 className="text-base font-semibold text-primary100">
					{feature.name}
				</h3>
				<p className="text-primary80 text-sm mt-1 mb-4 line-clamp-2 h-10">
					{feature.description}
				</p>
				<div className="flex flex-wrap gap-2">
					{feature.tags.map((tag) => (
						<Badge
							key={tag}
							variant="outline"
							className="px-2 py-1 bg-primary4 text-primary80 font-medium border-none"
						>
							{tag}
						</Badge>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

export default AiConciergeTile;
