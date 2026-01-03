import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * ChartBrushOverlay - Custom brush overlay for drag-to-select zoom functionality
 *
 * @param {Object} props
 * @param {Object} props.chart - Chart.js instance reference
 * @param {Function} props.onSelectionComplete - Callback when selection is complete (receives { startX, endX })
 * @param {boolean} props.enabled - Whether brush is enabled
 * @param {string} props.className - Additional CSS classes
 */
const ChartBrushOverlay = ({
	chart,
	onSelectionComplete,
	enabled = true,
	className = '',
}) => {
	const overlayRef = useRef(null);
	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionStart, setSelectionStart] = useState(null);
	const [selectionEnd, setSelectionEnd] = useState(null);
	const [showTooltip, setShowTooltip] = useState(true);

	useEffect(() => {
		if (isSelecting) {
			setShowTooltip(false);
		}
	}, [isSelecting]);

	// Get chart area bounds
	const getChartAreaBounds = useCallback(() => {
		if (!chart || !overlayRef.current) return null;

		const chartArea = chart.chartArea;
		if (!chartArea) return null;

		const overlayRect = overlayRef.current.getBoundingClientRect();

		return {
			left: chartArea.left,
			top: chartArea.top,
			right: chartArea.right,
			bottom: chartArea.bottom,
			width: chartArea.right - chartArea.left,
			height: chartArea.bottom - chartArea.top,
		};
	}, [chart]);

	// Handle mouse down - start selection
	const handleMouseDown = useCallback(
		(e) => {
			if (!enabled || !chart) return;

			const bounds = getChartAreaBounds();
			if (!bounds) return;

			const rect = overlayRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Check if click is within chart area
			if (
				x < bounds.left ||
				x > bounds.right ||
				y < bounds.top ||
				y > bounds.bottom
			) {
				return;
			}

			setIsSelecting(true);
			setSelectionStart({ x, y });
			setSelectionEnd({ x, y });
			setShowTooltip(false);
		},
		[enabled, chart, getChartAreaBounds],
	);

	// Handle mouse move - update selection
	const handleMouseMove = useCallback(
		(e) => {
			if (!isSelecting || !overlayRef.current) return;

			const rect = overlayRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const bounds = getChartAreaBounds();
			if (!bounds) return;

			const constrainedX = Math.max(bounds.left, Math.min(bounds.right, x));
			const constrainedY = Math.max(bounds.top, Math.min(bounds.bottom, y));

			setSelectionEnd({ x: constrainedX, y: constrainedY });
		},
		[isSelecting, getChartAreaBounds],
	);

	// Handle mouse up - complete selection
	const handleMouseUp = useCallback(() => {
		if (!isSelecting || !selectionStart || !selectionEnd) {
			setIsSelecting(false);
			setSelectionStart(null);
			setSelectionEnd(null);
			return;
		}

		const bounds = getChartAreaBounds();
		if (!bounds) {
			setIsSelecting(false);
			setSelectionStart(null);
			setSelectionEnd(null);
			return;
		}

		// Calculate selection range (only X-axis)
		const startX = Math.min(selectionStart.x, selectionEnd.x);
		const endX = Math.max(selectionStart.x, selectionEnd.x);

		// Only proceed if there's a meaningful selection (at least 5px)
		if (Math.abs(endX - startX) < 5) {
			setIsSelecting(false);
			setSelectionStart(null);
			setSelectionEnd(null);
			return;
		}

		// Call completion callback
		if (onSelectionComplete) {
			onSelectionComplete({
				startX: startX - bounds.left,
				endX: endX - bounds.left,
				bounds,
			});
		}

		setIsSelecting(false);
		setSelectionStart(null);
		setSelectionEnd(null);
	}, [
		isSelecting,
		selectionStart,
		selectionEnd,
		onSelectionComplete,
		getChartAreaBounds,
	]);

	// Handle mouse leave - cancel selection if dragging
	const handleMouseLeave = useCallback(() => {
		if (isSelecting) {
			setIsSelecting(false);
			setSelectionStart(null);
			setSelectionEnd(null);
		}
	}, [isSelecting]);

	// Calculate selection rectangle style
	const getSelectionStyle = () => {
		if (!isSelecting || !selectionStart || !selectionEnd) return null;

		const bounds = getChartAreaBounds();
		if (!bounds) return null;

		const startX = Math.min(selectionStart.x, selectionEnd.x);
		const endX = Math.max(selectionStart.x, selectionEnd.x);

		return {
			left: `${startX}px`,
			top: `${bounds.top}px`,
			width: `${endX - startX}px`,
			height: `${bounds.height}px`,
		};
	};

	if (!enabled) return null;

	return (
		<>
			<div
				ref={overlayRef}
				className={cn('absolute inset-0 cursor-crosshair z-10', className)}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				style={{ pointerEvents: enabled ? 'auto' : 'none' }}
			>
				{/* Selection Rectangle */}
				{isSelecting && selectionStart && selectionEnd && (
					<div
						className="absolute border-2 border-[#6A12CD] pointer-events-none"
						style={{
							...getSelectionStyle(),
							backgroundColor: 'rgba(243, 237, 251, 0.5)',
						}}
					/>
				)}

				{/* Tooltip badge for first-time users */}
				{showTooltip && !isSelecting && (
					<div
						className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
						style={{
							animation: 'fadeIn 0.3s ease-in',
						}}
					>
						<div className="bg-white border-2 border-[#6A12CD] rounded-full px-2.5 py-1 shadow-lg flex items-center gap-2">
							<span className="text-[#6A12CD] text-xs font-medium">
								Drag to select area and zoom
							</span>
							<button
								onClick={(e) => {
									e.stopPropagation();
									setShowTooltip(false);
								}}
								className="text-[#6A12CD] hover:text-[#5a0fb8] hover:bg-purple-50 rounded-full w-5 h-5 flex items-center justify-center transition-colors pointer-events-auto"
								title="Dismiss"
							>
								<i className="bi-x text-base font-bold"></i>
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default ChartBrushOverlay;
