import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useReactFlow } from '@xyflow/react';
import type { RelationshipType, TableNodeData, EdgeData } from '@/lib/types';

type Props = {
    open: boolean;
    edgeId: string | null;
    onClose: () => void;
    onSelect?: (type: RelationshipType) => void; // Optional, for flexibility
};

const relationshipOptions: RelationshipType[] = ['1:1', '1:N', 'N:N'];

export function RelationshipModal({ open, edgeId, onClose, onSelect }: Props) {
    const [selected, setSelected] = useState<RelationshipType>('1:1');
    const [relationshipName, setRelationshipName] = useState<string>('');
    const { setEdges, getEdges, setNodes, getNodes } = useReactFlow();

    // Prefill current relationship on open
    useEffect(() => {
        if (!edgeId) return;

        const edge = getEdges().find((e) => e.id === edgeId);
        if (edge && edge.data) {
            const edgeData = edge.data as EdgeData;
            if (edgeData.relationship) {
                setSelected(edgeData.relationship);
            }
            if (edgeData.relationshipName) {
                setRelationshipName(edgeData.relationshipName);
            } else {
                // Generate default name based on source and target tables
                const sourceNode = getNodes().find(n => n.id === edge.source);
                const targetNode = getNodes().find(n => n.id === edge.target);
                if (sourceNode && targetNode) {
                    const sourceName = (sourceNode.data as TableNodeData).tableName || 'table1';
                    const targetName = (targetNode.data as TableNodeData).tableName || 'table2';
                    setRelationshipName(`${sourceName}_${targetName}`);
                }
            }
        }
    }, [edgeId, getEdges, getNodes]);

    const handleSave = () => {
        if (!edgeId) return;

        // Update edge's relationship label and name
        setEdges((edges) =>
            edges.map((edge) =>
                edge.id === edgeId
                    ? {
                        ...edge,
                        data: {
                            ...(edge.data || {}),
                            relationship: selected,
                            relationshipName: relationshipName.trim() || 'unnamed_relation',
                        } as EdgeData,
                    }
                    : edge
            )
        );

        // Update target field in node
        const edge = getEdges().find((e) => e.id === edgeId);
        if (
            !edge ||
            !edge.source ||
            !edge.target ||
            !edge.sourceHandle ||
            !edge.targetHandle
        )
            return;

        const sourceFieldId = edge.sourceHandle.replace('-out', '');
        const targetFieldId = edge.targetHandle.replace('-in', '');

        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id !== edge.target) return node;

                const nodeData = node.data as TableNodeData;

                const updatedFields = nodeData.fields.map((field) =>
                    field.id === targetFieldId
                        ? {
                            ...field,
                            isForeign: true,
                            relationType: selected,
                            foreignRef: {
                                nodeId: edge.source,
                                fieldId: sourceFieldId,
                            },
                        }
                        : field
                );

                return {
                    ...node,
                    data: {
                        ...node.data,
                        fields: updatedFields,
                    },
                };
            })
        );

        // Optionally notify Canvas
        onSelect?.(selected);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="space-y-4">
                <DialogHeader>
                    <DialogTitle>Edit Relationship</DialogTitle>
                </DialogHeader>

                {/* Relationship Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Relationship Name</label>
                    <input
                        type="text"
                        value={relationshipName}
                        onChange={(e) => setRelationshipName(e.target.value)}
                        placeholder="e.g., users_orders"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                        Default format: table1_table2
                    </p>
                </div>

                {/* Relationship Type Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Relationship Type</label>
                    <div className="flex justify-around items-center gap-4">
                        {relationshipOptions.map((option) => (
                            <Button
                                key={option}
                                variant={selected === option ? 'default' : 'outline'}
                                onClick={() => setSelected(option)}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
