import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';

function NetworkGraph({ data }) {
    const containerRef = useRef(null);
    const networkRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !data) return;

        // Transform data for vis-network
        const nodes = (data.nodes || []).map(node => ({
            id: node.id,
            label: node.id,
            color: {
                background: '#00d4ff',
                border: '#0099cc',
                highlight: {
                    background: '#00ffff',
                    border: '#00d4ff'
                }
            },
            font: {
                color: '#ffffff',
                size: 12
            }
        }));

        const edges = (data.links || []).map((link, index) => ({
            id: index,
            from: link.source,
            to: link.target,
            arrows: 'to',
            color: {
                color: '#7b2cbf',
                highlight: '#ff006e'
            },
            width: 2
        }));

        const graphData = {
            nodes: nodes,
            edges: edges
        };

        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                borderWidth: 2,
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 212, 255, 0.5)',
                    size: 10
                }
            },
            edges: {
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'horizontal'
                }
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 150,
                    springConstant: 0.04
                },
                stabilization: {
                    iterations: 100
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true
            },
            layout: {
                improvedLayout: true,
                hierarchical: {
                    enabled: false
                }
            }
        };

        // Create network
        if (networkRef.current) {
            networkRef.current.destroy();
        }

        networkRef.current = new Network(containerRef.current, graphData, options);

        // Cleanup
        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
            }
        };
    }, [data]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
        />
    );
}

export default NetworkGraph;
