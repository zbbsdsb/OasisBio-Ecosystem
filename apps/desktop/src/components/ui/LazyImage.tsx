import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { performanceMonitor } from '../../utils/performance';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  lazy?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: (success: boolean) => void;
  className?: string;
  wrapperClassName?: string;
}

export interface LazyImageRef {
  load: () => void;
  reset: () => void;
  getStatus: () => ImageLoadStatus;
}

export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

const DEFAULT_THRESHOLD = 0.1;
const DEFAULT_ROOT_MARGIN = '50px';

export const LazyImage = memo(
  forwardRef<LazyImageRef, LazyImageProps>(function LazyImage(
    {
      src,
      alt,
      placeholder,
      errorPlaceholder,
      threshold = DEFAULT_THRESHOLD,
      rootMargin = DEFAULT_ROOT_MARGIN,
      lazy = true,
      onLoadStart,
      onLoadEnd,
      className = '',
      wrapperClassName = '',
      onLoad,
      onError,
      ...props
    },
    ref
  ) {
    const [status, setStatus] = useState<ImageLoadStatus>('idle');
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const [isInView, setIsInView] = useState(!lazy);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const loadStartTimeRef = useRef<number>(0);
    
    const startLoad = useCallback(() => {
      if (status !== 'idle' && status !== 'error') return;
      
      setStatus('loading');
      loadStartTimeRef.current = performance.now();
      onLoadStart?.();
    }, [status, onLoadStart]);
    
    const handleLoad = useCallback(() => {
      const loadTime = performance.now() - loadStartTimeRef.current;
      
      performanceMonitor.addMetric({
        name: 'lazy-image-load',
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
        metadata: { src, status: 'success' },
      });
      
      setStatus('loaded');
      setCurrentSrc(src);
      onLoadEnd?.(true);
      onLoad?.(new Event('load'));
    }, [src, onLoad, onLoadEnd]);
    
    const handleError = useCallback(() => {
      const loadTime = performance.now() - loadStartTimeRef.current;
      
      performanceMonitor.addMetric({
        name: 'lazy-image-load',
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
        metadata: { src, status: 'error' },
      });
      
      setStatus('error');
      onLoadEnd?.(false);
      onError?.(new Event('error'));
    }, [src, onError, onLoadEnd]);
    
    const reset = useCallback(() => {
      setStatus('idle');
      setCurrentSrc(null);
    }, []);
    
    useImperativeHandle(ref, () => ({
      load: startLoad,
      reset,
      getStatus: () => status,
    }), [startLoad, reset, status]);
    
    useEffect(() => {
      if (!lazy) {
        setIsInView(true);
        return;
      }
      
      const container = containerRef.current;
      if (!container) return;
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          threshold,
          rootMargin,
        }
      );
      
      observerRef.current.observe(container);
      
      return () => {
        observerRef.current?.disconnect();
      };
    }, [lazy, threshold, rootMargin]);
    
    useEffect(() => {
      if (!isInView) return;
      
      startLoad();
      
      const img = new Image();
      imageRef.current = img;
      
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = src;
      
      return () => {
        img.onload = null;
        img.onerror = null;
        imageRef.current = null;
      };
    }, [isInView, src, handleLoad, handleError, startLoad]);
    
    const defaultPlaceholder = (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
    
    const defaultErrorPlaceholder = (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
        <svg
          className="w-8 h-8 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs">Failed to load</span>
      </div>
    );
    
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${wrapperClassName}`}
        style={{ minHeight: props.height ? `${props.height}px` : undefined }}
      >
        {status === 'idle' && (
          <div className="absolute inset-0">
            {placeholder || defaultPlaceholder}
          </div>
        )}
        
        {status === 'loading' && (
          <div className="absolute inset-0">
            {placeholder || defaultPlaceholder}
          </div>
        )}
        
        {status === 'error' && (
          <div className="absolute inset-0">
            {errorPlaceholder || defaultErrorPlaceholder}
          </div>
        )}
        
        {status === 'loaded' && currentSrc && (
          <img
            src={currentSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${className}`}
            style={{ opacity: 1 }}
            {...props}
          />
        )}
      </div>
    );
  })
);

LazyImage.displayName = 'LazyImage';

interface ImageListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  images: Array<{
    src: string;
    alt: string;
    key?: string;
  }>;
  columns?: number;
  gap?: number;
  renderImage?: (props: LazyImageProps & { ref: React.Ref<LazyImageRef> }) => React.ReactElement;
  onImageLoad?: (src: string, success: boolean) => void;
}

export const LazyImageList = memo(function LazyImageList({
  images,
  columns = 3,
  gap = 8,
  renderImage,
  onImageLoad,
  className = '',
  ...props
}: ImageListProps) {
  const imageRefs = useRef<Map<number, LazyImageRef>>(new Map());
  
  const defaultRenderImage = useCallback(
    (imgProps: LazyImageProps & { ref: React.Ref<LazyImageRef> }) => (
      <LazyImage {...imgProps} />
    ),
    []
  );
  
  const renderFn = renderImage || defaultRenderImage;
  
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
      {...props}
    >
      {images.map((image, index) => {
        const imageProps: LazyImageProps & { ref: React.Ref<LazyImageRef> } = {
          src: image.src,
          alt: image.alt,
          onLoadEnd: (success) => onImageLoad?.(image.src, success),
        };
        
        return (
          <div key={image.key || image.src} className="aspect-square">
            {renderFn(imageProps)}
          </div>
        );
      })}
    </div>
  );
});

LazyImageList.displayName = 'LazyImageList';
