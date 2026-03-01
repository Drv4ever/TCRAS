import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NetworkGraph from '../components/NetworkGraph';

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [stats, setStats] = useState({
        totalEvents: 0,
        highRiskCount: 0,
        avgRisk: 0
    });
    const eventSourceRef = useRef(null);

    // Fetch initial dashboard data
    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/dashboard-stats');
            setEvents(response.data.events || []);
            setGraphData(response.data.graph || { nodes: [], links: [] });

            // Calculate stats
            const events = response.data.events || [];
            const highRisk = events.filter(e => e.risk && e.risk[1] === 'HIGH').length;
            const avgRisk = events.length > 0
                ? events.reduce((sum, e) => sum + (e.risk?.[0] || 0), 0) / events.length
                : 0;

            setStats({
                totalEvents: events.length,
                highRiskCount: highRisk,
                avgRisk: avgRisk.toFixed(1)
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    // Setup SSE connection
    useEffect(() => {
        fetchDashboardData();

        // Connect to SSE stream
        const apiKey = 'tcras_secure_key_2024';
        eventSourceRef.current = new EventSource(`http://localhost:8000/api/stream?api_key=${apiKey}`);

        eventSourceRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE event received:', data);

                // Refresh dashboard data when new event arrives
                fetchDashboardData();
            } catch (error) {
                console.error('SSE parse error:', error);
            }
        };

        eventSourceRef.current.onerror = (error) => {
            console.error('SSE connection error:', error);
        };

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Stats Cards */}
                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-6 border-l-4 border-cyber-blue">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Events</p>
                        <p className="text-3xl font-bold text-white">{stats.totalEvents}</p>
                    </div>

                    <div className="glass rounded-xl p-6 border-l-4 border-red-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">High Risk Alerts</p>
                        <p className="text-3xl font-bold text-red-400">{stats.highRiskCount}</p>
                    </div>

                    <div className="glass rounded-xl p-6 border-l-4 border-yellow-500">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Risk Score</p>
                        <p className="text-3xl font-bold text-yellow-400">{stats.avgRisk}</p>
                    </div>
                </div>

                {/* Network Graph */}
                <div className="lg:col-span-3 glass rounded-xl p-6 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-300">Transfer Network Map</h2>
                        <div className="flex space-x-4 text-xs">
                            <span className="text-gray-400">
                                Nodes: <span className="text-cyber-blue font-bold">{graphData.nodes?.length || 0}</span>
                            </span>
                            <span className="text-gray-400">
                                Links: <span className="text-cyber-purple font-bold">{graphData.links?.length || 0}</span>
                            </span>
                        </div>
                    </div>
                    <div className="bg-black/30 rounded-lg" style={{ height: '400px' }}>
                        <NetworkGraph data={graphData} />
                    </div>
                </div>

                {/* Event Log */}
                <div className="lg:col-span-1 glass rounded-xl p-6 border border-gray-700/50 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-300">Recent Events</h2>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded">{events.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-96">
                        {events.length === 0 ? (
                            <p className="text-gray-600 text-sm">No events yet</p>
                        ) : (
                            events.slice(0, 20).map((event, index) => {
                                const riskLevel = event.risk?.[1] || 'UNKNOWN';
                                const riskScore = event.risk?.[0] || 0;
                                const riskColor =
                                    riskLevel === 'HIGH' ? 'text-red-400' :
                                        riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                                            'text-green-400';

                                return (
                                    <div key={index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs text-gray-400 font-mono truncate flex-1">
                                                {event.event?.filename || 'Unknown'}
                                            </p>
                                            <span className={`text-xs font-bold ${riskColor}`}>
                                                {riskLevel}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{event.event?.source_ip || 'N/A'}</span>
                                            <span>{riskScore}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
