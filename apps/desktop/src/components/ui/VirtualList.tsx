import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface VirtualListItem<T = unknown> {
  data: T;
  index: number;
}

export interface VirtualListProps<T = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  items: T[];
  height: number | string;
  itemHeight?: number;
  estimatedItemHeight?: number;
  overscan?: number;
  renderItem: (item: VirtualListItem<T>, index: number) => React.ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>, scrollInfo: ScrollInfo) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  scrollToIndex?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  className?: string;
  style?: React.CSSProperties;
}

export interface ScrollInfo {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollPercentage: number;
}

export interface VirtualListRef {
  scrollTo: (offset: number) => void;
  scrollToIndex: (index: number, alignment?: ScrollToAlignment) => void;
  getScrollInfo: () => ScrollInfo;
  getVisibleRange: () => { start: number; end: number };
}

type ScrollToAlignment = 'start' | 'center' | 'end' | 'auto';

interface ItemMeasurement {
  offset: number;
  size: number;
}

const STORAGE_KEY = 'virtual-list-scroll-positions';

interface StoredScrollPosition {
  scrollTop: number;
  timestamp: number;
}

function getStoredScrollPosition(listId: string): number | null {
  try {
    const stored = sessionStorage.getItem(`${STORAGE_KEY}-${listId}`);
    if (stored) {
      const data: StoredScrollPosition = JSON.parse(stored);
      if (Date.now() - data.timestamp < 30 * 60 * 1000) {
        return data.scrollTop;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function saveScrollPosition(listId: string, scrollTop: number): void {
  try {
    const data: StoredScrollPosition = {
      scrollTop,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${STORAGE_KEY}-${listId}`, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function VirtualList<T = unknown>({
  items,
  height,
  itemHeight,
  estimatedItemHeight = 50,
  overscan = 3,
  renderItem,
  onScroll,
  onEndReached,
  endReachedThreshold = 200,
  scrollToIndex,
  scrollToAlignment = 'auto',
  className = '',
  style,
  ...props
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listIdRef = useRef(`vl-${Math.random().toString(36).substring(2, 9)}`);
  
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  
  const itemCount = items.length;
  const hasFixedItemHeight = typeof itemHeight === 'number';
  
  const measurementsRef = useRef<Map<number, ItemMeasurement>>(new Map());
  const measurementCacheRef = useRef<Map<number, number>>(new Map());
  
  const getItemOffset = useCallback(
    (index: number): number => {
      if (index === 0) return 0;
      
      const cached = measurementCacheRef.current.get(index);
      if (cached !== undefined) {
        return cached;
      }
      
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const cachedSize = measurementCacheRef.current.get(i);
        if (cachedSize !== undefined) {
          offset += cachedSize;
        } else {
          offset += hasFixedItemHeight ? itemHeight! : estimatedItemHeight;
        }
      }
      
      return offset;
    },
    [hasFixedItemHeight, itemHeight, estimatedItemHeight]
  );
  
  const getItemSize = useCallback(
    (index: number): number => {
      if (hasFixedItemHeight) {
        return itemHeight!;
      }
      
      const cached = measurementCacheRef.current.get(index);
      if (cached !== undefined) {
        return cached;
      }
      
      return estimatedItemHeight;
    },
    [hasFixedItemHeight, itemHeight, estimatedItemHeight]
  );
  
  const totalHeight = useMemo(() => {
    if (hasFixedItemHeight) {
      return itemHeight! * itemCount;
    }
    
    let total = 0;
    for (let i = 0; i < itemCount; i++) {
      total += getItemSize(i);
    }
    return total;
  }, [hasFixedItemHeight, itemHeight, itemCount, getItemSize]);
  
  const getOffsetForIndex = useCallback(
    (index: number, alignment: ScrollToAlignment): number => {
      const itemOffset = getItemOffset(index);
      const itemSize = getItemSize(index);
      
      switch (alignment) {
        case 'start':
          return itemOffset;
        case 'end':
          return itemOffset - containerHeight + itemSize;
        case 'center':
          return itemOffset - containerHeight / 2 + itemSize / 2;
        case 'auto':
        default:
          if (scrollTop >= itemOffset) {
            return itemOffset - containerHeight + itemSize + estimatedItemHeight;
          } else if (scrollTop + containerHeight <= itemOffset + itemSize) {
            return itemOffset;
          }
          return scrollTop;
      }
    },
    [getItemOffset, getItemSize, containerHeight, scrollTop, estimatedItemHeight]
  );
  
  const calculateVisibleRange = useCallback((): { start: number; end: number } => {
    if (itemCount === 0) {
      return { start: 0, end: 0 };
    }
    
    let start = 0;
    let end = itemCount - 1;
    
    for (let i = 0; i < itemCount; i++) {
      const offset = getItemOffset(i);
      const size = getItemSize(i);
      
      if (offset + size < scrollTop) {
        start = i + 1;
      }
      
      if (offset > scrollTop + containerHeight) {
        end = i - 1;
        break;
      }
    }
    
    return { start, end };
  }, [itemCount, scrollTop, containerHeight, getItemOffset, getItemSize]);
  
  const { startIndex, endIndex } = useMemo(() => {
    const range = calculateVisibleRange();
    const start = Math.max(0, range.start - overscan);
    const end = Math.min(itemCount - 1, range.end + overscan);
    return { startIndex: start, endIndex: end };
  }, [calculateVisibleRange, overscan, itemCount]);
  
  const visibleItems = useMemo(() => {
    const result: { index: number; item: T; offset: number }[] = [];
    
    for (let i = startIndex; i <= endIndex && i < itemCount; i++) {
      result.push({
        index: i,
        item: items[i],
        offset: getItemOffset(i),
      });
    }
    
    return result;
  }, [startIndex, endIndex, items, itemCount, getItemOffset]);
  
  const measureItem = useCallback((index: number, element: HTMLElement | null) => {
    if (!element || hasFixedItemHeight) return;
    
    const newSize = element.getBoundingClientRect().height;
    const oldSize = measurementCacheRef.current.get(index);
    
    if (oldSize !== newSize) {
      measurementCacheRef.current.set(index, newSize);
      
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    }
  }, [hasFixedItemHeight]);
  
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const newScrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      
      setScrollTop(newScrollTop);
      
      const scrollInfo: ScrollInfo = {
        scrollTop: newScrollTop,
        scrollHeight,
        clientHeight,
        scrollPercentage: (newScrollTop / (scrollHeight - clientHeight)) * 100 || 0,
      };
      
      onScroll?.(event, scrollInfo);
      
      saveScrollPosition(listIdRef.current, newScrollTop);
      
      if (
        onEndReached &&
        scrollHeight - newScrollTop - clientHeight < endReachedThreshold
      ) {
        onEndReached();
      }
    },
    [onScroll, onEndReached, endReachedThreshold]
  );
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    
    setContainerHeight(container.clientHeight);
    
    const storedScroll = getStoredScrollPosition(listIdRef.current);
    if (storedScroll !== null && storedScroll <= container.scrollHeight - container.clientHeight) {
      container.scrollTop = storedScroll;
      setScrollTop(storedScroll);
    }
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (typeof scrollToIndex === 'number' && containerRef.current) {
      const offset = getOffsetForIndex(scrollToIndex, scrollToAlignment);
      containerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [scrollToIndex, scrollToAlignment, getOffsetForIndex]);
  
  const scrollTo = useCallback((offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, []);
  
  const scrollToIndexFn = useCallback(
    (index: number, alignment: ScrollToAlignment = 'auto') => {
      if (containerRef.current && index >= 0 && index < itemCount) {
        const offset = getOffsetForIndex(index, alignment);
        containerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
      }
    },
    [itemCount, getOffsetForIndex]
  );
  
  const getScrollInfo = useCallback((): ScrollInfo => {
    const container = containerRef.current;
    if (!container) {
      return { scrollTop: 0, scrollHeight: 0, clientHeight: 0, scrollPercentage: 0 };
    }
    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      scrollPercentage: (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100 || 0,
    };
  }, []);
  
  const getVisibleRange = useCallback(() => {
    return calculateVisibleRange();
  }, [calculateVisibleRange]);
  
  useImperativeHandle(
    () => ({
      scrollTo,
      scrollToIndex: scrollToIndexFn,
      getScrollInfo,
      getVisibleRange,
    }),
    [scrollTo, scrollToIndexFn, getScrollInfo, getVisibleRange]
  );
  
  const heightValue = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{
        height: heightValue,
        position: 'relative',
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ index, item, offset }) => (
          <div
            key={index}
            ref={(el) => measureItem(index, el)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${offset}px)`,
            }}
            data-index={index}
          >
            {renderItem({ data: item, index }, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function createVirtualizedList<T = unknown>(
  listId: string,
  options: Omit<VirtualListProps<T>, 'items' | 'renderItem'>
) {
  return function VirtualizedListComponent({
    items,
    renderItem,
    ...props
  }: Omit<VirtualListProps<T>, 'renderItem'>) {
    const [scrollTop, setScrollTop] = useState<number | null>(null);
    
    useEffect(() => {
      if (scrollTop === null) {
        const stored = getStoredScrollPosition(listId);
        if (stored !== null && options.height) {
          setScrollTop(stored);
        }
      }
    }, [scrollTop, options.height]);
    
    return (
      <VirtualList
        items={items}
        renderItem={renderItem}
        {...options}
        {...props}
      />
    );
  };
}

export const createMemoizedVirtualList = <T extends object>(
  listId: string,
  options: Omit<VirtualListProps<T>, 'items' | 'renderItem'>
) => {
  const VirtualListComponent = createVirtualizedList<T>(listId, options);
  
  return React.memo(VirtualListComponent, (prevProps, nextProps) => {
    return (
      prevProps.items === nextProps.items &&
      prevProps.height === nextProps.height
    );
  });
};
