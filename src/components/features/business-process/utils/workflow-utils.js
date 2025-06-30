/**
 * Main entry point – evaluates both user and ira mappings
 *
 * @param {Object} mappingRoot - Contains file_mapping_user and file_mapping_ira
 * @returns {{
 *   user: {
 *     filesMapped: boolean,
 *     columnsMapped: boolean,
 *     noFileMapping: boolean,
 *     noColumnMapping: boolean
 *   },
 *   ira: {
 *     filesMapped: boolean,
 *     columnsMapped: boolean,
 *     anyFileError: boolean,
 *     anyColumnError: boolean
 *   }
 * }}
 */
export const evaluateMappingRoot = ({
	file_mapping_user = null,
	file_mapping_ira = null,
}) => {
	return {
		user: evaluateSingleMapping(file_mapping_user, 'user'),
		ira: evaluateSingleMapping(file_mapping_ira, 'ira'),
	};
};

/**
 * Evaluates either user or ira mapping block
 *
 * @param {Object|null} block - file_mapping_user or file_mapping_ira
 * @param {'user'|'ira'} mode
 * @returns {Object}
 */
function evaluateSingleMapping(block, mode) {
	const isObjEmpty = (obj) => !obj || Object.keys(obj).length === 0;
	const csvBuckets = block?.csv_files ?? {};

	if (mode === 'user') {
		const res = {
			filesMapped: false,
			columnsMapped: false,
			noFileMapping: true,
			noColumnMapping: true,
		};

		if (!block || isObjEmpty(csvBuckets)) return res;

		res.noFileMapping = false;

		let allFilesHaveId = true;
		let allFilesHaveColumns = true;
		let everyColHasName = true;
		let anyColumnsPresent = false;

		Object.values(csvBuckets).forEach((fileArr) => {
			if (!fileArr.length) {
				allFilesHaveId = false;
				allFilesHaveColumns = false;
				return;
			}

			fileArr.forEach((file) => {
				if (!file?.file_id) allFilesHaveId = false;

				const cols = file.columns;
				if (cols == null) {
					allFilesHaveColumns = false;
					return;
				}

				anyColumnsPresent = true;
				cols.forEach((c) => {
					if (!c?.column_name) everyColHasName = false;
				});
			});
		});

		res.filesMapped = allFilesHaveId;
		res.columnsMapped = allFilesHaveColumns && everyColHasName;
		res.noColumnMapping = !anyColumnsPresent;

		return res;
	}

	if (mode === 'ira') {
		const res = {
			filesMapped: false,
			columnsMapped: false,
			anyFileError: false,
			anyColumnError: false,
		};

		if (!block || isObjEmpty(csvBuckets)) return res;

		let allFilesValid = true;
		let allColumnsMapped = true;

		Object.values(csvBuckets).forEach((fileArr) => {
			if (!fileArr.length) {
				allFilesValid = false;
				allColumnsMapped = false;
				return;
			}

			fileArr.forEach((file) => {
				if (file.file_validation_failure_message) {
					res.anyFileError = true;
					allFilesValid = false;
				}
				if (!file?.file_id) {
					allFilesValid = false;
				}

				const cols = file.columns;
				if (cols == null) {
					allColumnsMapped = false;
					return;
				}

				cols.forEach((c) => {
					if (c?.status !== 'mapped') {
						res.anyColumnError = true;
						allColumnsMapped = false;
					}
					if (c?.message) {
						res.anyColumnError = true;
					}
				});
			});
		});

		res.filesMapped = allFilesValid;
		res.columnsMapped = allColumnsMapped;

		return res;
	}

	throw new Error('Invalid mode');
}
