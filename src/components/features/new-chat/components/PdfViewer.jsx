import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

const PDFViewer = ({ fileUrl, isOpen, onClose, usedPages }) => {
	const [numPages, setNumPages] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [scale, setScale] = useState(1.6);
	const [showOnlyUsedPages, setShowOnlyUsedPages] = useState(false);
	const mainContentRef = useRef(null);
	const thumbnailRef = useRef(null);
	const observer = useRef(null);

	const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

	const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
	const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

	const isPageUsed = (pageNumber) => usedPages.includes(pageNumber);

	const renderPage = useCallback(
		(pageNumber) =>
			!(showOnlyUsedPages && !isPageUsed(pageNumber)) && (
				<div
					key={pageNumber}
					data-page-number={pageNumber}
					className="relative mb-4 bg-primary40 text-center"
				>
					<Page
						pageNumber={pageNumber}
						scale={scale}
						className="shadow-lg"
						renderTextLayer={false}
						renderAnnotationLayer={false}
					/>
					{isPageUsed(pageNumber) && (
						<div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-sm text-sm">
							Used Page
						</div>
					)}
				</div>
			),
		[scale, showOnlyUsedPages, usedPages],
	);

	const scrollToPage = (pageNumber) => {
		const pageElement = mainContentRef.current?.querySelector(
			`[data-page-number="${pageNumber}"]`,
		);
		const thumbnailElement = thumbnailRef.current?.querySelector(
			`[data-thumb-number="${pageNumber}"]`,
		);

		pageElement?.scrollIntoView({ behavior: 'auto', block: 'start' });
		thumbnailElement?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
		setCurrentPage(pageNumber);
	};

	useEffect(() => {
		if (mainContentRef.current) {
			const handleIntersection = (entries) => {
				const visiblePage = entries.find((entry) => entry.isIntersecting);
				if (visiblePage)
					setCurrentPage(
						Number(visiblePage.target.getAttribute('data-page-number')),
					);
			};

			const observerOptions = { root: mainContentRef.current, threshold: 0.5 };
			observer.current = new IntersectionObserver(
				handleIntersection,
				observerOptions,
			);

			const pages =
				mainContentRef.current.querySelectorAll('[data-page-number]');
			pages.forEach((page) => observer.current?.observe(page));

			return () => observer.current?.disconnect();
		}
	}, [numPages, showOnlyUsedPages]);

	useEffect(() => {
		const thumbnailElement = thumbnailRef.current?.querySelector(
			`[data-thumb-number="${currentPage}"]`,
		);
		thumbnailElement?.scrollIntoView({
			behavior: 'auto',
			block: 'nearest',
			inline: 'nearest',
		});
	}, [currentPage]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogTitle />
			<DialogContent className="max-w-7xl h-[90vh] p-6">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-8">
						<button
							onClick={handleZoomOut}
							className="p-2 hover:bg-gray-100 rounded-full"
						>
							<ZoomOut className="w-5 h-5" />
						</button>
						<span className="text-sm">{Math.round(scale * 100)}%</span>
						<button
							onClick={handleZoomIn}
							className="p-2 hover:bg-gray-100 rounded-full"
						>
							<ZoomIn className="w-5 h-5" />
						</button>
						<label className="flex items-center ml-12 gap-2">
							<input
								type="checkbox"
								checked={showOnlyUsedPages}
								onChange={(e) =>
									setShowOnlyUsedPages(e.target.checked)
								}
								className="rounded w-4 h-4 border-gray-300"
							/>
							Show only used pages
						</label>
					</div>
				</div>
				<div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
					<div
						ref={thumbnailRef}
						className="col-span-2 overflow-y-auto border-2 bg-primary40/10 py-2 px-2"
					>
						<Document
							file={fileUrl}
							onLoadSuccess={onDocumentLoadSuccess}
						>
							{numPages &&
								Array.from({ length: numPages }, (_, index) => {
									const pageNumber = index + 1;
									return !showOnlyUsedPages ||
										isPageUsed(pageNumber) ? (
										<div
											key={`thumb-${pageNumber}`}
											data-thumb-number={pageNumber}
											className={`relative mx-2 mt-2 mb-4 cursor-pointer ${
												currentPage === pageNumber
													? 'ring-2 ring-cyan-800'
													: ''
											}`}
											onClick={() => scrollToPage(pageNumber)}
										>
											<Page
												pageNumber={pageNumber}
												scale={0.24}
												renderTextLayer={false}
												renderAnnotationLayer={false}
											/>
											<div className="absolute bottom-2 left-2 bg-gray-900 text-white text-xs px-1 py-0.5 rounded-sm">
												{pageNumber}
											</div>
											{isPageUsed(pageNumber) && (
												<div className="absolute bottom-2 right-2 bg-purple-500 text-white px-1 py-0.5 rounded-sm text-xs">
													Used
												</div>
											)}
										</div>
									) : null;
								})}
						</Document>
					</div>
					<div
						ref={mainContentRef}
						className="col-span-10 overflow-y-auto"
					>
						<Document
							file={fileUrl}
							onLoadSuccess={onDocumentLoadSuccess}
						>
							{numPages &&
								Array.from({ length: numPages }, (_, index) =>
									renderPage(index + 1),
								)}
						</Document>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default PDFViewer;
