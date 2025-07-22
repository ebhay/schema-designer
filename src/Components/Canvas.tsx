import {
    addEdge,
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';

import { Button } from "./ui/button";
import { Code, FileJson, Plus, Redo2, Undo2, X, Map, HelpCircle, Info } from "lucide-react";
import type { TableNodeData, EdgeData } from "@/lib/types";
import { nanoid } from "nanoid";
import { CustomNode } from "./CustomNode";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { CustomEdge } from "./CustomEdge";
import { RelationshipModal } from "./RelationshipModal";
import { CodeGenerationModal } from "./CodeGenerationModal";

type CanvasProps = {
    selectedProject: string;
    setSelectedProject: React.Dispatch<SetStateAction<string>>;
};

const nodeTypes = {
    'custom': CustomNode
};

const edgeTypes = {
    'custom-edge': CustomEdge
};

const initialNodes: Node<TableNodeData>[] = [];
const initialEdges: Edge[] = [];

const Canvas = ({ selectedProject, setSelectedProject }: CanvasProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [tempProjectName, setTempProjectName] = useState(selectedProject);
    const [isEditingProjectName, setIsEditingProjectName] = useState(false);
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

    const [generatedCode, setGeneratedCode] = useState("");
    const [showCodePanel, setShowCodePanel] = useState(false);
    const [showCodeGenerationModal, setShowCodeGenerationModal] = useState(false);
    const [showMiniMap, setShowMiniMap] = useState(true);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [showMiniMapInfo, setShowMiniMapInfo] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setEditingEdgeId(e.detail.edgeId);
        };
        const tableNameHandler = (e: CustomEvent) => {
            updateRelationshipNamesOnTableChange(e.detail.nodeId, e.detail.newTableName);
        };
        
        // Keyboard shortcuts
        const keyboardHandler = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        addTable();
                        break;
                    case 'e':
                        e.preventDefault();
                        exportJSON();
                        break;
                    case 'g':
                        e.preventDefault();
                        handleGenerateCode();
                        break;
                    case 'm':
                        e.preventDefault();
                        setShowMiniMap(!showMiniMap);
                        break;
                }
            }
        };
        
        window.addEventListener("edit-relationship", handler as EventListener);
        window.addEventListener("table-name-changed", tableNameHandler as EventListener);
        window.addEventListener("keydown", keyboardHandler);
        
        return () => {
            window.removeEventListener("edit-relationship", handler as EventListener);
            window.removeEventListener("table-name-changed", tableNameHandler as EventListener);
            window.removeEventListener("keydown", keyboardHandler);
        };
    }, [showMiniMap]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const json = JSON.parse(text);

                // Support both new and old formats
                if (!Array.isArray(json.schema) || !Array.isArray(json.edges)) {
                    throw new Error("Invalid schema format");
                }

                const importedNodes: Node<TableNodeData>[] = json.schema.map((table: any) => ({
                    id: table.id,
                    type: "custom",
                    position: table.position || { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
                    data: {
                        tableName: table.tableName,
                        fields: (table.fields || []).map((field: any) => ({
                            id: field.id,
                            name: field.name,
                            type: field.type,
                            length: field.length || undefined,
                            isPrimary: field.isPrimary || false,
                            isRequired: field.isRequired || false,
                            isUnique: field.isUnique || false,
                            isForeign: field.isForeign || false,
                            foreignRef: field.foreignRef || undefined,
                            relationType: field.relationType || undefined,
                        })),
                        primaryKeys: table.primaryKeys || [],
                    },
                }));

                const importedEdges: Edge[] = json.edges.map((edge: any) => ({
                    id: edge.id || nanoid(),
                    type: edge.type || "custom-edge",
                    source: edge.source,
                    sourceHandle: edge.sourceHandle,
                    target: edge.target,
                    targetHandle: edge.targetHandle,
                    data: {
                        relationship: edge.data?.relationship || "1:1",
                        relationshipName: edge.data?.relationshipName || "unnamed_relation"
                    } as EdgeData
                }));

                setNodes(importedNodes);
                setEdges(importedEdges);

                // Update project name if available in metadata
                if (json.metadata?.projectName) {
                    setSelectedProject(json.metadata.projectName);
                }
            } catch (err) {
                alert("Failed to import schema: " + (err as Error).message);
            }
        };

        reader.readAsText(file);
    };


    const onConnect = (params: Connection) => {
        const { source, target, sourceHandle, targetHandle } = params;
        if (!source && !target && !sourceHandle && !targetHandle) return;

        // Get table names for default relationship name
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);
        const sourceName = sourceNode?.data?.tableName || 'table1';
        const targetName = targetNode?.data?.tableName || 'table2';
        const defaultRelationshipName = `${sourceName}_${targetName}`;

        setEdges((eds) => addEdge({
            ...params,
            type: "custom-edge",
            data: { 
                relationship: '1:1',
                relationshipName: defaultRelationshipName
            } as EdgeData
        }, eds));

        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id !== target) return node;
                const updatedFields = node.data.fields.map((field) =>
                    `${field.id}-in` === targetHandle
                        ? {
                            ...field,
                            isForeign: true,
                            foreignRef: {
                                nodeId: source,
                                fieldId: sourceHandle!.replace("-out", ""),
                            },
                        }
                        : field
                );
                return {
                    ...node,
                    data: { ...node.data, fields: updatedFields }
                };
            })
        );
    };

    const updateRelationshipNamesOnTableChange = (nodeId: string, newTableName: string) => {
        setEdges((edges) =>
            edges.map((edge) => {
                const edgeData = edge.data as EdgeData;
                if (edge.source === nodeId || edge.target === nodeId) {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    
                    const sourceName = edge.source === nodeId ? newTableName : (sourceNode?.data?.tableName || 'table1');
                    const targetName = edge.target === nodeId ? newTableName : (targetNode?.data?.tableName || 'table2');
                    
                    return {
                        ...edge,
                        data: {
                            ...edgeData,
                            relationshipName: `${sourceName}_${targetName}`
                        } as EdgeData
                    };
                }
                return edge;
            })
        );
    };

    const addTable = () => {
        const newNode: Node<TableNodeData> = {
            id: nanoid(),
            type: "custom",
            position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
            data: {
                tableName: "New Table",
                fields: [],
            }
        };
        setNodes(prev => [...prev, newNode]);
    };

    const exportJSON = () => {
        const schema = nodes.map((node) => ({
            id: node.id,
            position: node.position,
            tableName: node.data.tableName,
            fields: node.data.fields.map((field) => ({
                id: field.id,
                name: field.name,
                type: field.type,
                length: field.length || null,
                isPrimary: field.isPrimary || false,
                isRequired: field.isRequired || false,
                isUnique: field.isUnique || false,
                isForeign: field.isForeign || false,
                foreignRef: field.foreignRef || null,
                relationType: field.relationType || null,
            })),
            primaryKeys: node.data.primaryKeys || [],
        }));

        // Enhanced edges export with relationship names
        const enhancedEdges = edges.map((edge) => ({
            id: edge.id,
            type: edge.type || "custom-edge",
            source: edge.source,
            sourceHandle: edge.sourceHandle,
            target: edge.target,
            targetHandle: edge.targetHandle,
            data: {
                relationship: (edge.data as EdgeData)?.relationship || "1:1",
                relationshipName: (edge.data as EdgeData)?.relationshipName || "unnamed_relation"
            }
        }));

        const exportData = {
            schema,
            edges: enhancedEdges,
            version: "1.1.0",
            metadata: {
                exportedAt: new Date().toISOString(),
                projectName: selectedProject
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedProject.replace(/[^a-zA-Z0-9]/g, '_')}_schema.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getTableNameById = (nodeId: string): string => {
        const table = nodes.find(n => n.id === nodeId);
        return table?.data?.tableName || 'UNKNOWN_TABLE';
    };

    const getFieldNameById = (ref: { nodeId: string, fieldId: string }): string => {
        const node = nodes.find(n => n.id === ref.nodeId);
        const field = node?.data.fields.find(f => f.id === ref.fieldId);
        return field?.name || 'UNKNOWN_FIELD';
    };

    const handleGenerateCode = () => {
        setShowCodeGenerationModal(true);
    };

    const generateLegacySQLCode = () => {
        const code = nodes.map((node) => {
            const lines: string[] = [];
            const fkConstraints: string[] = [];
            const primaryKeyFields: string[] = [];

            node.data.fields.forEach((field) => {
                let fieldDefinition = `${field.name} ${field.type.toUpperCase()}`;
                
                // Add length for VARCHAR fields
                if (field.type === 'VARCHAR' && field.length) {
                    fieldDefinition += `(${field.length})`;
                }
                
                const parts = [fieldDefinition];

                if (field.isRequired) parts.push('NOT NULL');
                if (field.isUnique) parts.push('UNIQUE');
                
                // Collect primary key fields
                if (field.isPrimary) {
                    primaryKeyFields.push(field.name);
                }

                lines.push('  ' + parts.join(' '));

                if (field.isForeign && field.foreignRef) {
                    fkConstraints.push(
                        `  FOREIGN KEY (${field.name}) REFERENCES ${getTableNameById(field.foreignRef.nodeId)}(${getFieldNameById(field.foreignRef)})`
                    );
                }
            });

            // Add primary key constraint
            if (primaryKeyFields.length > 0) {
                lines.push(`  PRIMARY KEY (${primaryKeyFields.join(', ')})`);
            }

            const allLines = [...lines, ...fkConstraints];
            return `CREATE TABLE ${node.data.tableName} (\n${allLines.join(',\n')}\n);`;
        }).join("\n\n");

        setGeneratedCode(code);
        setShowCodePanel(true);
    };

    return (
        <div className="flex h-[calc(100vh-56px)] overflow-hidden">
            <div className="flex flex-col flex-1 transition-all duration-300">
                <div className="flex justify-between items-center px-8 py-2 border-b border-gray-300 bg-white z-10">
                    <div className="flex items-center gap-3">
                        {isEditingProjectName ? (
                            <input
                                value={tempProjectName}
                                onChange={(e) => setTempProjectName(e.target.value)}
                                onBlur={() => {
                                    setSelectedProject(tempProjectName.trim() || "Untitled Project");
                                    setIsEditingProjectName(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setSelectedProject(tempProjectName.trim() || "Untitled Project");
                                        setIsEditingProjectName(false);
                                    } else if (e.key === "Escape") {
                                        setTempProjectName(selectedProject);
                                        setIsEditingProjectName(false);
                                    }
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        ) : (
                            <span
                                className="text-lg font-medium truncate max-w-[300px] cursor-pointer"
                                onClick={() => {
                                    setTempProjectName(selectedProject);
                                    setIsEditingProjectName(true);
                                }}
                            >
                                {selectedProject}
                            </span>
                        )}

                        <div className="flex items-center gap-1">
                            <Button variant="outline"><Undo2 /></Button>
                            <Button variant="outline"><Redo2 /></Button>
                            <Button 
                                variant={showMiniMap ? "default" : "outline"} 
                                size="icon"
                                onClick={() => setShowMiniMap(!showMiniMap)}
                                title="Toggle MiniMap (Ctrl+M)"
                            >
                                <Map className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setShowKeyboardHelp(true)}
                                title="Keyboard Shortcuts"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={addTable} title="Add Table (Ctrl+N)">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Table
                        </Button>

                        <Button variant="outline" onClick={handleImportClick}>
                            <FileJson className="w-4 h-4 mr-1" />
                            Import JSON
                        </Button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />

                        <Button variant="outline" onClick={exportJSON} title="Export JSON (Ctrl+E)">
                            <FileJson className="w-4 h-4 mr-1" />
                            Export JSON
                        </Button>

                        <Button onClick={handleGenerateCode} title="AI Generate Code (Ctrl+G)">
                            <Code className="w-4 h-4 mr-1" />
                            AI Generate Code
                        </Button>

                        <Button variant="outline" onClick={generateLegacySQLCode}>
                            <Code className="w-4 h-4 mr-1" />
                            Quick SQL
                        </Button>
                    </div>
                </div>

                <div className="flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        snapToGrid
                        snapGrid={[20, 20]}
                        zoomOnDoubleClick={false}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                    >
                        {/* Global SVG definitions for arrows */}
                        <svg>
                            <defs>
                                <marker
                                    id="arrow-default"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                    markerUnits="strokeWidth"
                                    viewBox="0 0 10 6"
                                >
                                    <path
                                        d="M0,0 L0,6 L9,3 z"
                                        fill="#000000"
                                        stroke="#000000"
                                        strokeWidth="1"
                                    />
                                </marker>
                                <marker
                                    id="arrow-selected"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                    markerUnits="strokeWidth"
                                    viewBox="0 0 10 6"
                                >
                                    <path
                                        d="M0,0 L0,6 L9,3 z"
                                        fill="#3b82f6"
                                        stroke="#3b82f6"
                                        strokeWidth="1"
                                    />
                                </marker>
                                <marker
                                    id="arrow-hover"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                    markerUnits="strokeWidth"
                                    viewBox="0 0 10 6"
                                >
                                    <path
                                        d="M0,0 L0,6 L9,3 z"
                                        fill="#6366f1"
                                        stroke="#6366f1"
                                        strokeWidth="1"
                                    />
                                </marker>
                            </defs>
                        </svg>

                        {showMiniMap && (
                            <>
                                <MiniMap 
                                    nodeColor={(node) => {
                                        const nodeData = node.data as TableNodeData;
                                        const fieldCount = nodeData.fields?.length || 0;
                                        // Color coding based on table complexity
                                        if (fieldCount > 10) return '#ef4444'; // Red for complex tables
                                        if (fieldCount > 5) return '#f59e0b'; // Orange for medium tables
                                        return '#3b82f6'; // Blue for simple tables
                                    }}
                                    nodeStrokeColor="#ffffff"
                                    nodeStrokeWidth={2}
                                    nodeBorderRadius={4}
                                    maskColor="rgba(0, 0, 0, 0.2)"
                                    position="bottom-right"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}
                                    pannable
                                    zoomable
                                    ariaLabel="Schema overview minimap"
                                />
                                
                                {/* MiniMap Info Icon */}
                                <button
                                    onClick={() => setShowMiniMapInfo(!showMiniMapInfo)}
                                    className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50 z-20"
                                    title="MiniMap Info"
                                >
                                    <Info className="w-4 h-4 text-gray-600" />
                                </button>
                                
                                {/* MiniMap Legend - Only show when info is clicked */}
                                {showMiniMapInfo && (
                                    <div className="absolute bottom-16 right-4 bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg z-20">
                                        <div className="font-medium mb-2">Table Complexity</div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                                <span>Simple (≤5 fields)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                                <span>Medium (6-10 fields)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                                <span>Complex ({'>'}10 fields)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <Controls 
                            position="bottom-left"
                            showZoom={true}
                            showFitView={true}
                            showInteractive={true}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}
                        />
                        <Background 
                            gap={20} 
                            size={1} 
                            color="#e5e7eb"
                        />
                    </ReactFlow>
                </div>
            </div>

            {showCodePanel && (
                <div className="w-[40%] max-w-[600px] border-l border-gray-300 bg-gray-50 p-4 overflow-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-md font-semibold">Generated Code</h2>
                        <Button variant="ghost" size="icon" onClick={() => setShowCodePanel(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <pre className="bg-white p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                        <code>{generatedCode}</code>
                    </pre>
                </div>
            )}

            {editingEdgeId && (
                <RelationshipModal
                    open={true}
                    edgeId={editingEdgeId}
                    onClose={() => setEditingEdgeId(null)}
                    onSelect={(type) => {
                        setEdges((edges) =>
                            edges.map((edge) =>
                                edge.id === editingEdgeId
                                    ? { 
                                        ...edge, 
                                        data: { 
                                            ...(edge.data as EdgeData), 
                                            relationship: type 
                                        } as EdgeData 
                                    }
                                    : edge
                            )
                        );
                        setEditingEdgeId(null);
                    }}
                />
            )}

            {showCodeGenerationModal && (
                <CodeGenerationModal
                    open={showCodeGenerationModal}
                    onClose={() => setShowCodeGenerationModal(false)}
                    schema={nodes.map(node => ({
                        id: node.id,
                        tableName: node.data.tableName,
                        fields: node.data.fields,
                        primaryKeys: node.data.primaryKeys || []
                    }))}
                    edges={edges.map(edge => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        sourceHandle: edge.sourceHandle,
                        targetHandle: edge.targetHandle,
                        data: edge.data as EdgeData
                    }))}
                />
            )}

            {/* Keyboard Shortcuts Help Modal */}
            {showKeyboardHelp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowKeyboardHelp(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Add Table</span>
                                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Export Schema</span>
                                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+E</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Generate Code</span>
                                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+G</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Toggle MiniMap</span>
                                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+M</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Canvas;
