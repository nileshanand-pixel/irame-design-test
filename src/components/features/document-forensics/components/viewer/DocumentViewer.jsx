import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const DocumentViewer = ({ fileUrl, fileName, suspiciousRegions }) => {
	const [showOverlays, setShowOverlays] = useState(true);
	const [hoveredRegion, setHoveredRegion] = useState(null);

	const isPdf = fileName?.toLowerCase().endsWith('.pdf');

	if (!fileUrl) return null;

	return (
		<div className="border rounded-xl p-4 bg-white">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-primary80">
					Document Viewer
				</h3>
				<div className="flex items-center gap-3">
					{suspiciousRegions?.length > 0 && (
						<button
							onClick={() => setShowOverlays(!showOverlays)}
							className="flex items-center gap-1.5 text-xs text-primary60 hover:text-primary80 transition-colors"
						>
							{showOverlays ? (
								<EyeOff className="w-3.5 h-3.5" />
							) : (
								<Eye className="w-3.5 h-3.5" />
							)}
							{showOverlays ? 'Hide overlays' : 'Show overlays'}
						</button>
					)}
				</div>
			</div>

			<div className="flex gap-4">
				{/* Image / PDF display */}
				<div className="flex-1 relative bg-gray-50 rounded-lg overflow-hidden">
					{isPdf ? (
						<iframe
							src={fileUrl}
							title={fileName}
							className="w-full h-[500px] border-0"
						/>
					) : (
						<div className="relative">
							<img
								src={fileUrl}
								alt={fileName}
								className="w-full h-auto max-h-[500px] object-contain"
							/>
							{/* Suspicious Region Overlays */}
							{showOverlays &&
								suspiciousRegions?.map((region, i) => (
									<div
										key={i}
										className={`absolute border-2 transition-all cursor-pointer ${
											hoveredRegion === i
												? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30'
												: 'border-red-400/70 bg-red-400/10'
										}`}
										style={{
											left: `${region.x}%`,
											top: `${region.y}%`,
											width: `${region.width}%`,
											height: `${region.height}%`,
										}}
										onMouseEnter={() => setHoveredRegion(i)}
										onMouseLeave={() => setHoveredRegion(null)}
									>
										{hoveredRegion === i && region.label && (
											<div className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap font-medium">
												{region.label}
											</div>
										)}
										{/* Corner markers */}
										<div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-red-500" />
										<div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-red-500" />
										<div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-red-500" />
										<div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-red-500" />
									</div>
								))}
						</div>
					)}
				</div>

				{/* Findings Sidebar */}
				{suspiciousRegions?.length > 0 && (
					<div className="w-64 shrink-0">
						<h4 className="text-xs font-semibold text-primary60 mb-2">
							Suspicious Regions ({suspiciousRegions.length})
						</h4>
						<div className="space-y-2 max-h-[460px] overflow-y-auto">
							{suspiciousRegions.map((region, i) => (
								<div
									key={i}
									className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
										hoveredRegion === i
											? 'border-red-300 bg-red-50'
											: 'border-gray-200 bg-white hover:border-gray-300'
									}`}
									onMouseEnter={() => setHoveredRegion(i)}
									onMouseLeave={() => setHoveredRegion(null)}
								>
									<p className="font-medium text-primary80">
										{region.label || `Region ${i + 1}`}
									</p>
									{region.page != null && (
										<p className="text-primary40 mt-0.5">
											Page {region.page}
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DocumentViewer;
