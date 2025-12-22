"use client";

import React, { useRef, useEffect, useState } from 'react';
import { INode, IEdge } from '@repo/shared';

interface GraphCanvasProps {
    nodes: INode[];
    edges: IEdge[];
    width?: number;
    height?: number;
    onNodeMove?: (nodeId: string, x: number, y: number) => void;
    onNodeSelect?: (node: INode | null) => void;
    onNodeAdd?: (x: number, y: number) => void;
    onEdgeAdd?: (sourceId: string, targetId: string) => void;
    customNodeColors?: Record<string, string>;
    highlightedPath?: string[];
    selectedNodeId?: string | null;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
    nodes,
    edges,
    width = 800,
    height = 600,
    onNodeMove,
    onNodeSelect,
    onNodeAdd,
    onEdgeAdd,
    customNodeColors = {},
    highlightedPath = [],
    selectedNodeId = null
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

    // Edge Creation State
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Initial Layout Logic (only runs once if nodes have 0,0 coords)
    useEffect(() => {
    }, []);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const getNodeAtPos = (x: number, y: number) => {
        // Simple collision detection for circles radius 35 (using 45 for better hit detection)
        return nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 45;
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        const node = getNodeAtPos(x, y);

        if (node) {
            if (e.shiftKey) {
                // Start connection mode
                setIsConnecting(true);
                setConnectingNodeId(node.id);
                setMousePos({ x, y });
            } else {
                // Normal drag/select
                setIsDragging(true);
                setDraggedNodeId(node.id);
                onNodeSelect?.(node);
            }
        } else {
            onNodeSelect?.(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        setMousePos({ x, y });

        if (isDragging && draggedNodeId) {
            // Clamp node within canvas boundaries
            const nodeRadius = 35;
            const clampedX = Math.max(nodeRadius, Math.min(width - nodeRadius, x));
            const clampedY = Math.max(nodeRadius, Math.min(height - nodeRadius, y));
            onNodeMove?.(draggedNodeId, clampedX, clampedY);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isConnecting && connectingNodeId) {
            const { x, y } = getMousePos(e);
            const targetNode = getNodeAtPos(x, y);

            if (targetNode && targetNode.id !== connectingNodeId) {
                onEdgeAdd?.(connectingNodeId, targetNode.id);
            }
        }

        setIsDragging(false);
        setDraggedNodeId(null);
        setIsConnecting(false);
        setConnectingNodeId(null);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        const node = getNodeAtPos(x, y);
        if (!node) {
            onNodeAdd?.(x, y);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ... (layout logic same as before)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        const needsLayout = nodes.every(n => n.x === 0 && n.y === 0) && nodes.length > 0;

        const renderNodes = needsLayout ? nodes.map((node, index) => {
            const angleStep = (2 * Math.PI) / nodes.length;
            return {
                ...node,
                x: centerX + radius * Math.cos(index * angleStep),
                y: centerY + radius * Math.sin(index * angleStep)
            };
        }) : nodes;

        // Draw Edges
        edges.forEach(edge => {
            // ... existing edge drawing code
            const source = renderNodes.find(n => n.id === edge.sourceId);
            const target = renderNodes.find(n => n.id === edge.targetId);

            if (source && target) {
                let isHighlighted = false;
                if (highlightedPath.length > 1) {
                    for (let i = 0; i < highlightedPath.length - 1; i++) {
                        if ((highlightedPath[i] === edge.sourceId && highlightedPath[i + 1] === edge.targetId) ||
                            (highlightedPath[i] === edge.targetId && highlightedPath[i + 1] === edge.sourceId)) {
                            isHighlighted = true;
                            break;
                        }
                    }
                }

                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);

                if (isHighlighted) {
                    ctx.strokeStyle = '#EF4444'; // Red
                    ctx.lineWidth = 4;
                } else {
                    ctx.strokeStyle = '#4B5563'; // Gray-600 (Slightly lighter for visibility)
                    ctx.lineWidth = 2;
                }

                ctx.stroke();

                // Draw weight label on edge midpoint
                const weight = (edge as any).weight;
                if (weight !== undefined && weight !== null) {
                    const midX = (source.x + target.x) / 2;
                    const midY = (source.y + target.y) / 2;

                    // Background for label
                    ctx.fillStyle = '#1F2937';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
                    ctx.fill();

                    // Weight text
                    ctx.fillStyle = '#9CA3AF';
                    ctx.font = '10px Inter, Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(weight.toFixed ? weight.toFixed(1) : String(weight), midX, midY);
                }
            }
        });

        // Draw Proposed Edge (Rubber banding)
        if (isConnecting && connectingNodeId) {
            const source = renderNodes.find(n => n.id === connectingNodeId);
            if (source) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.strokeStyle = '#60A5FA'; // Light Blue
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]); // Reset
            }
        }

        // Draw Nodes
        renderNodes.forEach(node => {
            const isSelected = selectedNodeId === node.id;
            const nodeRadius = 35; // Increased from 20 to 35

            // Selection Glow
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 8, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Blue glow
                ctx.fill();

                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // Inner Blue glow
                ctx.fill();
            }

            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);

            // Color Logic: Custom > Active/Passive
            if (customNodeColors[node.id]) {
                ctx.fillStyle = customNodeColors[node.id] || '#EF4444';
            } else {
                ctx.fillStyle = node.properties.isActive ? '#10B981' : '#EF4444';
            }

            ctx.fill();

            // Border Logic
            if (highlightedPath.includes(node.id)) {
                ctx.strokeStyle = '#FCD34D'; // Yellow/Gold
                ctx.lineWidth = 4;
            } else if (isSelected) {
                ctx.strokeStyle = '#FFFFFF'; // White border for selection
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#1F2937'; // Dark border normal
                ctx.lineWidth = 2;
            }

            ctx.stroke();

            // Draw Label
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.font = isSelected ? 'bold 15px Inter, Arial' : '14px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Simple truncation if too long, though with bigger radius we have more space
            const label = node.label || node.id.substring(0, 4);
            ctx.fillText(label, node.x, node.y);
        });

        // Update parent if we calculated layout positions so state matches visual
        // This is a bit tricky in render loop, but essential for interaction
        if (needsLayout && nodes.length > 0) {
            // Prevent infinite loop by checking if we already dispatched
            // Ideally parent handles this layout init
        }

    }, [nodes, edges, width, height, customNodeColors, highlightedPath, selectedNodeId, isConnecting, connectingNodeId, mousePos]);

    return (
        <div className="border border-gray-700 rounded-lg overflow-auto bg-gray-900 shadow-xl relative custom-scrollbar">
            <div className="absolute top-2 left-2 text-xs text-gray-500 pointer-events-none select-none z-10 bg-gray-900/50 px-2 py-1 rounded-md">
                Shift + Drag: Bağlantı Oluştur | Çift Tıkla: Node Ekle
            </div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={`block ${isConnecting ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            />
        </div>
    );
};

export default GraphCanvas;
