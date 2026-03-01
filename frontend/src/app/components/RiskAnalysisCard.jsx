import { AlertTriangle, CheckCircle, ShieldAlert, Activity } from 'lucide-react';
import { Progress } from './ui/progress';

export function RiskAnalysisCard({
  riskScore,
  statusMessage,
  isAnalyzing,
}) {
  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-600 dark:text-green-400';
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskBgColor = (score) => {
    if (score < 30) return 'bg-green-100 dark:bg-green-900/30';
    if (score < 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getRiskBarColor = (score) => {
    if (score < 30) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskIcon = (score) => {
    if (score < 30) return <CheckCircle className="h-8 w-8" />;
    if (score < 70) return <AlertTriangle className="h-8 w-8" />;
    return <ShieldAlert className="h-8 w-8" />;
  };

  const getRiskLabel = (score) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      {isAnalyzing ? (
        <div className="py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Activity className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <div className="text-center">
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                Analyzing Security Risk...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Running Isolation Forest algorithm
              </p>
            </div>
            <Progress value={undefined} className="h-2 w-full max-w-xs" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Risk Score Display */}
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-xl ${getRiskBgColor(riskScore)} flex items-center justify-center ${getRiskColor(riskScore)}`}>
              {getRiskIcon(riskScore)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <div className={`text-5xl font-bold ${getRiskColor(riskScore)}`}>
                  {riskScore}
                </div>
                <div className={`text-xl font-semibold ${getRiskColor(riskScore)}`}>
                  %
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getRiskLabel(riskScore)}
              </div>
            </div>
          </div>

          {/* Risk Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Risk Level</span>
              <span className="font-medium">{riskScore < 30 ? 'Safe' : riskScore < 70 ? 'Caution' : 'Danger'}</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getRiskBarColor(riskScore)} transition-all duration-1000 ease-out`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {riskScore < 30 ? 'Anomaly Detection:' : riskScore < 70 ? 'Alert:' : 'Warning:'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {statusMessage}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
