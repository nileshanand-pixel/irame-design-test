import React from 'react';
import { Badge } from '@/components/ui/badge';
import upperFirst from 'lodash.upperfirst';

const wordsPerMinute = 200;

const calculateReadTime = (text) => {
	const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
	const wordCount = cleanText.trim().split(/\s+/).length;
	return Math.ceil(wordCount / wordsPerMinute);
};

const ReportHero = ({ reportDetails }) => {
	const { report, cards } = reportDetails;
	const title = report?.name || 'Untitled Report';
	const description = report?.data?.description || '';

	const allText = [
		description,
		...cards.map((card) => card.data?.answer || ''),
	].join(' ');

	const readTime = calculateReadTime(allText);

	return (
		<div className="overflow-x-hidden space-y-2">
			<h1 className="text-4xl break-words font-semibold text-primary100">
				{upperFirst(title)}
			</h1>

			{description && (
				<div className="text-muted-foreground text-sm leading-relaxed">
					{upperFirst(description)}
				</div>
			)}

			<div className="flex items-center text-muted-foreground text-sm pt-2">
				<Badge className="rounded-full w-8 h-8 p-0 flex items-center justify-center mr-3 bg-pink-700">
					I
				</Badge>
				<div className="flex flex-col text-sm">
					<span className="font-medium text-primary80">
						Curated by Irame
					</span>
					<span className="font-normal text-primary60">
						{readTime} min read
					</span>
				</div>
			</div>
		</div>
	);
};

export default ReportHero;
