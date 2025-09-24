import { clsx } from 'clsx';
import capitalize from 'lodash.capitalize';
import { twMerge } from 'tailwind-merge';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import pdfIcon from '@/assets/icons/pdf_icon.svg';
import imageIcon from '@/assets/icons/image-icon.png';
import { pdfjs } from 'react-pdf';
import { supportedChartTypes } from '@/config/supported-graph-types';
import { logError } from './logger';

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
		case 'jpeg':
		case 'jpg':
		case 'gif':
		case 'png':
		case 'webp':
		case 'svg':
		case 'bmp':
			return imageIcon;
		default:
			return xlsIcon;
	}
};

export const getPdfPageCount = async (url) => {
	try {
		const pdf = await pdfjs.getDocument(url).promise;
		return pdf.numPages;
	} catch (error) {
		logError(error, {
			feature: 'utils',
			action: 'get_pdf_page_count',
		});
		return 0; // Fallback in case of an error
	}
};

export const base64ToBlob = (base64, mimeType) => {
	const byteCharacters = atob(base64);
	const byteArrays = [];
	for (let offset = 0; offset < byteCharacters.length; offset += 512) {
		const slice = byteCharacters.slice(offset, offset + 512);
		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}
	return new Blob(byteArrays, { type: mimeType });
};

export const getSupportedGraphs = (graphList = []) => {
	if (!graphList.length) return [];
	const supportedTypesLower = new Set(
		supportedChartTypes.map((type) => type.toLowerCase()),
	);
	return graphList.filter((item) => {
		const itemType = item.type?.toLowerCase() || '';
		return supportedTypesLower.has(itemType);
	});
};

export const getChartType = (graph) => {
	if (!graph && !graph?.type) return;
	return graph.type.includes('polarArea') ? 'polarArea' : graph.type.toLowerCase();
};
