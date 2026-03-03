import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ServiceHealth {
  status: 'ok' | 'degraded' | 'error' | 'unknown';
  latency: number;
  lastCheck: string;
}

export default function HealthCheck() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: health, refetch, isLoading } = trpc.health.detailed.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 10000 : false }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Health Check Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Monitor system health and service status
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
            </Button>
          </div>
        </div>

        {isLoading && !health ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading health status...</p>
          </div>
        ) : health ? (
          <>
            {/* Overall Status */}
            <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Overall Status</h2>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(health.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.status)}
                  <Badge className={getStatusColor(health.status)}>
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-mono">
                      {Math.floor(health.uptime / 60 / 60)}h {Math.floor((health.uptime / 60) % 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Memory Used</span>
                    <span className="font-mono">
                      {formatMemory(health.memory.heapUsed)} / {formatMemory(health.memory.heapTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RSS Memory</span>
                    <span className="font-mono">{formatMemory(health.memory.rss)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services OK</span>
                    <span className="font-mono font-bold">
                      {Object.values(health.services).filter(s => s.status === 'ok').length}/
                      {Object.keys(health.services).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span className="font-mono">
                      {formatLatency(
                        Object.values(health.services).reduce((sum, s) => sum + s.latency, 0) /
                          Object.keys(health.services).length
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Services Status */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Service Status</h3>
              <div className="space-y-4">
                {Object.entries(health.services).map(([name, service]) => (
                  <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium capitalize">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-mono text-muted-foreground">
                          {formatLatency(service.latency)}
                        </p>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load health status</p>
          </Card>
        )}
      </div>
    </div>
  );
}
