// Initialize Graph (Vis.js)
const container = document.getElementById('network-graph');
const data = { nodes: new vis.DataSet([]), edges: new vis.DataSet([]) };
const options = {
    nodes: {
        shape: 'dot',
        size: 20,
        font: { size: 14, color: '#ffffff' },
        borderWidth: 2,
        color: { background: '#3b82f6', border: '#2563eb' } // Tailwind Blue
    },
    edges: {
        width: 2,
        color: { color: '#64748b', highlight: '#94a3b8' },
        arrows: 'to',
        smooth: { type: 'continuous' }
    },
    physics: {
        stabilization: false,
        wind: { x: 0, y: 0 }
    },
    layout: {
        randomSeed: 2
    },
    interaction: {
        hover: true,
        tooltipDelay: 200
    }
};
const network = new vis.Network(container, data, options);

// Initialize Chart.js (Donut Chart)
const ctx = document.getElementById('riskChart').getContext('2d');
const riskChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
            data: [1, 0, 0], // Initial dummy data
            backgroundColor: [
                '#10B981', // Green-500
                '#F59E0B', // Yellow-500
                '#EF4444'  // Red-500
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Client-side state for Device Table
const deviceRiskMap = {}; // { "192.168.1.5": { risk: 15.5, lastUpdated: Date } }


// Start SSE Connection
const serverUrl = window.TCRAS_CONFIG ? window.TCRAS_CONFIG.serverUrl : '';
const apiKey = window.TCRAS_CONFIG ? window.TCRAS_CONFIG.apiKey : '';
const eventSource = new EventSource(`${serverUrl}/api/stream?token=${apiKey}`);

eventSource.onmessage = function (event) {
    if (event.data === "connected") return;
    try {
        const data = JSON.parse(event.data);

        // 1. Update Logs
        renderLogs([data]);

        // 2. Check Alerts & Visuals
        checkAlerts([data]);

        // 3. Update Graph
        refreshGraph();

        // 4. Update Device Table & Charts (derived from event data)
        updateRiskStats(data);

    } catch (e) {
        console.log("Keepalive / Error:", event.data);
    }

};

eventSource.onerror = function (err) {
    console.error("EventSource failed:", err);
    // Browser auto-reconnects, but we can show UI state if needed
    // document.getElementById('connection-status').innerText = "Reconnecting...";
};

async function refreshGraph() {
    try {
        const graphRes = await fetch('/api/graph-data');
        const graphJson = await graphRes.json();

        const nodes = graphJson.nodes.map(n => ({
            id: n.id,
            label: n.id,
            group: n.type || 'device'
        }));
        const edges = graphJson.links.map(l => ({
            from: l.source,
            to: l.target,
            title: l.filename
        }));

        data.nodes.update(nodes);
        data.edges.update(edges);

        document.getElementById('node-count').innerText = nodes.length;
        document.getElementById('edge-count').innerText = edges.length;
    } catch (e) { console.error(e); }
}

function updateRiskStats(eventData) {
    const evt = eventData.event;
    const risk = eventData.risk;

    // Update Device Map
    if (evt && evt.source_ip) {
        // Simple accumulation logic for demo
        if (!deviceRiskMap[evt.source_ip]) {
            deviceRiskMap[evt.source_ip] = { score: 0 };
        }
        // Use the latest transaction risk as "current risk" for simplicity, 
        // or a moving average. Let's do a mock moving average.
        let current = deviceRiskMap[evt.source_ip].score;
        let newScore = (current * 0.7) + (risk.score * 0.3);
        deviceRiskMap[evt.source_ip].score = newScore;
    }

    // Re-render Table
    const tbody = document.getElementById('device-table-body');
    tbody.innerHTML = ''; // Clear

    // Sort devices by risk desc
    const sortedDevices = Object.keys(deviceRiskMap).sort((a, b) => deviceRiskMap[b].score - deviceRiskMap[a].score);

    sortedDevices.forEach(ip => {
        const score = deviceRiskMap[ip].score;
        let colorClass = "text-green-400";
        if (score > 50) colorClass = "text-yellow-400";
        if (score > 80) colorClass = "text-red-400";

        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-800 hover:bg-gray-800/50 transition";
        tr.innerHTML = `
            <td class="py-2 pl-2 font-mono text-gray-300">${ip}</td>
            <td class="py-2 pr-2 text-right font-bold ${colorClass}">${score.toFixed(1)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update Chart (Aggregate stats)
    // Count how many devices are in each bucket
    let low = 0, med = 0, high = 0;
    Object.values(deviceRiskMap).forEach(d => {
        if (d.score < 50) low++;
        else if (d.score < 80) med++;
        else high++;
    });

    // If no data, keep default
    if (sortedDevices.length > 0) {
        riskChart.data.datasets[0].data = [low, med, high];
        riskChart.update();
    }
}


function renderLogs(logs) {
    const logContainer = document.getElementById('event-log');
    // Update count badge
    const currentCount = parseInt(document.getElementById('log-count').innerText) || 0;
    document.getElementById('log-count').innerText = currentCount + logs.length;

    logs.forEach(item => {
        const evt = item.event;
        const risk = item.risk;

        let colorClass = "border-l-4 border-green-500 bg-gray-700/50";
        if (risk.level === 'MEDIUM') colorClass = "border-l-4 border-yellow-500 bg-gray-700/50";
        if (risk.level === 'HIGH') colorClass = "border-l-4 border-red-500 bg-red-900/20";

        const div = document.createElement('div');
        div.className = `p-3 rounded text-sm ${colorClass} hover:bg-gray-700 transition animate-fade-in-down`;
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="font-bold text-gray-200 truncate pr-2 w-32" title="${evt.filename}">${evt.filename}</span>
                <span class="text-xs text-gray-400 whitespace-nowrap">${new Date(evt.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                <ion-icon name="arrow-forward-outline"></ion-icon>
                <span>${evt.source_ip} &rarr; ${evt.destination_ip || "?"}</span>
            </div>
            <div class="text-xs font-mono mt-1 ${risk.level === 'HIGH' ? 'text-red-400 font-bold' : 'text-blue-300'}">
                Risk: ${risk.score.toFixed(1)} (${risk.level})
            </div>
        `;
        logContainer.prepend(div);
        if (logContainer.children.length > 50) logContainer.lastChild.remove();
    });
}

function checkAlerts(logs) {
    if (logs.length === 0) return;

    const latest = logs[0];
    const evt = latest.event;
    const risk = latest.risk;

    const alertBox = document.getElementById('alert-box');
    const statusCard = document.getElementById('status-card');

    if (risk.level === 'HIGH') {
        alertBox.classList.remove('hidden');
        alertBox.classList.add('shake-alert');

        document.getElementById('alert-filename').innerText = `${evt.filename}`;
        document.getElementById('alert-score-text').innerText = `${risk.score.toFixed(0)}`;
        document.getElementById('alert-score-bar').style.width = `${Math.min(risk.score, 100)}%`;

        // Update main card
        document.getElementById('risk-status').innerText = "CRITICAL";
        document.getElementById('risk-status').className = "text-2xl font-bold text-red-500";
        statusCard.className = "glass p-5 rounded-xl border-l-4 border-red-500 relative overflow-hidden transition-all duration-300";

        // Flash Effect
        anime({
            targets: 'body',
            backgroundColor: ['#111827', '#3f1115', '#111827'],
            duration: 800,
            easing: 'easeInOutQuad'
        });

    } else {
        alertBox.classList.add('hidden');
        alertBox.classList.remove('shake-alert');

        // Reset main card if not high (or logic could be stickier)
        // For demo, we default back quickly or keep it. Let's keep "CRITICAL" visible until next safe event or refresh? 
        // Better: Set it based on the current event for responsiveness.
        if (risk.level === 'MEDIUM') {
            document.getElementById('risk-status').innerText = "ELEVATED";
            document.getElementById('risk-status').className = "text-2xl font-bold text-yellow-500";
            statusCard.className = "glass p-5 rounded-xl border-l-4 border-yellow-500 relative overflow-hidden transition-all duration-300";
        } else {
            document.getElementById('risk-status').innerText = "SECURE";
            document.getElementById('risk-status').className = "text-2xl font-bold text-green-500";
            statusCard.className = "glass p-5 rounded-xl border-l-4 border-green-500 relative overflow-hidden transition-all duration-300";
        }
    }
}
