import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/hooks/useRouter';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { ArrowUpRight } from 'lucide-react';

const SummaryTab = ({ summary, query, title, sessionId, datasourceId }) => {
	const { navigate } = useRouter();

	const safeHTML = useMemo(() => {
		if (summary?.text) {
			return DOMPurify.sanitize(summary.text);
		}
		return '';
	}, [summary?.text]);

	const handleAskIRA = () => {
		if (!sessionId) return;

		const url = `/app/new-chat/session?sessionId=${sessionId}&source=dashboard${
			datasourceId ? `&datasource_id=${datasourceId}` : ''
		}`;
		navigate(url);
	};

	// Parse summary to extract Answer and Observations as bullet points
	const parseSummary = useMemo(() => {
		if (!safeHTML && !summary?.text) {
			return { query: null, answer: [], observations: [] };
		}

		// Convert HTML to plain text for parsing
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = safeHTML || summary?.text || '';
		const text = tempDiv.textContent || tempDiv.innerText || summary?.text || '';

		const answerMatch = text.match(
			/(?:Answer|Findings):?\s*(.+?)(?=(?:Observations|Impact\s*&\s*Recommendations):|$)/is,
		);
		let answerText = answerMatch ? answerMatch[1].trim() : '';

		// Split into bullet points - handle various formats including nested bullets
		let answerBullets = [];
		if (answerText) {
			// Remove HTML bold tags and clean up
			let cleanText = answerText
				.replace(/<b>/gi, '')
				.replace(/<\/b>/gi, '')
				.replace(/&amp;/g, '&')
				.replace(/&nbsp;/g, ' ')
				.replace(/<[^>]+>/g, ''); // Remove any remaining HTML tags

			// Extract top-level bullets by processing line by line
			const lines = cleanText.split(/\n/);

			let currentBullet = '';
			const extractedBullets = [];

			for (let i = 0; i < lines.length; i++) {
				const originalLine = lines[i];
				const line = originalLine.trim();
				if (!line) continue;

				// Check if this is a top-level bullet (starts with "- " and not indented with 2+ spaces)
				const isTopLevel =
					/^-\s+/.test(line) ||
					(/^\s*-\s+/.test(originalLine) &&
						!/^\s{2,}-\s+/.test(originalLine));

				if (isTopLevel) {
					// Save previous bullet if exists
					if (currentBullet) {
						extractedBullets.push(currentBullet.trim());
					}
					// Start new bullet (remove the "- " prefix)
					currentBullet = line.replace(/^-\s+/, '').trim();
				} else if (currentBullet && /^\s{2,}/.test(originalLine)) {
					// This is a nested bullet - skip it, we only want top-level
					continue;
				} else if (currentBullet) {
					// Continue current bullet (might be continuation of text)
					currentBullet += ' ' + line;
				} else {
					// No current bullet, start one
					currentBullet = line;
				}
			}

			// Add last bullet
			if (currentBullet) {
				extractedBullets.push(currentBullet.trim());
			}

			if (extractedBullets.length > 0) {
				answerBullets = extractedBullets.filter(
					(bullet) => bullet.length > 0,
				);
			} else {
				// Fallback: split by newlines if no bullets found
				const fallbackLines = cleanText
					.split(/\n+/)
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				if (fallbackLines.length > 1) {
					answerBullets = fallbackLines;
				} else {
					// Single paragraph - split by sentences if long
					const cleanSingle = cleanText.trim();
					if (cleanSingle.length > 200) {
						answerBullets = cleanSingle
							.split(/[.!?]+/)
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
					} else {
						answerBullets = [cleanSingle];
					}
				}
			}
		}

		const observationsMatch = text.match(
			/(?:Observations|Impact\s*&\s*Recommendations):?\s*(.+?)$/is,
		);
		let observationsText = observationsMatch ? observationsMatch[1].trim() : '';

		let observationsBullets = [];
		if (observationsText) {
			// Remove HTML bold tags and clean up
			let cleanText = observationsText
				.replace(/<b>/gi, '')
				.replace(/<\/b>/gi, '')
				.replace(/&amp;/g, '&')
				.replace(/&nbsp;/g, ' ')
				.replace(/<[^>]+>/g, '');

			// Extract top-level bullets by processing line by line
			const lines = cleanText.split(/\n/);

			let currentBullet = '';
			const extractedBullets = [];

			for (let i = 0; i < lines.length; i++) {
				const originalLine = lines[i];
				const line = originalLine.trim();
				if (!line) continue;

				// Check if this is a top-level bullet (starts with "- " and not indented with 2+ spaces)
				const isTopLevel =
					/^-\s+/.test(line) ||
					(/^\s*-\s+/.test(originalLine) &&
						!/^\s{2,}-\s+/.test(originalLine));

				if (isTopLevel) {
					// Save previous bullet if exists
					if (currentBullet) {
						extractedBullets.push(currentBullet.trim());
					}
					// Start new bullet (remove the "- " prefix)
					currentBullet = line.replace(/^-\s+/, '').trim();
				} else if (currentBullet && /^\s{2,}/.test(originalLine)) {
					// This is a nested bullet - skip it, we only want top-level
					continue;
				} else if (currentBullet) {
					// Continue current bullet (might be continuation of text)
					currentBullet += ' ' + line;
				} else {
					// No current bullet, start one
					currentBullet = line;
				}
			}

			// Add last bullet
			if (currentBullet) {
				extractedBullets.push(currentBullet.trim());
			}

			if (extractedBullets.length > 0) {
				observationsBullets = extractedBullets.filter(
					(bullet) => bullet.length > 0,
				);
			} else {
				// Fallback: split by newlines if no bullets found
				const fallbackLines = cleanText
					.split(/\n+/)
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				if (fallbackLines.length > 1) {
					observationsBullets = fallbackLines;
				} else {
					// Single paragraph - split by sentences if long
					const cleanSingle = cleanText.trim();
					if (cleanSingle.length > 200) {
						observationsBullets = cleanSingle
							.split(/[.!?]+/)
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
					} else {
						observationsBullets = [cleanSingle];
					}
				}
			}
		}

		return {
			query: query || null,
			answer: answerBullets,
			observations: observationsBullets,
		};
	}, [safeHTML, summary?.text, query]);

	return (
		<div className="w-full h-full flex flex-col">
			{/* Header Section */}
			<div className="px-6 py-3 border-b border-[#F3F4F6]">
				<div className="flex  items-center justify-between">
					<div>
						<h2 className="text-xl font-medium text-primary100">
							{title || 'Summary'}
						</h2>
					</div>
					{sessionId && (
						<Button
							onClick={handleAskIRA}
							className="text-sm font-medium flex items-center gap-1"
						>
							<span>Ask IRA</span>
							<ArrowUpRight className="text-white size-5" />
						</Button>
					)}
				</div>
			</div>

			{/* Main Summary Container with Background Layout */}
			<div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
				<div className="flex flex-col items-start h-full rounded-2xl p-6 gap-6 border border-[#F3E8FF] bg-gradient-to-br from-[#FAF5FF] to-white shadow-sm overflow-y-auto custom-scrollbar">
					{/* Content Sections */}
					<div className="w-full space-y-6">
						{/* Query Section */}
						{parseSummary.query && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-1 rounded-full h-5 bg-[linear-gradient(180deg,#6A12CD_0%,#C27AFF_100%)]"></div>
									<p className="text-primary100 text-base leading-6 font-semibold">
										Query
									</p>
								</div>
								<div className="pl-4 space-y-2">
									<p className="text-primary100 text-sm font-normal">
										{parseSummary.query}
									</p>
								</div>
							</div>
						)}

						{/* Answer Section */}
						{parseSummary.answer && parseSummary.answer.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="w-1 rounded-full h-5 bg-[linear-gradient(180deg,#6A12CD_0%,#C27AFF_100%)]"></div>
									<p className="text-primary100 text-base font-semibold">
										Answer
									</p>
								</div>
								<div className="pl-4 space-y-2">
									{parseSummary.answer.map((bullet, index) => (
										<div
											key={index}
											className="flex items-start gap-3"
										>
											<div className="w-2 h-2 bg-[#6A12CD] rounded-full flex-shrink-0 mt-1.5"></div>
											<p className="text-primary100 text-sm leading-6 flex-1">
												{bullet}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Observations Section */}
						{parseSummary.observations &&
							parseSummary.observations.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<div className="w-1 h-5 rounded-full bg-[linear-gradient(180deg,#6A12CD_0%,#C27AFF_100%)]"></div>
										<p className="text-primary80 text-base font-semibold">
											Observations
										</p>
									</div>
									<div className="pl-4 space-y-2">
										{parseSummary.observations.map(
											(bullet, index) => (
												<div
													key={index}
													className="flex items-start gap-3"
												>
													<div className="w-2 h-2 bg-[#6A12CD] rounded-full flex-shrink-0 mt-1.5"></div>
													<p className="text-primary100 text-sm leading-6 flex-1">
														{bullet}
													</p>
												</div>
											),
										)}
									</div>
								</div>
							)}

						{/* Fallback: Render raw summary if structured parsing didn't work */}
						{!parseSummary.answer?.length &&
							!parseSummary.observations?.length &&
							safeHTML && (
								<div
									className="text-primary80 font-normal leading-6"
									style={{
										whiteSpace: 'break-spaces',
									}}
									dangerouslySetInnerHTML={{
										__html: safeHTML,
									}}
								/>
							)}

						{/* Empty State */}
						{!safeHTML && !summary?.text && !parseSummary.query && (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-primary60 font-normal mb-4">
									No summary available
								</p>
								{sessionId && (
									<Button
										onClick={handleAskIRA}
										className="bg-[#6A12CD] hover:bg-[#6912CC] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
									>
										<span>Ask IRA</span>
										<FaArrowUpRightFromSquare className="w-3 h-3" />
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SummaryTab;
