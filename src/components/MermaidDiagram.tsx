'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#a855f7',
    primaryTextColor: '#fff',
    primaryBorderColor: '#7c3aed',
    lineColor: '#6366f1',
    secondaryColor: '#1e1b4b',
    tertiaryColor: '#312e81',
    background: '#0f0a1e',
    mainBkg: '#1e1b4b',
    nodeBorder: '#7c3aed',
    clusterBkg: '#1e1b4b',
    titleColor: '#e9d5ff',
    edgeLabelBackground: '#1e1b4b',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
  },
});

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch(console.error);
    }
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-container bg-black/20 rounded-lg p-4 overflow-x-auto ${className}`}
    />
  );
}
