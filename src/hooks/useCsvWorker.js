import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage Web Worker for CSV conversion operations
 * Provides non-blocking CSV generation for large datasets
 */
export const useCsvWorker = () => {
	const workerRef = useRef(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const callbacksRef = useRef({});
	const requestIdRef = useRef(0);

	useEffect(() => {
		// Create worker
		try {
			workerRef.current = new Worker(
				new URL('../workers/csvWorker.js', import.meta.url),
				{ type: 'module' },
			);

			// Handle messages from worker
			workerRef.current.onmessage = (e) => {
				const { type, payload, requestId } = e.data;

				if (type === 'ERROR') {
					console.error('CSV Worker error:', payload.error);
				}

				if (callbacksRef.current[requestId]) {
					callbacksRef.current[requestId](payload);
					delete callbacksRef.current[requestId];
				}

				// Check if any callbacks are still pending
				const hasPendingCallbacks =
					Object.keys(callbacksRef.current).length > 0;
				setIsProcessing(hasPendingCallbacks);
			};

			workerRef.current.onerror = (error) => {
				console.error('CSV Worker error:', error);
				setIsProcessing(false);
			};
		} catch (error) {
			console.error('Failed to create CSV worker:', error);
		}

		// Cleanup
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
			}
		};
	}, []);

	const convertToCsv = useCallback((data, columns, callback) => {
		if (!workerRef.current) {
			console.warn('CSV Worker not initialized');
			callback({
				csvContent: '',
				rowCount: 0,
				error: 'Worker not initialized',
			});
			return;
		}

		setIsProcessing(true);
		const requestId = ++requestIdRef.current;
		callbacksRef.current[requestId] = callback;

		workerRef.current.postMessage({
			type: 'CONVERT_TO_CSV',
			requestId,
			payload: { data, columns },
		});
	}, []);

	return {
		convertToCsv,
		isProcessing,
	};
};
