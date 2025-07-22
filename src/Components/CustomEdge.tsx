import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { EdgeData } from '@/lib/types';
import { useState } from 'react';

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    selected
}: EdgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY
    });

    const handleLabelClick = () => {
        window.dispatchEvent(
            new CustomEvent('edit-relationship', {
                detail: { edgeId: id }
            })
        );
    };

    const edgeData = data as EdgeData;
    const relationship = edgeData?.relationship || '1:1';
    const relationshipName = edgeData?.relationshipName || 'unnamed_relation';

    // Dynamic styling based on state
    const getEdgeColor = () => {
        if (selected) return '#3b82f6'; // Blue when selected
        if (isHovered) return '#6366f1'; // Purple when hovered
        return '#000000'; // Black by default
    };

    const getStrokeWidth = () => {
        if (selected || isHovered) return 3;
        return 2;
    };

    const getMarkerEnd = () => {
        if (selected) return 'url(#arrow-selected)';
        if (isHovered) return 'url(#arrow-hover)';
        return 'url(#arrow-default)';
    };

    return (
        <>
            <BaseEdge 
                path={edgePath} 
                markerEnd={getMarkerEnd()}
                style={{
                    strokeWidth: getStrokeWidth(),
                    stroke: getEdgeColor(),
                    strokeDasharray: selected ? '5,5' : 'none',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />

            <EdgeLabelRenderer>
                {/* Relationship Type and Name Label */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all'
                    }}
                >
                    <div
                        onClick={handleLabelClick}
                        style={{
                            background: selected ? '#dbeafe' : 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: `2px solid ${getEdgeColor()}`,
                            boxShadow: selected ? '0 4px 8px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.2s ease',
                            transform: selected ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div style={{ color: getEdgeColor(), fontWeight: 600 }}>
                            {relationship}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>
                            {relationshipName}
                        </div>
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
