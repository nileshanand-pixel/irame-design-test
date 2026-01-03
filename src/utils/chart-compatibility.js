// Chart.js-friendly grouping (by compatible data shape)
const CHART_TYPE_GROUPS = {
	// Category/linear (labels[] + datasets[].data = number[])
	CARTESIAN_SERIES: ['line', 'bar'],

	// Circular / radial "slices" (labels[] + datasets[].data = number[])
	// polarArea behaves much closer to pie/doughnut than to radar
	CIRCULAR_SLICES: ['pie', 'doughnut', 'polararea'],

	// X/Y points on cartesian scales (datasets[].data = {x,y} or {x,y,r})
	CARTESIAN_POINTS: ['scatter'], // bubble needs r

	CARTESIAN_POINTS2: ['bubble'],

	// Radial linear scale with axes per label (labels[] + datasets[].data = number[])
	RADIAL_AXES: ['radar'], // radar is its own "safe" bucket
};

/**
 *  supported chart types in the dropdown
 */
export const DROPDOWN_CHART_TYPES = [
	'line',
	'bar',
	'pie',
	'doughnut',
	'polararea',
	'scatter',
	'bubble',
	'radar',
];

/**
 * Converts internal lowercase chart type to Chart.js format
 * Chart.js requires specific casing for some chart types
 *
 * @param {string} chartType - Internal chart type (lowercase)
 * @returns {string} Chart.js compatible chart type
 */
export const toChartJsType = (chartType) => {
	if (!chartType) return 'line';

	const normalized = chartType.toLowerCase().trim();

	// Chart.js requires camelCase for polarArea
	if (normalized === 'polararea') {
		return 'polarArea';
	}

	// All other types use lowercase
	return normalized;
};

/**
 * @param {string} chartType - Chart type from API/dashboard
 * @returns {string} Normalized chart type for dropdown
 */
export const normalizeChartTypeForDropdown = (chartType) => {
	if (!chartType) return 'line';

	const normalizedType = chartType.toLowerCase().trim();

	// If type is already in dropdown, return as is
	if (DROPDOWN_CHART_TYPES.includes(normalizedType)) {
		return normalizedType;
	}

	// Map non-dropdown types to their closest dropdown equivalent
	const typeMapping = {
		// Legacy support for area
		area: 'line',
	};

	return typeMapping[normalizedType] || 'line';
};

/**
 * Checks if two chart types are compatible for conversion
 *
 * @param {string} fromType - Original chart type
 * @param {string} toType - Target chart type
 * @returns {boolean} True if conversion is allowed
 */
export const isChartTypeCompatible = (fromType, toType) => {
	if (!fromType || !toType) return false;

	const normalizedFrom = fromType.toLowerCase().trim();
	const normalizedTo = toType.toLowerCase().trim();

	// Same type is always compatible
	if (normalizedFrom === normalizedTo) return true;

	// Find which groups the types belong to
	const fromGroup = findChartTypeGroup(normalizedFrom);
	const toGroup = findChartTypeGroup(normalizedTo);

	// Types must be in the same group to be compatible
	if (fromGroup && toGroup && fromGroup === toGroup) {
		return true;
	}

	return false;
};

/**
 * Finds which group a chart type belongs to
 *
 * @param {string} chartType - Chart type to check
 * @returns {string|null} Group name or null if not found
 */
const findChartTypeGroup = (chartType) => {
	for (const [groupName, types] of Object.entries(CHART_TYPE_GROUPS)) {
		if (types.includes(chartType)) {
			return groupName;
		}
	}
	return null;
};

/**
 * Gets all compatible chart types for a given chart type
 *
 * @param {string} chartType - Original chart type
 * @returns {string[]} Array of compatible chart types (only dropdown types)
 */
export const getCompatibleChartTypes = (chartType) => {
	if (!chartType) return DROPDOWN_CHART_TYPES;

	const normalizedType = chartType.toLowerCase().trim();
	const group = findChartTypeGroup(normalizedType);

	// If type is not in any group, return empty array (no conversions allowed)
	if (!group) {
		return [];
	}

	// Get all types from the same group
	const groupTypes = CHART_TYPE_GROUPS[group];

	// Filter to only include types that are in the dropdown
	const compatibleTypes = groupTypes.filter((type) =>
		DROPDOWN_CHART_TYPES.includes(type),
	);

	return compatibleTypes;
};

/**
 * Gets user-friendly error message for incompatible conversion
 *
 * @param {string} fromType - Original chart type
 * @param {string} toType - Target chart type
 * @returns {string} Error message
 */
export const getIncompatibleConversionMessage = (fromType, toType) => {
	const fromLabel = getChartTypeLabel(fromType);
	const toLabel = getChartTypeLabel(toType);

	const fromGroup = findChartTypeGroup(fromType?.toLowerCase());
	const toGroup = findChartTypeGroup(toType?.toLowerCase());

	// Provide specific messages based on group incompatibility
	if (fromGroup === 'CARTESIAN_SERIES' && toGroup === 'CIRCULAR_SLICES') {
		return `Cannot convert ${fromLabel} to ${toLabel}. Cartesian charts (line, bar) use different data structures than circular charts (pie, doughnut).`;
	}

	if (fromGroup === 'CIRCULAR_SLICES' && toGroup === 'CARTESIAN_SERIES') {
		return `Cannot convert ${fromLabel} to ${toLabel}. Circular charts (pie, doughnut) use different data structures than cartesian charts (line, bar).`;
	}

	if (fromGroup === 'CARTESIAN_POINTS' || toGroup === 'CARTESIAN_POINTS') {
		return `Cannot convert ${fromLabel} to ${toLabel}. Scatter and bubble charts use point-based data (x, y coordinates) which is incompatible with other chart types.`;
	}

	if (fromGroup === 'RADIAL_AXES' || toGroup === 'RADIAL_AXES') {
		return `Cannot convert ${fromLabel} to ${toLabel}. Radar charts use a unique radial axis structure that is incompatible with other chart types.`;
	}

	return `Cannot convert ${fromLabel} to ${toLabel}. These chart types use incompatible data structures.`;
};

/**
 * Gets user-friendly label for chart type
 *
 * @param {string} chartType - Chart type
 * @returns {string} Human-readable label
 */
const getChartTypeLabel = (chartType) => {
	if (!chartType) return 'Unknown';

	const typeLabels = {
		line: 'Line',
		bar: 'Bar',
		area: 'Area',
		pie: 'Pie',
		doughnut: 'Doughnut',
		polararea: 'Polar Area',
		scatter: 'Scatter',
		bubble: 'Bubble',
		radar: 'Radar',
	};

	return typeLabels[chartType.toLowerCase()] || chartType;
};
