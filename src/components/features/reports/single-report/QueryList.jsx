import React from 'react';
import { QueryCard } from './QueryCard';

export default function QueryList({ reportDetails, pdfMode, cards }) {
	return (
		<div className={'w-full'}>
			{pdfMode ? (
				<div className="flex flex-col space-y-8">
					{cards.map((card) => (
						<div className="flex-1 overflow-x-hidden">
							<QueryCard
								key={card.external_id}
								report={reportDetails.report}
								card={card}
								pdfMode
							/>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col gap-8">
					{cards.map((card) => (
						<div
							key={card.external_id}
							className="scroll-m-5"
							id={card.external_id}
						>
							<QueryCard report={reportDetails.report} card={card} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
