import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import capitalize from 'lodash.capitalize';

const BusinessProcessCard = ({ process, onClick }) => (
	<Card
		key={process.external_id}
		className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
		onClick={onClick}
	>
		<CardHeader>
			<div className="flex text-primary100 gap-2">
				<span className="material-symbols-outlined w-fit rounded-lg p-2 border border-primary10">
					family_history
				</span>
			</div>
		</CardHeader>
		<CardContent className="text-primary100">
			<CardTitle className="text-lg font-semibold">
				{capitalize(process.name)}
			</CardTitle>
			<p className="text-primary80 mb-4">{process.description}</p>
			<div className="flex flex-wrap gap-2">
				{process?.tags?.map((tag, index) => (
					<Badge
						key={index}
						variant="outline"
						className="px-2 py-1 bg-primary4 border-none"
					>
						{capitalize(tag)}
					</Badge>
				))}
			</div>
		</CardContent>
	</Card>
);

export default BusinessProcessCard;
