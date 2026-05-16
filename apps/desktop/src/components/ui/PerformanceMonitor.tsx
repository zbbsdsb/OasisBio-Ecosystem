import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import { PerformanceMetric, PerformanceReport } from '../../utils/performance';
import { memoryLeakDetector, LeakReport } from '../../utils/memoryLeakDetector';
import { defaultCache, CacheStats } from '../../utils/cacheManager';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  status?: 'good' | 'warning' | 'bad';
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, status = 'good', description }) => {
  const statusColors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    bad: 'text-red-500',
  };

  const formatValue = (val: number, u: string): string => {
    if (u === 'ms') {
      return `${val.toFixed(2)}ms`;
    }
    if (u === 'bytes') {
      if (val < 1024) return `${val}B`;
      if (val < 1024 * 1024) return `${(val / 1024).toFixed(2)}KB`;
      return `${(val / (1024 * 1024)).toFixed(2)}MB`;
    }
    return val.toString();
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className={`text-lg font-mono font-semibold ${statusColors[status]}`}>
        {formatValue(value, unit)}
      </div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  );
};

interface MetricListProps {
  metrics: PerformanceMetric[];
  maxItems?: number;
}

const MetricList: React.FC<MetricListProps> = ({ metrics, maxItems = 10 }) => {
  const displayedMetrics = metrics.slice(-maxItems).reverse();

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatus = (metric: PerformanceMetric): 'good' | 'warning' | 'bad' => {
    if (metric.unit === 'ms') {
      if (metric.value < 100) return 'good';
      if (metric.value < 500) return 'warning';
      return 'bad';
    }
    return 'good';
  };

  if (displayedMetrics.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        No metrics recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {displayedMetrics.map((metric, index) => (
        <div
          key={`${metric.name}-${index}`}
          className="flex items-center justify-between text-sm py-1 px-2 rounded bg-gray-700/30"
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                getStatus(metric) === 'good'
                  ? 'bg-green-500'
                  : getStatus(metric) === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-gray-300">{metric.name}</span>
            <span className="text-gray-500 text-xs">({metric.category})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-gray-400">
              {metric.unit === 'ms' ? `${metric.value.toFixed(2)}ms` : metric.value}
            </span>
            <span className="text-gray-600 text-xs">{formatTime(metric.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface PerformanceMonitorProps {
  defaultExpanded?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  defaultExpanded = false,
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'vitals' | 'memory'>('overview');
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [leakReport, setLeakReport] = useState<LeakReport | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const leakDetectionRef = useRef(false);

  const {
    metrics,
    getWebVitals,
    getMetrics,
    clearMetrics,
    recordMemoryUsage,
    logSlowOperations,
  } = usePerformance({
    trackMemory: true,
    memoryInterval: 5000,
  });

  const refreshMemoryData = useCallback(() => {
    setLeakReport(memoryLeakDetector.generateReport());
    setCacheStats(defaultCache.getStats());
    recordMemoryUsage();
  }, [recordMemoryUsage]);

  useEffect(() => {
    if (isExpanded) {
      recordMemoryUsage();
    }
  }, [isExpanded, recordMemoryUsage]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isExpanded) {
        recordMemoryUsage();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isExpanded, recordMemoryUsage]);

  useEffect(() => {
    if (isExpanded && !leakDetectionRef.current) {
      memoryLeakDetector.enable();
      leakDetectionRef.current = true;
      refreshMemoryData();
    } else if (!isExpanded && leakDetectionRef.current) {
      memoryLeakDetector.disable();
      leakDetectionRef.current = false;
    }
  }, [isExpanded, refreshMemoryData]);

  const generateReport = useCallback(() => {
    const renderMetrics = metrics.filter((m) => m.category === 'render');
    const apiMetrics = metrics.filter((m) => m.category === 'api');
    const startupMetrics = metrics.filter((m) => m.category === 'startup');
    const memoryMetrics = metrics.filter((m) => m.category === 'memory');

    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
        : 0;

    const averageApiTime =
      apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
        : 0;

    const startupTime =
      startupMetrics.find((m) => m.name === 'app-startup')?.value || 0;

    const latestMemory = memoryMetrics[memoryMetrics.length - 1];

    setReport({
      timestamp: Date.now(),
      metrics,
      summary: {
        totalMetrics: metrics.length,
        averageRenderTime,
        averageApiTime,
        startupTime,
        memoryUsage: latestMemory?.value,
      },
    });
  }, [metrics]);

  useEffect(() => {
    if (isExpanded) {
      generateReport();
    }
  }, [isExpanded, metrics, generateReport]);

  if (import.meta.env.PROD) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const webVitals = getWebVitals();
  const renderMetrics = getMetrics('render');
  const apiMetrics = getMetrics('api');

  const getMetricStatus = (value: number, thresholds: [number, number]): 'good' | 'warning' | 'bad' => {
    if (value < thresholds[0]) return 'good';
    if (value < thresholds[1]) return 'warning';
    return 'bad';
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}
    >
      {isExpanded ? (
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium text-white">Performance Monitor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearMetrics();
                  setReport(null);
                }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => logSlowOperations(100)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                Log Slow
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex border-b border-gray-700">
            {(['overview', 'metrics', 'vitals', 'memory'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'memory') refreshMemoryData();
                }}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && report && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Avg Render Time"
                    value={report.summary.averageRenderTime}
                    unit="ms"
                    status={getMetricStatus(report.summary.averageRenderTime, [16, 50])}
                    description="Target: <16ms"
                  />
                  <MetricCard
                    title="Avg API Time"
                    value={report.summary.averageApiTime}
                    unit="ms"
                    status={getMetricStatus(report.summary.averageApiTime, [200, 1000])}
                    description="Target: <200ms"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Startup Time"
                    value={report.summary.startupTime}
                    unit="ms"
                    status={getMetricStatus(report.summary.startupTime, [1000, 3000])}
                  />
                  <MetricCard
                    title="Memory Used"
                    value={report.summary.memoryUsage || 0}
                    unit="bytes"
                    status="good"
                  />
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Quick Stats</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-300">
                      Total Metrics: <span className="text-white font-mono">{metrics.length}</span>
                    </div>
                    <div className="text-gray-300">
                      Renders: <span className="text-white font-mono">{renderMetrics.length}</span>
                    </div>
                    <div className="text-gray-300">
                      API Calls: <span className="text-white font-mono">{apiMetrics.length}</span>
                    </div>
                    <div className="text-gray-300">
                      Web Vitals: <span className="text-white font-mono">{webVitals.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-medium">Recent Metrics</div>
                <MetricList metrics={metrics} maxItems={20} />
              </div>
            )}

            {activeTab === 'vitals' && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-medium">Web Vitals</div>
                {webVitals.length > 0 ? (
                  <div className="space-y-2">
                    {webVitals.map((vital, index) => (
                      <div
                        key={`${vital.name}-${index}`}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded bg-gray-700/30"
                      >
                        <span className="text-gray-300">{vital.name}</span>
                        <span className="font-mono text-gray-400">
                          {vital.value.toFixed(2)}ms
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No web vitals available
                  </div>
                )}
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-medium">Leak Detection</div>
                  {leakReport ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Severity</span>
                        <span className={`text-sm font-medium ${
                          leakReport.summary.severity === 'low' ? 'text-green-400' :
                          leakReport.summary.severity === 'medium' ? 'text-yellow-400' :
                          leakReport.summary.severity === 'high' ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {leakReport.summary.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Total Leaks</span>
                        <span className="text-white font-mono">{leakReport.summary.totalLeaks}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div className="bg-gray-700/50 rounded p-2 text-center">
                          <div className="text-gray-400">Listeners</div>
                          <div className="text-white font-mono">{leakReport.eventListeners.length}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2 text-center">
                          <div className="text-gray-400">Timers</div>
                          <div className="text-white font-mono">{leakReport.timers.length}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2 text-center">
                          <div className="text-gray-400">Requests</div>
                          <div className="text-white font-mono">{leakReport.requests.length}</div>
                        </div>
                      </div>
                      {leakReport.eventListeners.length > 0 && (
                        <div className="mt-2 p-2 bg-red-900/30 rounded">
                          <div className="text-xs text-red-400">Event Listener Leaks</div>
                          {leakReport.eventListeners.slice(0, 3).map((leak, i) => (
                            <div key={i} className="text-xs text-gray-400 mt-1">
                              {leak.target}: {leak.count} instances
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm text-center py-4">
                      Enable leak detection to view report
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-medium">Cache Statistics</div>
                  {cacheStats ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Hit Rate</span>
                        <span className={`font-mono ${
                          cacheStats.hitRate > 0.7 ? 'text-green-400' :
                          cacheStats.hitRate > 0.4 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(cacheStats.hitRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-700/50 rounded p-2">
                          <div className="text-gray-400">Hits</div>
                          <div className="text-white font-mono">{cacheStats.hits}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2">
                          <div className="text-gray-400">Misses</div>
                          <div className="text-white font-mono">{cacheStats.misses}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2">
                          <div className="text-gray-400">Size</div>
                          <div className="text-white font-mono">{cacheStats.size}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2">
                          <div className="text-gray-400">Evictions</div>
                          <div className="text-white font-mono">{cacheStats.evictions}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Memory: {cacheStats.memoryUsage < 1024 * 1024
                          ? `${(cacheStats.memoryUsage / 1024).toFixed(1)} KB`
                          : `${(cacheStats.memoryUsage / (1024 * 1024)).toFixed(2)} MB`
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm text-center py-4">
                      No cache data available
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-medium">Active Resources</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-700/50 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">Event Listeners</div>
                      <div className="text-white font-mono">{leakReport ? leakReport.eventListeners.reduce((sum, l) => sum + l.count, 0) + memoryLeakDetector.getActiveCounts().eventListeners : 0}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">Timers</div>
                      <div className="text-white font-mono">{memoryLeakDetector.getActiveCounts().timers}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">Requests</div>
                      <div className="text-white font-mono">{memoryLeakDetector.getActiveCounts().requests}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    memoryLeakDetector.clearAll();
                    defaultCache.clear();
                    refreshMemoryData();
                  }}
                  className="w-full text-xs text-red-400 hover:text-red-300 py-2 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors"
                >
                  Clear All Resources
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 flex items-center gap-2"
        >
          <span>📊</span>
          <span className="text-xs font-medium">
            {metrics.length > 0 && (
              <span className="text-green-400">{metrics.length}</span>
            )}
          </span>
        </button>
      )}
    </div>
  );
};

export default PerformanceMonitor;
