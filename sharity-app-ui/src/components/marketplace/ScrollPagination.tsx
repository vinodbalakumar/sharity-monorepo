import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppButton } from '../ui';

type ScrollListener = () => void;
export const PageScrollContext = createContext<((listener: ScrollListener) => () => void) | null>(null);

/** Reset on a new filtered/sorted result, and append instead of replacing existing cards. */
export function useScrollPagination<T>(items: T[], pageSize = 24) {
  const [page, setPage] = useState({ items, pageSize, limit: pageSize });
  const reset = page.items !== items || page.pageSize !== pageSize;
  const limit = reset ? pageSize : page.limit;
  if (reset) setPage({ items, pageSize, limit: pageSize });
  const loadMore = useCallback(() => {
    setPage(current => current.items === items && current.pageSize === pageSize
      ? { ...current, limit: Math.min(current.limit + pageSize, items.length) }
      : current);
  }, [items, pageSize]);
  return { visible: items.slice(0, limit), hasMore: limit < items.length, loadMore };
}

export function ScrollPagination({ hasMore, loadMore, count, testID }: {
  hasMore: boolean;
  loadMore: () => void;
  count: number;
  testID: string;
}) {
  const subscribe = useContext(PageScrollContext);
  const marker = useRef<View>(null);
  const loading = useRef(false);
  const { height } = useWindowDimensions();
  useEffect(() => { loading.current = false; }, [count, hasMore]);

  useEffect(() => {
    if (!hasMore || !subscribe) return;
    let active = true;
    const unsubscribe = subscribe(() => {
      marker.current?.measureInWindow((_x, y, _width, markerHeight) => {
        if (active && markerHeight > 0 && y < height + 200 && !loading.current) {
          loading.current = true;
          loadMore();
        }
      });
    });
    return () => { active = false; unsubscribe(); };
  }, [hasMore, height, loadMore, subscribe]);

  if (!hasMore) return null;
  return (
    <View ref={marker} collapsable={false} testID={testID} style={{ padding: 16, alignItems: 'center' }}>
      <AppButton variant="outline" onPress={loadMore}>Load more products</AppButton>
    </View>
  );
}
