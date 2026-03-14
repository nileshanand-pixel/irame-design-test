import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import AiConciergeHeader from './components/AiConciergeHeader';
import AiConciergeTile from './components/AiConciergeTile';
import { AI_FEATURES } from './constants/ai-concierge.constants';

const SearchBar = ({ value, onChange }) => (
	<div className="flex items-center bg-white border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300 w-[18.75rem]">
		<i className="bi-search text-primary40 me-2"></i>
		<Input
			placeholder="Search AI tools..."
			className="border-none rounded-sm px-0 text-primary40 font-medium bg-white"
			value={value}
			onChange={onChange}
		/>
	</div>
);

const AiConciergePage = () => {
	const [search, setSearch] = useState('');

	const filteredFeatures = useMemo(() => {
		if (!search) return AI_FEATURES;
		const query = search.toLowerCase();
		return AI_FEATURES.filter(
			({ name, description, tags }) =>
				name.toLowerCase().includes(query) ||
				description.toLowerCase().includes(query) ||
				tags.some((tag) => tag.toLowerCase().includes(query)),
		);
	}, [search]);

	return (
		<div className="h-full w-full flex flex-col px-8">
			<AiConciergeHeader />

			<section className="max-w-full flex-1 border-2 mb-4 border-primary8 bg-misc-offWhite shadow-1xl rounded-lg">
				<div className="p-4 mt-2 flex flex-row justify-between gap-4">
					<SearchBar
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				<div className="px-4 py-2 mb-4 overflow-y-auto max-h-[calc(100vh-16.875rem)]">
					{filteredFeatures.length > 0 ? (
						<div className="grid grid-cols-3 gap-4">
							{filteredFeatures.map((feature) => (
								<AiConciergeTile
									key={feature.id}
									feature={feature}
								/>
							))}
						</div>
					) : (
						<div className="w-full p-6 border border-primary1 rounded-s-xl rounded-e-xl">
							<p className="text-lg text-center text-primary60 font-medium">
								No matching AI tools found
							</p>
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default AiConciergePage;
