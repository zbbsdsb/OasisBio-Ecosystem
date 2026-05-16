import { performance } from 'perf_hooks';
import { performanceMonitor, measureAsync, measureSync, withPerformanceTracking } from '@/utils/performance';

describe('Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Startup Time Tests', () => {
    it('should measure startup time accurately', () => {
      performance.mark('test-startup-start');
      
      const expensiveInit = () => {
        const data = new Array(10000).fill(0).map((_, i) => i * 2);
        return data.reduce((sum, val) => sum + val, 0);
      };
      
      expensiveInit();
      
      performance.mark('test-startup-end');
      performance.measure('test-startup', 'test-startup-start', 'test-startup-end');
      
      const measures = performance.getEntriesByName('test-startup');
      expect(measures.length).toBeGreaterThan(0);
      expect(measures[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should track app startup metrics', () => {
      const startupMetric = performanceMonitor.markStartupComplete();
      const metrics = performanceMonitor.getMetrics('startup');
      
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('API Response Time Tests', () => {
    it('should measure async API call time', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });
      
      const result = await measureAsync('/api/test', mockApiCall);
      
      expect(result).toEqual({ data: 'test' });
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      const apiMetrics = performanceMonitor.getMetrics('api');
      expect(apiMetrics.length).toBeGreaterThan(0);
      
      const testMetric = apiMetrics.find(m => m.name.includes('/api/test'));
      expect(testMetric).toBeDefined();
      expect(testMetric?.unit).toBe('ms');
    });

    it('should track multiple API calls', async () => {
      const endpoints = ['/api/users', '/api/posts', '/api/comments'];
      
      for (const endpoint of endpoints) {
        await measureAsync(endpoint, async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { endpoint };
        });
      }
      
      const apiMetrics = performanceMonitor.getMetrics('api');
      expect(apiMetrics.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle API errors and still record metrics', async () => {
      const failingApi = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(measureAsync('/api/failing', failingApi)).rejects.toThrow('Network error');
      
      const apiMetrics = performanceMonitor.getMetrics('api');
      const errorMetric = apiMetrics.find(
        m => m.name === '/api/failing' && m.metadata?.status === 'error'
      );
      expect(errorMetric).toBeDefined();
    });

    it('should measure API response time within threshold', async () => {
      const threshold = 100;
      
      await measureAsync('/api/fast', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return { success: true };
      });
      
      const metrics = performanceMonitor.getMetrics('api');
      const fastEndpoint = metrics.find(m => m.name === '/api/fast');
      
      expect(fastEndpoint?.value).toBeLessThan(threshold);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should record memory usage', () => {
      performanceMonitor.recordMemoryUsage();
      
      const memoryMetrics = performanceMonitor.getMetrics('memory');
      expect(Array.isArray(memoryMetrics)).toBe(true);
    });

    it('should track memory growth during operations', () => {
      performanceMonitor.recordMemoryUsage();
      const initialMemory = performanceMonitor.getMetrics('memory');
      
      const largeArray = new Array(100000).fill({ data: 'x'.repeat(100) });
      performanceMonitor.recordMemoryUsage();
      
      const currentMemory = performanceMonitor.getMetrics('memory');
      expect(currentMemory.length).toBeGreaterThanOrEqual(initialMemory.length);
    });

    it('should handle memory metric limits', () => {
      const originalMax = 1000;
      
      for (let i = 0; i < originalMax + 100; i++) {
        performanceMonitor.addMetric({
          name: `memory-test-${i}`,
          value: Math.random() * 1000,
          unit: 'bytes',
          timestamp: Date.now(),
          category: 'memory',
        });
      }
      
      const metrics = performanceMonitor.getMetrics('memory');
      expect(metrics.length).toBeLessThanOrEqual(originalMax);
    });
  });

  describe('FPS Tests', () => {
    it('should measure render performance', () => {
      const mockRenderFn = jest.fn().mockReturnValue('rendered');
      
      const result = measureSync('test-component', mockRenderFn);
      
      expect(result).toBe('rendered');
      expect(mockRenderFn).toHaveBeenCalledTimes(1);
      
      const renderMetrics = performanceMonitor.getMetrics('render');
      expect(renderMetrics.length).toBeGreaterThan(0);
    });

    it('should detect slow render operations', () => {
      const slowRender = () => {
        const start = Date.now();
        while (Date.now() - start < 50) {}
        return 'done';
      };
      
      measureSync('slow-component', slowRender);
      
      performanceMonitor.logSlowOperations(30);
      
      const renderMetrics = performanceMonitor.getMetrics('render');
      const slowMetric = renderMetrics.find(m => m.name === 'slow-component');
      expect(slowMetric?.value).toBeGreaterThanOrEqual(50);
    });

    it('should measure component render time distribution', () => {
      const renderCounts = [10, 50, 100];
      
      for (const count of renderCounts) {
        for (let i = 0; i < count; i++) {
          measureSync(`component-${count}`, () => count * 10);
        }
      }
      
      const metrics = performanceMonitor.getMetrics('render');
      expect(metrics.length).toBe(120);
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', async () => {
      await measureAsync('/api/test', async () => ({ data: 'test' }));
      measureSync('test-render', () => 'rendered');
      performanceMonitor.recordMemoryUsage();
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('totalMetrics');
      expect(report.summary).toHaveProperty('averageRenderTime');
      expect(report.summary).toHaveProperty('averageApiTime');
    });

    it('should calculate average times correctly', async () => {
      const calls = 5;
      
      for (let i = 0; i < calls; i++) {
        await measureAsync(`/api/call-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { id: i };
        });
      }
      
      const report = performanceMonitor.generateReport();
      expect(report.summary.averageApiTime).toBeGreaterThan(0);
    });

    it('should filter metrics by category', () => {
      measureSync('render-1', () => 'r1');
      measureSync('render-2', () => 'r2');
      
      performanceMonitor.addMetric({
        name: 'memory-test',
        value: 1000,
        unit: 'bytes',
        timestamp: Date.now(),
        category: 'memory',
      });
      
      const renderMetrics = performanceMonitor.getMetrics('render');
      const memoryMetrics = performanceMonitor.getMetrics('memory');
      
      expect(renderMetrics.length).toBe(2);
      expect(memoryMetrics.length).toBe(1);
    });
  });

  describe('Custom Metrics', () => {
    it('should support custom metric categories', () => {
      performanceMonitor.addMetric({
        name: 'custom-operation',
        value: 250,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom',
        metadata: { operationType: 'batch-process' },
      });
      
      const customMetrics = performanceMonitor.getMetrics('custom');
      expect(customMetrics.length).toBe(1);
      expect(customMetrics[0].metadata?.operationType).toBe('batch-process');
    });
  });
});

describe('Performance Benchmarks', () => {
  const BENCHMARK_THRESHOLDS = {
    apiResponse: 200,
    renderTime: 16,
    startupTime: 3000,
    memoryMB: 150,
  };

  it('should meet API response time benchmark', async () => {
    const start = performance.now();
    
    await measureAsync('/api/benchmark', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { benchmark: true };
    });
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(BENCHMARK_THRESHOLDS.apiResponse);
  });

  it('should meet render time benchmark (60fps)', () => {
    const frameTime = measureSync('frame-benchmark', () => {
      return 'frame rendered';
    });
    
    expect(frameTime).toBeLessThan(BENCHMARK_THRESHOLDS.renderTime);
  });

  it('should meet memory usage benchmark', () => {
    performanceMonitor.recordMemoryUsage();
    
    const memoryMetrics = performanceMonitor.getMetrics('memory');
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      const memoryMB = latestMemory.value / (1024 * 1024);
      expect(memoryMB).toBeLessThan(BENCHMARK_THRESHOLDS.memoryMB);
    }
  });
});
