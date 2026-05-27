import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '../services/apiClient';

// Custom hook for API calls with loading and error states
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Có lỗi xảy ra. Vui lòng thử lại.';
      
      setError({ message: errorMessage, original: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};

// Hook for paginated API calls
export const usePaginatedApi = (apiFunction, initialPage = 1, pageSize = 10) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalElements: 0,
    hasMore: false,
  });

  const loadData = useCallback(async (page = initialPage, append = false) => {
    try {
      if (page === initialPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      console.log('Loading movies page:', page, 'with pageSize:', pageSize);
      const response = await apiFunction({ page, size: pageSize });
      console.log('Movies API full response:', response);
      
      // Handle different response formats
      let newData = [];
      let totalPages = 1;
      let totalElements = 0;
      
      if (Array.isArray(response)) {
        // Direct array response
        newData = response;
        totalElements = response.length;
        totalPages = Math.ceil(totalElements / pageSize);
      } else if (response.movies) {
        // Backend specific format: {"movies": [...]}
        newData = response.movies || [];
        totalPages = response.totalPages || Math.ceil(newData.length / pageSize);
        totalElements = response.totalElements || newData.length;
      } else if (response.data || response.content) {
        // Standard paginated response
        newData = response.data || response.content || [];
        totalPages = response.totalPages || 1;
        totalElements = response.totalElements || newData.length;
      } else {
        console.error('Unexpected response format:', response);
        newData = [];
      }
      
      console.log('Processed data:', { newData: newData.length, totalPages, totalElements });
      
      setData(prevData => append ? [...prevData, ...newData] : newData);
      
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalElements: totalElements,
        hasMore: page < totalPages,
      });

    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Không thể tải dữ liệu. Vui lòng thử lại.';
      
      setError({ message: errorMessage, original: err });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [apiFunction, pageSize, initialPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData(initialPage, false);
  }, [loadData, initialPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      loadData(pagination.currentPage + 1, true);
    }
  }, [loadData, loadingMore, pagination.hasMore, pagination.currentPage]);

  return {
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    loadData,
    refresh,
    loadMore,
    setData  // Export setData for debugging/fallback
  };
};

// Hook for search with debounce
export const useSearchApi = (searchFunction, debounceMs = 500) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await searchFunction(searchQuery);
      setResults(response.data || response);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Không thể tìm kiếm. Vui lòng thử lại.';
      
      setError({ message: errorMessage, original: err });
    } finally {
      setLoading(false);
    }
  }, [searchFunction]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, search, debounceMs]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([])
  };
};