import type { Field, TableNodeData } from "@/lib/types";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Plus, Trash2, Key, ChevronUp, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { nanoid } from "nanoid";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// Ensure your Field type in "@/lib/types" includes these properties:
// export type Field = {
//   id: string;
//   name: string;
//   type: string;
//   isRequired: boolean;
//   isUnique: boolean;
//   isPrimary: boolean;
//   isForeign?: boolean; // Added for relationships
//   relationType?: string; // Added for relationships (e.g., 'one-to-many', 'many-to-one')
//   length?: number; // For VARCHAR
// };
//
// export type TableNodeData = {
//   tableName: string;
//   fields: Field[];
// };

const fieldTypes = [
  "INTEGER",
  "STRING",
  "TEXT",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "FLOAT",
  "DECIMAL",
  "JSON",
  "UUID",
  "ENUM",
  "VARCHAR",
];

type NodeProps = {
  id: string;
  data: TableNodeData;
};

export const CustomNode = ({ id, data }: NodeProps) => {
  const { fields, tableName } = data;
  const { setNodes, deleteElements } = useReactFlow();
  const [isEditingTableName, setIsEditingTableName] = useState<boolean>(false);

  const updateNodeData = (newData: Partial<TableNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const addField = () => {
    const newField: Field = {
      id: nanoid(),
      name: "column_name", // Default name
      type: "INTEGER",
      isRequired: false,
      isUnique: false,
      isPrimary: false,
      isForeign: false, // Default to false
      length: undefined,
    };
    updateNodeData({ fields: [...fields, newField] });
  };

  const updateField = (fieldId: string, changes: Partial<Field>) => {
    const updatedFields = fields.map((field) =>
      field.id === fieldId ? { ...field, ...changes } : field
    );
    updateNodeData({ fields: updatedFields });
  };

  const handleDeleteTable = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleTableNameChange = (name: string) => {
    updateNodeData({ tableName: name });
    // Emit event to update relationship names
    window.dispatchEvent(
      new CustomEvent('table-name-changed', {
        detail: { nodeId: id, newTableName: name }
      })
    );
  };

  return (
    <div className="rounded-md border border-gray-300 bg-white w-[380px] shadow-lg text-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-800 group">
        {isEditingTableName ? (
          <input
            autoFocus
            value={tableName}
            onChange={(e) => handleTableNameChange(e.target.value)}
            onBlur={() => setIsEditingTableName(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditingTableName(false)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <span
            className="truncate max-w-[200px] cursor-pointer"
            onClick={() => setIsEditingTableName(true)}
          >
            {tableName}
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Add Column Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-200 text-gray-700"
            onClick={addField}
            title="Add Column"
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Delete Table Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-red-100 text-gray-700 hover:text-red-600"
            onClick={handleDeleteTable}
            title="Delete Table"
          >
            <Trash2 className="w-5 h-5" />
          </Button>

          {/* Collapse/Expand (optional) */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-200 text-gray-700"
            // onClick={() => toggleCollapse()}
          >
            <ChevronUp className="w-5 h-5" /> {/* Or ChevronDown */}
          </Button>
        </div>
      </div>

      {/* Fields Section */}
      <div className="px-3 py-2 space-y-2 min-h-[120px]" style={{ maxHeight: fields.length > 8 ? '400px' : 'auto', overflowY: fields.length > 8 ? 'auto' : 'visible' }}>
        {fields.map((field) => (
          <div
            key={field.id}
            className="relative flex items-center gap-2 bg-gray-50 rounded-md p-2 group hover:bg-gray-100"
          >
            {/* Target Handle */}
            <Handle
              type="target"
              id={`${field.id}-in`}
              position={Position.Left}
              style={{
                top: "50%",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#3B82F6",
                transform: "translateY(-50%)",
              }}
            />

            {/* Primary Key / Settings Popover Trigger (Now Settings2 icon) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 w-6 h-6">
                  {/* Display PK icon directly if it's a primary key */}
                  {field.isPrimary ? (
                    <div title="Primary Key">
                      <Key className="w-4 h-4 text-blue-500" />
                    </div>
                  ) : (
                    <div title="Field Settings">
                      <Settings2 className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.isRequired}
                      onCheckedChange={(val) => updateField(field.id, { isRequired: !!val })}
                    />
                    <Label htmlFor={`required-${field.id}`}>Required</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`unique-${field.id}`}
                      checked={field.isUnique}
                      onCheckedChange={(val) => updateField(field.id, { isUnique: !!val })}
                    />
                    <Label htmlFor={`unique-${field.id}`}>Unique</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`primary-${field.id}`}
                      checked={field.isPrimary}
                      onCheckedChange={(val) => updateField(field.id, { isPrimary: !!val })}
                    />
                    <Label htmlFor={`primary-${field.id}`}>Primary Key</Label>
                  </div>
                  {/* You could add more attributes here, e.g., default value, comment, etc. */}
                </div>
              </PopoverContent>
            </Popover>

            {/* Field Name Input */}
            <input
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="column_name"
              value={field.name}
              onChange={(e) => updateField(field.id, { name: e.target.value })}
            />

            {/* Badges for PK, FK, Relation Type */}
            <div className="flex gap-1 text-xs font-semibold text-white shrink-0">
              {field.isPrimary && (
                <span title="Primary Key" className="bg-blue-500 px-1 rounded">PK</span>
              )}
              {field.isForeign && (
                <span title="Foreign Key" className="bg-yellow-500 px-1 rounded">FK</span>
              )}
              {field.relationType && (
                <span title={`Relation: ${field.relationType}`} className="bg-green-500 px-1 rounded">
                  {field.relationType.substring(0, 3).toUpperCase()} {/* Display first 3 letters */}
                </span>
              )}
            </div>


            {/* Field Type Select */}
            <select
              value={field.type}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[70px] shrink-0"
              onChange={(e) => {
                const newType = e.target.value;
                updateField(field.id, { type: newType, length: newType !== 'VARCHAR' ? undefined : field.length });
              }}
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </select>

            {/* Conditional Length/Precision Input for VARCHAR */}
            {field.type === "VARCHAR" && (
              <input
                type="number"
                className="border border-gray-300 rounded px-2 py-1 w-[60px] text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0"
                placeholder="len"
                value={field.length || ''}
                onChange={(e) => updateField(field.id, { length: parseInt(e.target.value) || undefined })}
                min="1"
              />
            )}

            {/* Source Handle */}
            <Handle
              type="source"
              id={`${field.id}-out`}
              position={Position.Right}
              style={{
                top: "50%",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#3B82F6",
                transform: "translateY(-50%)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};