export type DatabaseType = 'sql' | 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'mariadb' | 'oracle' | 'mssql';

export interface CodeGenerationRequest {
  databaseType: DatabaseType;
  schema: any[];
  edges: any[];
  customPrompt?: string;
}

export interface CodeGenerationResponse {
  success: boolean;
  code: string;
  error?: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY environment variable is not set. AI features will be disabled.');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getSystemPrompt(databaseType: DatabaseType): string {
    const basePrompts = {
      sql: `You are an expert SQL database designer. Generate ONLY clean, well-structured SQL CREATE TABLE statements with proper constraints, indexes, and foreign key relationships. Use standard SQL syntax that works across multiple database systems. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      mysql: `You are an expert MySQL database designer. Generate ONLY MySQL-specific CREATE TABLE statements with proper data types, constraints, indexes, and foreign key relationships. Use MySQL-specific features like AUTO_INCREMENT, ENGINE=InnoDB, and proper charset settings. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      postgresql: `You are an expert PostgreSQL database designer. Generate ONLY PostgreSQL-specific CREATE TABLE statements with proper data types, constraints, indexes, and foreign key relationships. Use PostgreSQL-specific features like SERIAL, UUID types, and proper schema design. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      mongodb: `You are an expert MongoDB database designer. Generate ONLY MongoDB schema design including collection structures, document schemas with proper validation rules, and indexes. Provide ONLY JavaScript code for creating collections and validation schemas. DO NOT include explanations, comments, or any text other than the JavaScript code.`,
      
      sqlite: `You are an expert SQLite database designer. Generate ONLY SQLite-compatible CREATE TABLE statements with proper data types, constraints, and indexes. Keep in mind SQLite's type affinity system and limitations. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      mariadb: `You are an expert MariaDB database designer. Generate ONLY MariaDB-specific CREATE TABLE statements with proper data types, constraints, indexes, and foreign key relationships. Use MariaDB-specific features and optimizations. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      oracle: `You are an expert Oracle database designer. Generate ONLY Oracle-specific CREATE TABLE statements with proper data types, constraints, indexes, and foreign key relationships. Use Oracle-specific features like SEQUENCES, TABLESPACES, and proper naming conventions. DO NOT include explanations, comments, or any text other than the SQL code.`,
      
      mssql: `You are an expert Microsoft SQL Server database designer. Generate ONLY T-SQL CREATE TABLE statements with proper data types, constraints, indexes, and foreign key relationships. Use SQL Server-specific features and best practices. DO NOT include explanations, comments, or any text other than the T-SQL code.`
    };

    return basePrompts[databaseType] || basePrompts.sql;
  }

  private buildPrompt(request: CodeGenerationRequest): string {
    const { databaseType, schema, edges, customPrompt } = request;
    
    const systemPrompt = this.getSystemPrompt(databaseType);
    
    // Build schema description
    const schemaDescription = schema.map(table => {
      const fieldsDesc = table.fields.map((field: any) => {
        const props = [];
        if (field.isPrimary) props.push('PRIMARY KEY');
        if (field.isRequired) props.push('NOT NULL');
        if (field.isUnique) props.push('UNIQUE');
        if (field.isForeign) props.push('FOREIGN KEY');
        if (field.length) props.push(`LENGTH(${field.length})`);
        
        return `  - ${field.name}: ${field.type}${props.length ? ' (' + props.join(', ') + ')' : ''}`;
      }).join('\n');
      
      return `Table: ${table.tableName}\n${fieldsDesc}`;
    }).join('\n\n');

    // Build relationships description
    const relationshipsDescription = edges.map((edge: any) => {
      const sourceTable = schema.find(t => t.id === edge.source)?.tableName || 'unknown';
      const targetTable = schema.find(t => t.id === edge.target)?.tableName || 'unknown';
      const relationshipType = edge.data?.relationship || '1:1';
      const relationshipName = edge.data?.relationshipName || `${sourceTable}_${targetTable}`;
      
      return `Relationship: ${relationshipName} (${sourceTable} -> ${targetTable}, Type: ${relationshipType})`;
    }).join('\n');

    const prompt = `${systemPrompt}

SCHEMA DEFINITION:
${schemaDescription}

RELATIONSHIPS:
${relationshipsDescription}

${customPrompt ? `ADDITIONAL REQUIREMENTS:\n${customPrompt}\n` : ''}

IMPORTANT: Generate ONLY the ${databaseType.toUpperCase()} code. Do not include any explanations, descriptions, or markdown formatting. Start directly with the code.

Requirements:
- All table creation statements
- Proper data types for ${databaseType}
- Primary key constraints
- Foreign key relationships
- Indexes for optimal performance
- ${databaseType}-specific optimizations

Return only executable code without any additional text.`;

    return prompt;
  }

  private cleanCodeResponse(response: string): string {
    // Remove markdown code blocks
    let cleanedCode = response.replace(/```[a-zA-Z]*\n/g, '').replace(/```/g, '');
    
    // Remove common explanatory text patterns
    const patternsToRemove = [
      /^Here's the.*?:\s*/i,
      /^This code.*?:\s*/i,
      /^The following.*?:\s*/i,
      /^Below is.*?:\s*/i,
      /^Here are.*?:\s*/i,
      /^\s*Note:.*$/gm,
      /^\s*Important:.*$/gm,
      /^\s*--.*$/gm, // SQL comments
      /^\s*\/\*.*?\*\//gms, // Multi-line comments
      /^\s*\/\/.*$/gm // Single line comments
    ];
    
    patternsToRemove.forEach(pattern => {
      cleanedCode = cleanedCode.replace(pattern, '');
    });
    
    // Trim whitespace and normalize line endings
    cleanedCode = cleanedCode.trim();
    
    // If the response still has explanatory text at the beginning, try to extract just the code
    const lines = cleanedCode.split('\n');
    let codeStartIndex = 0;
    
    // Find where the actual code starts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      if (line.startsWith('create table') || 
          line.startsWith('create index') ||
          line.startsWith('alter table') ||
          line.startsWith('use ') ||
          line.startsWith('db.') || // MongoDB
          line.includes('collection') ||
          line.startsWith('drop table') ||
          line.startsWith('insert into')) {
        codeStartIndex = i;
        break;
      }
    }
    
    if (codeStartIndex > 0) {
      cleanedCode = lines.slice(codeStartIndex).join('\n');
    }
    
    return cleanedCode.trim();
  }

  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        code: '',
        error: 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.'
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const generatedCode = data.candidates[0].content.parts[0].text;
      const cleanedCode = this.cleanCodeResponse(generatedCode);

      return {
        success: true,
        code: cleanedCode
      };

    } catch (error) {
      console.error('AI Code Generation Error:', error);
      return {
        success: false,
        code: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const aiService = new AIService();
