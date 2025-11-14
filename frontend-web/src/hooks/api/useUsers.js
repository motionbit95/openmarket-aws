import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from 'src/actions/user';
import { SWR_KEYS, cacheUtils } from 'src/lib/swr-config';

// 전체 사용자 목록 조회
export function useUsers(params = {}) {
  const key = params.search ? `${SWR_KEYS.users}?search=${params.search}` : SWR_KEYS.users;
  
  const { data, error, isLoading, isValidating, mutate: mutateUsers } = useSWR(
    key,
    () => getUsers(params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5초 내 중복 요청 방지
    }
  );

  return {
    users: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    refresh: mutateUsers,
    mutate: mutateUsers,
  };
}

// 단일 사용자 조회
export function useUser(userId, options = {}) {
  const shouldFetch = userId && !options.disabled;
  
  const { data, error, isLoading, isValidating, mutate: mutateUser } = useSWR(
    shouldFetch ? SWR_KEYS.user(userId) : null,
    () => getUserById(userId),
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    refresh: mutateUser,
    mutate: mutateUser,
  };
}

// 사용자 관련 뮤테이션 훅
export function useUserMutations() {
  // 사용자 생성
  const createUserMutation = async (userData) => {
    try {
      const newUser = await createUser(userData);
      
      // 사용자 목록 캐시 무효화
      await mutate(SWR_KEYS.users);
      
      return { success: true, data: newUser };
    } catch (error) {
      return { success: false, error };
    }
  };

  // 사용자 수정
  const updateUserMutation = async (userId, updateData) => {
    try {
      const updatedUser = await updateUser(userId, updateData);
      
      // 관련 캐시 무효화
      await Promise.all([
        mutate(SWR_KEYS.users),
        mutate(SWR_KEYS.user(userId)),
      ]);
      
      return { success: true, data: updatedUser };
    } catch (error) {
      return { success: false, error };
    }
  };

  // 사용자 삭제
  const deleteUserMutation = async (userId) => {
    try {
      await deleteUser(userId);
      
      // 모든 사용자 관련 캐시 무효화
      await cacheUtils.invalidateUser(mutate, userId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    createUser: createUserMutation,
    updateUser: updateUserMutation,
    deleteUser: deleteUserMutation,
  };
}

// 사용자 통계 조회 (관리자용)
export function useUserStats() {
  const { data, error, isLoading, mutate: mutateStats } = useSWR(
    '/admin/users/stats',
    null, // 실제 API가 있다면 여기에 함수 추가
    {
      refreshInterval: 60000, // 1분마다 자동 새로고침
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutateStats,
  };
}

// 사용자 검색을 위한 디바운스 훅
export function useUserSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // 500ms 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const { users, isLoading, isError, error, refresh } = useUsers({
    search: debouncedQuery,
  });

  return {
    query,
    setQuery,
    users,
    isLoading,
    isError,
    error,
    refresh,
    isSearching: query !== debouncedQuery,
  };
}