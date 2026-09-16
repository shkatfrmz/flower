import React, { useEffect, useRef } from 'react';
import { Graphify } from 'graphify'; // Assuming named export

export default function GraphifyDemo() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Example data, adjust as needed by Graphify API
      const data = {
        nodes: [
          { id: 'A', label: 'Node A' },
          { id: 'B', label: 'Node B' },
          { id: 'C', label: 'Node C' }
        ],
        edges: [
          { source: 'A', target: 'B' },
          { source: 'B', target: 'C' },
          { source: 'C', target: 'A' }
        ]
      };
      // Render Graphify into container
      new Graphify(containerRef.current, data);
    }
  }, []);

  return <div ref={containerRef} className="graphify-container" style={{ width: '100%', height: '400px' }}></div>;
}
