"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const nodeRadius = useMemo(() => {
        const count = nodes.length;
        if (count > 120) return 14;
        if (count > 80) return 18;
        if (count > 50) return 22;
        if (count > 30) return 28;
        return 34;
    }, [nodes.length]);

    const [isConnecting, setIsConnecting] = useState(false);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
    }, []);

    const { laidOutNodes, canvasWidth, canvasHeight } = useMemo(() => {
        const needsLayout = nodes.every(n => (n.x === 0 || n.x === undefined) && (n.y === 0 || n.y === undefined)) && nodes.length > 0;

        const basePositioned = needsLayout
            ? nodes.map((node, index) => {
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(centerX, centerY) * 0.8;
                const angleStep = (2 * Math.PI) / nodes.length;
                return {
                    ...node,
                    x: centerX + radius * Math.cos(index * angleStep),
                    y: centerY + radius * Math.sin(index * angleStep)
                };
            })
            : nodes.map((node) => ({
                ...node,
                x: node.x ?? width / 2,
                y: node.y ?? height / 2
            }));

        let maxX = 0, maxY = 0;
        basePositioned.forEach(n => {
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        });

        const padding = nodeRadius + 40;
        const virtualWidth = Math.max(width, maxX + padding);
        const virtualHeight = Math.max(height, maxY + padding);

        return {
            laidOutNodes: basePositioned,
            canvasWidth: virtualWidth,
            canvasHeight: virtualHeight
        };
    }, [nodes, width, height, nodeRadius]);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;
        return {
            x: e.nativeEvent.offsetX * scaleX,
            y: e.nativeEvent.offsetY * scaleY
        };
    };

    const getNodeAtPos = (x: number, y: number) => {
        return laidOutNodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < nodeRadius + 10;
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        const node = getNodeAtPos(x, y);

        if (node) {
            if (e.shiftKey) {
                setIsConnecting(true);
                setConnectingNodeId(node.id);
                setMousePos({ x, y });
            } else {
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
            const clampedX = Math.max(nodeRadius, Math.min(canvasWidth - nodeRadius, x));
            const clampedY = Math.max(nodeRadius, Math.min(canvasHeight - nodeRadius, y));
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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        edges.forEach(edge => {
            const source = laidOutNodes.find(n => n.id === edge.sourceId);
            const target = laidOutNodes.find(n => n.id === edge.targetId);

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
                    ctx.strokeStyle = '#EF4444';
                    ctx.lineWidth = 4;
                } else {
                    ctx.strokeStyle = '#4B5563';
                    ctx.lineWidth = 2;
                }

                ctx.stroke();

                const weight = (edge as any).weight;
                if (weight !== undefined && weight !== null) {
                    const midX = (source.x + target.x) / 2;
                    const midY = (source.y + target.y) / 2;

                    ctx.fillStyle = '#1F2937';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = '#9CA3AF';
                    ctx.font = '10px Inter, Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(weight.toFixed ? weight.toFixed(1) : String(weight), midX, midY);
                }
            }
        });

        if (isConnecting && connectingNodeId) {
            const source = laidOutNodes.find(n => n.id === connectingNodeId);
            if (source) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.strokeStyle = '#60A5FA';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        laidOutNodes.forEach(node => {
            const isSelected = selectedNodeId === node.id;
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);

            if (customNodeColors[node.id]) {
                ctx.fillStyle = customNodeColors[node.id] || '#EF4444';
            } else {
                ctx.fillStyle = node.properties.isActive ? '#10B981' : '#EF4444';
            }

            ctx.fill();

            if (highlightedPath.includes(node.id)) {
                ctx.strokeStyle = '#FCD34D';
                ctx.lineWidth = 4;
            } else if (isSelected) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#1F2937';
                ctx.lineWidth = 2;
            }

            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = isSelected ? 'bold 15px Inter, Arial' : '14px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = node.label || node.id.substring(0, 4);
            ctx.fillText(label, node.x, node.y);
        });

    }, [laidOutNodes, edges, width, height, customNodeColors, highlightedPath, selectedNodeId, isConnecting, connectingNodeId, mousePos]);

    return (
        <div
            ref={wrapperRef}
            className="scroll-container w-full h-full border border-gray-700 rounded-lg overflow-auto bg-gray-900 shadow-xl relative"
        >
            <div className="absolute top-2 left-2 text-xs text-gray-500 pointer-events-none select-none z-10 bg-gray-900/50 px-2 py-1 rounded-md">
                Shift + Drag: Bağlantı Oluştur | Çift Tıkla: Node Ekle
            </div>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
                className={`block ${isConnecting ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            />
            <style jsx>{`
                .scroll-container::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .scroll-container::-webkit-scrollbar-track {
                    background: #0f172a;
                    border-radius: 8px;
                }
                .scroll-container::-webkit-scrollbar-thumb {
                    background: #475569;
                    border-radius: 8px;
                    border: 2px solid #0f172a;
                }
                .scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
                .scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #475569 #0f172a;
                }
            `}</style>
        </div>
    );
};

export default GraphCanvas;
