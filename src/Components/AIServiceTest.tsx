// Test component for AI Service - can be removed in production
import { useState } from 'react';
import { aiService } from '@/lib/aiService';

export function AIServiceTest() {
    const [result, setResult] = useState<string>('');
    
    const testAPI = async () => {
        const testSchema = [
            {
                id: 'test1',
                tableName: 'users',
                fields: [
                    { id: 'f1', name: 'id', type: 'INTEGER', isPrimary: true },
                    { id: 'f2', name: 'email', type: 'VARCHAR', length: 255, isUnique: true },
                    { id: 'f3', name: 'name', type: 'VARCHAR', length: 100, isRequired: true }
                ]
            }
        ];
        
        const response = await aiService.generateCode({
            databaseType: 'mysql',
            schema: testSchema,
            edges: []
        });
        
        setResult(JSON.stringify(response, null, 2));
    };
    
    return (
        <div style={{ padding: '20px', position: 'fixed', top: '10px', right: '10px', background: 'white', border: '1px solid #ccc', zIndex: 9999 }}>
            <h4>AI Service Test</h4>
            <button onClick={testAPI}>Test Gemini API</button>
            <div>Configured: {aiService.isConfigured() ? 'Yes' : 'No'}</div>
            {result && (
                <pre style={{ fontSize: '10px', maxWidth: '300px', overflow: 'auto' }}>
                    {result}
                </pre>
            )}
        </div>
    );
}
