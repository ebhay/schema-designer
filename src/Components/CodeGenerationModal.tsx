import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, Copy, Download, RefreshCw } from 'lucide-react';
import { aiService, type DatabaseType, type CodeGenerationRequest } from '@/lib/aiService';

type Props = {
    open: boolean;
    onClose: () => void;
    schema: any[];
    edges: any[];
};

const databaseOptions: { value: DatabaseType; label: string; description: string }[] = [
    { value: 'sql', label: 'Standard SQL', description: 'Generic SQL compatible with most databases' },
    { value: 'mysql', label: 'MySQL', description: 'MySQL-specific syntax and features' },
    { value: 'postgresql', label: 'PostgreSQL', description: 'PostgreSQL-specific syntax and features' },
    { value: 'mongodb', label: 'MongoDB', description: 'MongoDB collections and validation schemas' },
    { value: 'sqlite', label: 'SQLite', description: 'SQLite-compatible lightweight database' },
    { value: 'mariadb', label: 'MariaDB', description: 'MariaDB-specific optimizations' },
    { value: 'oracle', label: 'Oracle', description: 'Oracle Database enterprise features' },
    { value: 'mssql', label: 'SQL Server', description: 'Microsoft SQL Server T-SQL syntax' },
];

export function CodeGenerationModal({ open, onClose, schema, edges }: Props) {
    const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>('sql');
    const [customPrompt, setCustomPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const handleGenerate = async () => {
        if (!aiService.isConfigured()) {
            setError('AI service is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
            return;
        }

        if (schema.length === 0) {
            setError('No tables found in schema. Please add some tables first.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedCode('');

        try {
            const request: CodeGenerationRequest = {
                databaseType: selectedDatabase,
                schema,
                edges,
                customPrompt: customPrompt.trim() || undefined
            };

            const response = await aiService.generateCode(request);

            if (response.success) {
                setGeneratedCode(response.code);
            } else {
                setError(response.error || 'Failed to generate code');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const handleDownload = () => {
        const extension = selectedDatabase === 'mongodb' ? 'js' : 'sql';
        const blob = new Blob([generatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema_${selectedDatabase}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setGeneratedCode('');
        setError(null);
        setCustomPrompt('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        AI Code Generator
                        {!aiService.isConfigured() && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                API Key Required
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6">
                    {/* API Configuration Warning */}
                    {!aiService.isConfigured() && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                            <div className="text-orange-800 text-sm font-medium">Setup Required</div>
                            <div className="text-orange-700 text-sm mt-1">
                                To use AI code generation, please set your Gemini API key in the <code>.env</code> file:
                            </div>
                            <pre className="text-xs bg-orange-100 p-2 rounded mt-2 text-orange-900">
                                VITE_GEMINI_API_KEY=your_api_key_here
                            </pre>
                            <div className="text-orange-700 text-xs mt-2">
                                Get your free API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                            </div>
                        </div>
                    )}
                    {/* Database Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Select Database Type</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {databaseOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-400 ${
                                        selectedDatabase === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                    }`}
                                    onClick={() => setSelectedDatabase(option.value)}
                                >
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="p-0 h-auto font-medium text-sm"
                        >
                            {showAdvancedOptions ? '▼' : '▶'} Advanced Options
                        </Button>

                        {showAdvancedOptions && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Custom Requirements</Label>
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Add any specific requirements, optimizations, or constraints you need..."
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        rows={3}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Example: "Add indexes for frequently queried fields", "Use specific naming conventions", etc.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schema Summary */}
                    <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Schema Summary</div>
                        <div className="text-xs text-gray-600">
                            {schema.length} table{schema.length !== 1 ? 's' : ''}, {edges.length} relationship{edges.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || schema.length === 0 || !aiService.isConfigured()}
                            className="flex-1"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : !aiService.isConfigured() ? (
                                'API Key Required'
                            ) : schema.length === 0 ? (
                                'No Tables Available'
                            ) : (
                                'Generate Code'
                            )}
                        </Button>
                        {generatedCode && (
                            <Button variant="outline" onClick={handleReset}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="text-red-800 text-sm font-medium">Error</div>
                            <div className="text-red-700 text-sm mt-1">{error}</div>
                        </div>
                    )}

                    {/* Generated Code Display */}
                    {generatedCode && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">Generated Code</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleCopy}>
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleDownload}>
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                                <code>{generatedCode}</code>
                            </pre>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
