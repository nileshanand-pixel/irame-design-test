import teamsEmpty from '@/assets/icons/teams-empty.svg';
import CreateTeamCta from './create-team-cta';

const EMPTY_STATE_CONFIG = {
	image: teamsEmpty,
	heading: 'Build Your Dream Team',
	descriptionLines: [
		'Collaborate with colleagues, assign roles, and streamline',
		'workflows by creating your first team.',
	],
	cta: CreateTeamCta,
};

export default function EmptyState() {
	return (
		<div className="w-full h-full flex flex-col justify-center gap-4 text-center border border-[#0000001A] rounded-xl shadow-sm">
			<div className="flex justify-center">
				<img
					src={EMPTY_STATE_CONFIG?.image}
					className="w-[21.375rem] h-[18.75rem]"
				/>
			</div>
			<div className="flex flex-col gap-2">
				<div className="text-[#26064A] text-xl font-semibold">
					{EMPTY_STATE_CONFIG.heading}
				</div>
				<div className="text-[#26064ACC]">
					{EMPTY_STATE_CONFIG.descriptionLines?.map((line) => {
						return <div key={line}>{line}</div>;
					})}
				</div>
			</div>

			{EMPTY_STATE_CONFIG?.cta && <EMPTY_STATE_CONFIG.cta />}
		</div>
	);
}
