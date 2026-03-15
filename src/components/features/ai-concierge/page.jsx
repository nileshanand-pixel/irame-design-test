import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import AiConciergeHeader from './components/AiConciergeHeader';
import AiConciergeTile from './components/AiConciergeTile';
import { AI_FEATURES } from './constants/ai-concierge.constants';

/* Isometric cube SVG — a single 3D box as inline data URI */
const cubeSvg = (filled = false) => {
	const fill = filled ? "fill='%236A12CD' fill-opacity='0.25'" : "fill='none'";
	return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cg ${fill} stroke='%236A12CD' stroke-width='1.2'%3E%3Cpath d='M30 2 L56 15 L56 39 L30 52 L4 39 L4 15 Z'/%3E%3Cpath d='M30 2 L30 28 M56 15 L30 28 M4 15 L30 28' stroke-opacity='0.8'/%3E%3Cpath d='M30 28 L30 52' stroke-opacity='0.6'/%3E%3C/g%3E%3C/svg%3E")`;
};

/* Each cube is positioned absolutely with random placement and rotation */
const SCATTERED_CUBES = [
	// ── Row 1: 0-8% ──
	{ top: '0%', left: '1%', size: 54, rotate: 15, opacity: 0.12, filled: false },
	{ top: '3%', left: '10%', size: 28, rotate: -48, opacity: 0.1, filled: true },
	{ top: '1%', left: '22%', size: 36, rotate: 33, opacity: 0.09, filled: false },
	{ top: '5%', left: '35%', size: 22, rotate: -62, opacity: 0.1, filled: true },
	{ top: '2%', left: '47%', size: 42, rotate: 8, opacity: 0.11, filled: false },
	{ top: '6%', left: '58%', size: 26, rotate: -38, opacity: 0.09, filled: true },
	{ top: '1%', left: '70%', size: 34, rotate: 52, opacity: 0.1, filled: false },
	{ top: '4%', left: '82%', size: 30, rotate: -22, opacity: 0.11, filled: true },
	{ top: '2%', left: '93%', size: 48, rotate: 28, opacity: 0.12, filled: false },
	// ── Row 2: 10-18% ──
	{ top: '10%', left: '4%', size: 32, rotate: -55, opacity: 0.1, filled: true },
	{ top: '13%', left: '16%', size: 44, rotate: 40, opacity: 0.09, filled: false },
	{ top: '11%', left: '28%', size: 24, rotate: -15, opacity: 0.1, filled: true },
	{ top: '15%', left: '40%', size: 38, rotate: 65, opacity: 0.08, filled: false },
	{ top: '12%', left: '53%', size: 28, rotate: -42, opacity: 0.11, filled: true },
	{ top: '16%', left: '66%', size: 34, rotate: 18, opacity: 0.09, filled: false },
	{ top: '10%', left: '78%', size: 26, rotate: -70, opacity: 0.1, filled: true },
	{ top: '14%', left: '90%', size: 40, rotate: 35, opacity: 0.11, filled: false },
	// ── Row 3: 22-30% ──
	{ top: '22%', left: '2%', size: 40, rotate: 25, opacity: 0.11, filled: false },
	{ top: '26%', left: '13%', size: 26, rotate: -58, opacity: 0.09, filled: true },
	{ top: '23%', left: '25%', size: 36, rotate: 45, opacity: 0.1, filled: false },
	{ top: '28%', left: '37%', size: 30, rotate: -12, opacity: 0.11, filled: true },
	{ top: '24%', left: '50%', size: 22, rotate: 68, opacity: 0.09, filled: false },
	{ top: '27%', left: '62%', size: 42, rotate: -32, opacity: 0.1, filled: true },
	{ top: '22%', left: '74%', size: 28, rotate: 55, opacity: 0.11, filled: false },
	{ top: '25%', left: '86%', size: 34, rotate: -48, opacity: 0.09, filled: true },
	// ── Row 4: 33-42% ──
	{ top: '33%', left: '1%', size: 46, rotate: -18, opacity: 0.12, filled: false },
	{ top: '37%', left: '12%', size: 30, rotate: 62, opacity: 0.1, filled: true },
	{ top: '34%', left: '24%', size: 24, rotate: -45, opacity: 0.09, filled: false },
	{ top: '39%', left: '36%', size: 36, rotate: 28, opacity: 0.11, filled: true },
	{ top: '35%', left: '48%', size: 28, rotate: -72, opacity: 0.1, filled: false },
	{ top: '41%', left: '60%', size: 32, rotate: 15, opacity: 0.1, filled: true },
	{ top: '33%', left: '72%', size: 40, rotate: -35, opacity: 0.11, filled: false },
	{ top: '38%', left: '84%', size: 26, rotate: 50, opacity: 0.09, filled: true },
	{ top: '42%', left: '95%', size: 34, rotate: -8, opacity: 0.1, filled: false },
	// ── Row 5: 46-55% ──
	{ top: '46%', left: '3%', size: 34, rotate: 42, opacity: 0.1, filled: true },
	{ top: '50%', left: '15%', size: 44, rotate: -28, opacity: 0.11, filled: false },
	{ top: '47%', left: '27%', size: 26, rotate: 58, opacity: 0.09, filled: true },
	{ top: '52%', left: '39%', size: 32, rotate: -50, opacity: 0.1, filled: false },
	{ top: '48%', left: '51%', size: 38, rotate: 22, opacity: 0.11, filled: true },
	{ top: '53%', left: '63%', size: 24, rotate: -65, opacity: 0.09, filled: false },
	{ top: '46%', left: '75%', size: 36, rotate: 38, opacity: 0.1, filled: true },
	{ top: '51%', left: '87%', size: 30, rotate: -15, opacity: 0.11, filled: false },
	// ── Row 6: 58-66% ──
	{ top: '58%', left: '1%', size: 38, rotate: -52, opacity: 0.11, filled: false },
	{ top: '62%', left: '14%', size: 28, rotate: 35, opacity: 0.1, filled: true },
	{ top: '59%', left: '26%', size: 42, rotate: -18, opacity: 0.09, filled: false },
	{ top: '64%', left: '38%', size: 24, rotate: 72, opacity: 0.1, filled: true },
	{ top: '60%', left: '50%', size: 34, rotate: -40, opacity: 0.11, filled: false },
	{ top: '65%', left: '62%', size: 30, rotate: 12, opacity: 0.09, filled: true },
	{ top: '58%', left: '74%', size: 26, rotate: -62, opacity: 0.1, filled: false },
	{ top: '63%', left: '86%', size: 40, rotate: 45, opacity: 0.12, filled: true },
	// ── Row 7: 70-78% ──
	{ top: '70%', left: '3%', size: 42, rotate: 30, opacity: 0.1, filled: false },
	{ top: '74%', left: '16%', size: 32, rotate: -58, opacity: 0.11, filled: true },
	{ top: '71%', left: '28%', size: 26, rotate: 48, opacity: 0.09, filled: false },
	{ top: '76%', left: '40%', size: 36, rotate: -25, opacity: 0.1, filled: true },
	{ top: '72%', left: '52%', size: 30, rotate: 65, opacity: 0.1, filled: false },
	{ top: '75%', left: '64%', size: 22, rotate: -42, opacity: 0.09, filled: true },
	{ top: '70%', left: '76%', size: 44, rotate: 18, opacity: 0.11, filled: false },
	{ top: '73%', left: '88%', size: 28, rotate: -55, opacity: 0.1, filled: true },
	// ── Row 8: 82-92% ──
	{ top: '82%', left: '2%', size: 50, rotate: -22, opacity: 0.12, filled: false },
	{ top: '86%', left: '13%', size: 26, rotate: 55, opacity: 0.09, filled: true },
	{ top: '83%', left: '25%', size: 38, rotate: -38, opacity: 0.1, filled: false },
	{ top: '88%', left: '37%', size: 30, rotate: 42, opacity: 0.11, filled: true },
	{ top: '84%', left: '49%', size: 24, rotate: -68, opacity: 0.09, filled: false },
	{ top: '87%', left: '61%', size: 34, rotate: 8, opacity: 0.1, filled: true },
	{ top: '82%', left: '73%', size: 28, rotate: -48, opacity: 0.11, filled: false },
	{ top: '85%', left: '85%', size: 46, rotate: 32, opacity: 0.12, filled: true },
	{ top: '90%', left: '94%', size: 36, rotate: -15, opacity: 0.1, filled: false },
];

const ScatteredCubes = () => (
	<div className="pointer-events-none absolute inset-0 overflow-hidden">
		{SCATTERED_CUBES.map((cube, i) => (
			<div
				key={i}
				className="absolute bg-no-repeat bg-contain"
				style={{
					top: cube.top,
					left: cube.left,
					right: cube.right,
					bottom: cube.bottom,
					width: cube.size,
					height: cube.size,
					opacity: cube.opacity,
					transform: `rotate(${cube.rotate}deg)`,
					backgroundImage: cubeSvg(cube.filled),
				}}
			/>
		))}
	</div>
);

const SearchBar = ({ value, onChange }) => (
	<div className="flex items-center bg-white/60 backdrop-blur-lg border border-white/70 rounded-[52px] h-11 pl-4 pr-6 transition-all duration-300 w-[18.75rem] shadow-[0_2px_8px_rgba(106,18,205,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]">
		<i className="bi-search text-primary40 me-2"></i>
		<Input
			placeholder="Search AI tools..."
			className="border-none rounded-sm px-0 text-primary40 font-medium bg-transparent"
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

			<section className="relative max-w-full flex-1 border border-white/60 mb-4 bg-gradient-to-br from-[rgba(249,245,255,1)] via-[rgba(238,232,248,0.5)] to-[rgba(249,250,251,1)] shadow-1xl rounded-xl overflow-hidden">
				<ScatteredCubes />

				<div className="relative z-10 p-4 mt-2 flex flex-row justify-between gap-4">
					<SearchBar
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				<div className="relative z-10 px-4 py-2 mb-4 overflow-y-auto max-h-[calc(100vh-16.875rem)]">
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
