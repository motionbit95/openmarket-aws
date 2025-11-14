import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { getSellers, getSellerById, createSeller, deleteSeller } from 'src/actions/seller';
import { SWR_KEYS, cacheUtils } from 'src/lib/swr-config';

// 전체 판매자 목록 조회
export function useSellers(params = {}) {
  const key = params.search ? `${SWR_KEYS.sellers}?search=${params.search}` : SWR_KEYS.sellers;
  
  const { data, error, isLoading, isValidating, mutate: mutateSellers } = useSWR(
    key,
    () => getSellers(params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    sellers: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    refresh: mutateSellers,
    mutate: mutateSellers,
  };
}

// 단일 판매자 조회
export function useSeller(sellerId, options = {}) {
  const shouldFetch = sellerId && !options.disabled;
  
  const { data, error, isLoading, isValidating, mutate: mutateSeller } = useSWR(
    shouldFetch ? SWR_KEYS.seller(sellerId) : null,
    () => getSellerById(sellerId),
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    seller: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    refresh: mutateSeller,
    mutate: mutateSeller,
  };
}

// 판매자 관련 뮤테이션 훅
export function useSellerMutations() {
  // 판매자 생성
  const createSellerMutation = async (sellerData) => {
    try {
      const newSeller = await createSeller(sellerData);
      
      // 판매자 목록 캐시 무효화
      await mutate(SWR_KEYS.sellers);
      
      return { success: true, data: newSeller };
    } catch (error) {
      return { success: false, error };
    }
  };

  // 판매자 삭제
  const deleteSellerMutation = async (sellerId) => {
    try {
      await deleteSeller(sellerId);
      
      // 관련 캐시 무효화
      await Promise.all([
        mutate(SWR_KEYS.sellers),
        mutate(SWR_KEYS.seller(sellerId)),
        mutate(SWR_KEYS.productsBySeller(sellerId)),
        mutate(SWR_KEYS.couponsBySeller(sellerId)),
      ]);
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    createSeller: createSellerMutation,
    deleteSeller: deleteSellerMutation,
  };
}

// 판매자 검색을 위한 디바운스 훅
export function useSellerSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // 500ms 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const { sellers, isLoading, isError, error, refresh } = useSellers({
    search: debouncedQuery,
  });

  return {
    query,
    setQuery,
    sellers,
    isLoading,
    isError,
    error,
    refresh,
    isSearching: query !== debouncedQuery,
  };
}