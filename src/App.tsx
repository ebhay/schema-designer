import { useState } from 'react';
import Canvas from './Components/Canvas';
import Header from './Components/Header';

function App() {
  const [selectedProject, setSelectedProject] = useState<string>("Untitled Project");
  
  return (
    <div>
      <Header setSelectedProject={setSelectedProject} />
      <Canvas selectedProject={selectedProject} setSelectedProject={setSelectedProject} />
    </div>
  )
}

export default App
