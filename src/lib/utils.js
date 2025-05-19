import { clsx } from 'clsx';
import Cookies from 'js-cookie';
import capitalize from 'lodash.capitalize';
import { twMerge } from 'tailwind-merge';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import pdfIcon from '@/assets/icons/pdf_icon.svg';
import { pdfjs } from 'react-pdf';
import { supportedChartTypes } from '@/config/supported-graph-types';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export const formatFileSize = (size) => {
	if (size < 1024) {
		return size + ' B';
	} else if (size < 1024 * 1024) {
		return (size / 1024).toFixed(2) + ' KB';
	} else if (size < 1024 * 1024 * 1024) {
		return (size / (1024 * 1024)).toFixed(2) + ' MB';
	} else {
		return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}
};

export const tokenCookie = '';

export const getToken = () => {
	const token = Cookies.get('id_token');
	return token ? token : tokenCookie;
};

export const getInitials = (user_name) => {
	if (!user_name) return;
	const words = user_name.split(' ');

	const initials = words.map((word) => word.charAt(0).toUpperCase());

	const abbreviation = initials.join('');

	return abbreviation;
};

export function toTitleCase(str) {
	if (!str) return str;
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}
export const getShortHandName = (fullName) => {
	if (fullName?.length > 0) {
		const splits = fullName.split(' ');
		const firstLetter = splits[0].charAt(0);
		const lastLetter = splits[splits.length - 1][0];
		return capitalize(firstLetter + lastLetter);
	} else return '--';
};

export const capitalizeFirstLetterFullText = (text) => {
	if (!text) return;
	return text
		.split(' ')
		.map((sentence) => capitalize(sentence))
		.join(' ');
};

export const chatCommandInitiator = (str) => {
	const regex = /^\/$/;
	return regex.test(str);
};

export const getFileIcon = (fileName) => {
	if (!fileName) return;
	const fileExtension = fileName.split('.').pop();
	switch (fileExtension) {
		case 'csv':
			return csvIcon;
		case 'xls':
		case 'xlsx':
		case 'xlxb':
			return xlsIcon;
		case 'pdf':
			return pdfIcon;
		default:
			return xlsIcon;
	}
};

export const getPdfPageCount = async (url) => {
	try {
		const pdf = await pdfjs.getDocument(url).promise;
		return pdf.numPages;
	} catch (error) {
		console.error('Error fetching PDF page count:', error);
		return 0; // Fallback in case of an error
	}
};

export const downloadCsvWithCustomName = async ({
	csvUrl,
	reportName,
	queryTitle,
	queryId,
}) => {
	try {
		const response = await fetch(csvUrl);
		const blob = await response.blob();

		const truncatedTitle = queryTitle.replace(/\s+/g, '_').slice(0, 20);

		const filename = `${reportName}_${truncatedTitle}_${queryId}.csv`;

		const blobUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = blobUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(blobUrl);
	} catch (err) {
		console.error('CSV download failed:', err);
	}
};

export const getSupportedGraphs = (graphList = []) => {
	if (!graphList.length) return [];
	const supportedTypesLower = new Set(supportedChartTypes.map(type => type.toLowerCase()));
	return graphList.filter((item) => {
		const itemType = item.type?.toLowerCase() || '';
		return supportedTypesLower.has(itemType);
	});
};

export const getChartType = (graph) => {
 if(!graph && !graph?.type)return;
 return graph.type.includes('polarArea') ? "polarArea": graph.type.toLowerCase()
}
