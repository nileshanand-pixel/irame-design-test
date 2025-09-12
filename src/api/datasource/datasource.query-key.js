export const getDatasourceDetailsQueryKey = (id, version) => {
	return ['data-source-details' + (version === 'v2' ? 'v2' : ''), id];
};
