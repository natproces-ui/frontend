// BPMNViewer.tsx
'use client';

import { useEffect, useRef, useState } from "react";

interface BPMNViewerProps {
    xml: string;
    height?: string;
    onClose?: () => void;
    onError?: (error: string) => void;
}

declare global {
    interface Window {
        BpmnJS: any;
    }
}

export default function BPMNViewer({ xml, height = '600px', onClose, onError }: BPMNViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Charger le script bpmn-js
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.BpmnJS && !scriptLoaded) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/bpmn-js@17.11.1/dist/bpmn-viewer.development.js';
            script.async = true;

            script.onload = () => {
                setScriptLoaded(true);
            };

            script.onerror = () => {
                onError?.("Impossible de charger la bibliothèque BPMN");
                setLoading(false);
            };

            document.body.appendChild(script);
        } else if (window.BpmnJS) {
            setScriptLoaded(true);
        }
    }, [scriptLoaded, onError]);

    // Initialiser le viewer
    useEffect(() => {
        if (scriptLoaded && containerRef.current && !viewerRef.current) {
            try {
                viewerRef.current = new window.BpmnJS({
                    container: containerRef.current,
                    height: height
                });
                setLoading(false);
            } catch (error) {
                console.error('Erreur initialisation viewer:', error);
                onError?.("Erreur lors de l'initialisation du viewer");
                setLoading(false);
            }
        }
    }, [scriptLoaded, height, onError]);

    // Afficher le diagramme
    useEffect(() => {
        if (viewerRef.current && xml && !loading) {
            displayDiagram(xml);
        }
    }, [xml, loading]);

    const displayDiagram = async (xmlContent: string) => {
        if (!viewerRef.current) return;

        try {
            setLoading(true);
            await viewerRef.current.importXML(xmlContent);

            const canvas = viewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');

            setLoading(false);
        } catch (error: any) {
            console.error('Erreur lors du rendu BPMN:', error);
            onError?.(`Erreur lors de l'affichage: ${error.message}`);
            setLoading(false);
        }
    };

    const handleZoomIn = () => {
        if (viewerRef.current) {
            const canvas = viewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() + 0.1);
        }
    };

    const handleZoomOut = () => {
        if (viewerRef.current) {
            const canvas = viewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() - 0.1);
        }
    };

    const handleZoomReset = () => {
        if (viewerRef.current) {
            const canvas = viewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');
        }
    };

    const handleDownloadSVG = async () => {
        if (!viewerRef.current) return;

        try {
            const { svg } = await viewerRef.current.saveSVG();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'process-diagram.svg';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur export SVG:', error);
            onError?.("Erreur lors de l'export SVG");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">📊 Diagramme BPMN</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
                            title="Zoom avant"
                        >
                            🔍+
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
                            title="Zoom arrière"
                        >
                            🔍-
                        </button>
                        <button
                            onClick={handleZoomReset}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
                            title="Réinitialiser le zoom"
                        >
                            ↺
                        </button>
                        <button
                            onClick={handleDownloadSVG}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                            title="Exporter en SVG"
                        >
                            💾 SVG
                        </button>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        title="Fermer"
                    >
                        ✕
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex items-center justify-center" style={{ height }}>
                    <div className="text-gray-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p>Chargement du diagramme...</p>
                    </div>
                </div>
            )}

            <div
                ref={containerRef}
                className={`border border-gray-300 rounded ${loading ? 'hidden' : ''}`}
                style={{ height }}
            />
        </div>
    );
}