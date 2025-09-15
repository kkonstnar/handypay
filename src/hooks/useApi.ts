import { useState, useCallback, useEffect, useRef } from "react";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<{ data: T; success: boolean; error?: string }>
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);

  const refetch = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const minInterval = 1000; // Minimum 1 second between calls

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If we've called recently, debounce the request
    if (timeSinceLastCall < minInterval) {
      console.log(
        `🔄 Debouncing API call, waiting ${minInterval - timeSinceLastCall}ms`
      );
      return new Promise<void>((resolve) => {
        debounceTimeoutRef.current = setTimeout(async () => {
          lastCallTimeRef.current = Date.now();
          await executeApiCall();
          resolve();
        }, minInterval - timeSinceLastCall);
      });
    } else {
      lastCallTimeRef.current = now;
      return executeApiCall();
    }

    async function executeApiCall() {
      try {
        setLoading(true);
        setError(null);

        const response = await apiCall();

        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error || "An error occurred");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        console.error("API call failed:", errorMessage);
      } finally {
        setLoading(false);
      }
    }
  }, []); // Remove apiCall and loading dependencies to prevent infinite loops

  // Initial API call - only once
  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true);
      refetch();
    }
  }, [hasFetched]); // Only depend on hasFetched to prevent re-triggering

  return { data, loading, error, refetch };
}
