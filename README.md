# 🗃️ Schema Designer

A modern, interactive database schema design tool built with React, TypeScript, and React Flow. Design, visualize, and export database schemas with an intuitive drag-and-drop interface.

![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![React Flow](https://img.shields.io/badge/React%20Flow-12.8.1-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-blue)
<img width="1909" height="894" alt="image" src="https://github.com/user-attachments/assets/03ba33fd-4ade-43cf-9b71-5e51554aefda" />

## ✨ Features

- **🎨 Visual Schema Design** - Interactive drag-and-drop canvas with real-time connections
- **🔧 Smart Table Management** - 12+ field types, constraints, and dynamic editing
- **🔗 Relationship Management** - Visual connections with 1:1, 1:N, and N:N support
- **💾 Export Options** - SQL generation, JSON schema, and AI code generation
- **⌨️ Keyboard Shortcuts** - Efficient workflow with hotkeys
- **🗺️ MiniMap** - Navigate large schemas easily
- **🌙 Dark Mode** - Modern glass morphism UI

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/ebhay/schema-designer.git
cd schema-designer
npm install

# Start development
npm run dev

# Open http://localhost:5173
```

## 📖 Usage

### Basic Workflow
1. **Add Tables** - Click "Add Table" or `Ctrl+N`
2. **Edit Fields** - Click "+" to add fields, configure types and constraints
3. **Create Relationships** - Drag between field handles to connect tables
4. **Export** - Use `Ctrl+E` for JSON or generate SQL

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+N` | Add table |
| `Ctrl+E` | Export schema |
| `Ctrl+G` | AI code generation |
| `Ctrl+M` | Toggle minimap |

### Supported Field Types
INTEGER, STRING, VARCHAR, TEXT, BOOLEAN, DATE, DATETIME, FLOAT, DECIMAL, JSON, UUID, ENUM

## 🛠️ Tech Stack

- **React 19.1.0** + **TypeScript 5.8.3** - Core framework
- **React Flow 12.8.1** - Node-based UI
- **Tailwind CSS 4.1.11** - Styling
- **Zustand 5.0.6** - State management
- **Vite 7.0.4** - Build tool

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable components
│   ├── Canvas.tsx          # Main canvas
│   ├── CustomNode.tsx      # Table nodes
│   └── CustomEdge.tsx      # Relationships
├── lib/
│   ├── types.ts           # Type definitions
│   ├── utils.ts           # Utilities
│   └── aiService.ts       # AI integration
└── assets/                # Static files
```

## ⚙️ Configuration

Create `.env.local` for AI features:
```env
VITE_AI_API_KEY=your_ai_api_key_here
VITE_API_BASE_URL=https://your-api-endpoint.com
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Code linting
```

## 🗺️ Roadmap

- [ ] Database connection and reverse engineering
- [ ] GraphQL and Prisma schema export
- [ ] Real-time collaboration
- [ ] Schema templates

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

⭐ **Star this repo if you find it helpful!**
