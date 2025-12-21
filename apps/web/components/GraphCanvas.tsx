"use client";

import React, { useRef, useEffect } from 'react';
import { INode, IEdge } from '@repo/shared';

interface GraphCanvasProps {
    nodes: INode[];
    edges: IEdge[];
    width?: number;
    height?: number;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, edges, width = 800, height = 600 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Layout Algorithm: Circular Layout if coordinates are missing (0,0)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        // Check if we need to apply layout (simple check: if most nodes are at 0,0)
        const needsLayout = nodes.every(n => n.x === 0 && n.y === 0);

        if (needsLayout && nodes.length > 0) {
            const angleStep = (2 * Math.PI) / nodes.length;
            nodes.forEach((node, index) => {
                node.x = centerX + radius * Math.cos(index * angleStep);
                node.y = centerY + radius * Math.sin(index * angleStep);
            });
        }

        // Draw Edges
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge.sourceId);
            const target = nodes.find(n => n.id === edge.targetId);

            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = '#9CA3AF'; // Gray-400
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });

        // Draw Nodes
        nodes.forEach(node => {
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = node.properties.isActive ? '#10B981' : '#EF4444'; // Green or Red
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Label
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label || node.id.substring(0, 4), node.x, node.y);
        });

    }, [nodes, edges, width, height]);

    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 shadow-xl">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="block"
            />
        </div>
    );
};

export default GraphCanvas;
