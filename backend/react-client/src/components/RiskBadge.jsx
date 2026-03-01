function RiskBadge({ risk }) {
    if (!risk) return null;

    const { score, level, reason, allowed, offline } = risk;

    const getBadgeColor = () => {
        if (level === 'HIGH') return 'border-red-500 bg-red-900/20';
        if (level === 'MEDIUM') return 'border-yellow-500 bg-yellow-900/20';
        return 'border-green-500 bg-green-900/20';
    };

    const getTextColor = () => {
        if (level === 'HIGH') return 'text-red-400';
        if (level === 'MEDIUM') return 'text-yellow-400';
        return 'text-green-400';
    };

    const getIcon = () => {
        if (level === 'HIGH') {
            return (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        if (level === 'MEDIUM') {
            return (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        );
    };

    return (
        <div className={`glass rounded-xl p-6 border-l-4 ${getBadgeColor()}`}>
            <div className="flex items-start space-x-4">
                <div className={getTextColor()}>
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Risk Assessment</p>
                            <p className={`text-2xl font-bold ${getTextColor()}`}>
                                {level}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Score</p>
                            <p className={`text-3xl font-bold ${getTextColor()}`}>
                                {score}%
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-1000 ${level === 'HIGH' ? 'bg-red-500' :
                                    level === 'MEDIUM' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                }`}
                            style={{ width: `${score}%` }}
                        />
                    </div>

                    <p className="text-sm text-gray-300 mb-2">{reason}</p>

                    {offline && (
                        <div className="flex items-center space-x-2 text-yellow-400 text-xs mt-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>AI Server Offline - Fallback Assessment</span>
                        </div>
                    )}

                    {!allowed && (
                        <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-300 font-bold">
                                ⛔ Transfer Blocked by Security Policy
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RiskBadge;
