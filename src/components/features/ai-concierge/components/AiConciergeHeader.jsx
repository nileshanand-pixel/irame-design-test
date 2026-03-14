import Tag from '@/components/elements/Tag';

const AiConciergeHeader = () => {
	return (
		<header className="max-w-full flex-none mb-6">
			<div className="flex items-center gap-3">
				<h1 className="text-2xl font-semibold text-primary80">
					AI Concierge
				</h1>
				<Tag
					text="Beta"
					className="shrink-0 !px-2 !py-0.5 !gap-1 !shadow-none"
					textClassName="!text-xs !font-semibold"
				/>
			</div>
			<p className="text-primary40 text-sm mt-1">
				AI-powered tools for auditing, compliance, and data analysis
			</p>
		</header>
	);
};

export default AiConciergeHeader;
