import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage Web Worker for table filtering operations
 * Provides non-blocking data processing for large datasets
 */
export const useTableWorker = () => {
	const workerRef = useRef(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const callbacksRef = useRef({});
	const requestIdRef = useRef(0);

	useEffect(() => {
		// Create worker
		try {
			workerRef.current = new Worker(
				new URL('../workers/tableFilterWorker.js', import.meta.url),
				{ type: 'module' },
			);

			// Handle messages from worker
			workerRef.current.onmessage = (e) => {
				const { type, payload, requestId } = e.data;

				if (type === 'ERROR') {
					console.error('Worker error:', payload.error);
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
				console.error('Worker error:', error);
				setIsProcessing(false);
			};
		} catch (error) {
			console.error('Failed to create worker:', error);
		}

		// Cleanup
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
			}
		};
	}, []);

	const getColumnValues = useCallback((data, columnKey, callback) => {
		if (!workerRef.current) {
			console.warn('Worker not initialized');
			callback({ values: [] });
			return;
		}

		setIsProcessing(true);
		const requestId = ++requestIdRef.current;
		callbacksRef.current[requestId] = callback;

		workerRef.current.postMessage({
			type: 'GET_COLUMN_VALUES',
			requestId,
			payload: { data, columnKey },
		});
	}, []);

	const filterRows = useCallback((data, filters, callback) => {
		if (!workerRef.current) {
			console.warn('Worker not initialized');
			callback({ filtered: data });
			return;
		}

		setIsProcessing(true);
		const requestId = ++requestIdRef.current;
		callbacksRef.current[requestId] = callback;

		workerRef.current.postMessage({
			type: 'FILTER_ROWS',
			requestId,
			payload: { data, filters },
		});
	}, []);

	const getCascadingValues = useCallback(
		(data, columnKey, previousFilters, callback) => {
			if (!workerRef.current) {
				console.warn('Worker not initialized');
				callback({ values: [] });
				return;
			}

			setIsProcessing(true);
			const requestId = ++requestIdRef.current;
			callbacksRef.current[requestId] = callback;

			workerRef.current.postMessage({
				type: 'GET_CASCADING_VALUES',
				requestId,
				payload: { data, columnKey, previousFilters },
			});
		},
		[],
	);

	return {
		getColumnValues,
		filterRows,
		getCascadingValues,
		isProcessing,
	};
};
