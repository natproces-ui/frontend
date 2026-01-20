// BPMNViewer.tsx - VERSION AVEC EXPORT PNG/SVG + EXPOSED REF
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, Download, FileBarChart, Lock, Unlock, Save, Image as ImageIcon, FileImage } from "lucide-react";
import { BPMN_VIEWER_STYLES } from '@/logic/bpmnStyles';
import { LANE_COLORS } from '@/logic/bpmnConstants';

interface BPMNViewerProps {
    xml: string;
    height?: string;
    onClose?: () => void;
    onError?: (error: string) => void;
    onUpdate?: (updatedXml: string) => void;
    readOnly?: boolean;
}

declare global {
    interface Window {
        BpmnJS: any;
    }
}

// 🆕 Interface pour exposer les méthodes au parent
export interface BPMNViewerHandle {
    getContainerRef: () => HTMLDivElement | null;
}

function useBPMNScript(onError?: (error: string) => void) {
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.BpmnJS) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/bpmn-js@17.11.1/dist/bpmn-modeler.development.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => onError?.("Impossible de charger BPMN.js");
        document.body.appendChild(script);

        return () => script.remove();
    }, [onError]);

    return scriptLoaded;
}

function useConnectionInteractions(viewerRef: React.RefObject<any>, editMode: boolean) {
    useEffect(() => {
        if (!viewerRef.current || !editMode) return;

        try {
            const eventBus = viewerRef.current.get('eventBus');
            const modeling = viewerRef.current.get('modeling');

            const handleConnectionHover = (event: any) => {
                if (event.element && (event.element.type === 'bpmn:SequenceFlow' || event.element.type === 'bpmn:Association')) {
                    const gfx = event.gfx;
                    if (gfx) {
                        gfx.style.cursor = 'pointer';
                        const path = gfx.querySelector('path');
                        if (path) {
                            path.style.strokeWidth = '6px';
                        }
                    }
                }
            };

            const handleConnectionLeave = (event: any) => {
                if (event.element && (event.element.type === 'bpmn:SequenceFlow' || event.element.type === 'bpmn:Association')) {
                    const gfx = event.gfx;
                    if (gfx) {
                        gfx.style.cursor = '';
                        const path = gfx.querySelector('path');
                        if (path) {
                            path.style.strokeWidth = '3px';
                        }
                    }
                }
            };

            const handleDoubleClick = (event: any) => {
                if (event.element.type === 'bpmn:SequenceFlow' || event.element.type === 'bpmn:Association') {
                    event.preventDefault();
                    event.stopPropagation();

                    const connection = event.element;
                    const position = { x: event.x, y: event.y };
                    const waypoints = connection.waypoints;
                    let closestSegment = 0;
                    let minDistance = Infinity;

                    for (let i = 0; i < waypoints.length - 1; i++) {
                        const start = waypoints[i];
                        const end = waypoints[i + 1];
                        const distance = distanceToSegment(position, start, end);

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestSegment = i;
                        }
                    }

                    const newWaypoints = [...waypoints];
                    newWaypoints.splice(closestSegment + 1, 0, position);
                    modeling.updateWaypoints(connection, newWaypoints);
                }
            };

            eventBus.on('element.hover', handleConnectionHover);
            eventBus.on('element.out', handleConnectionLeave);
            eventBus.on('element.dblclick', handleDoubleClick);

            return () => {
                eventBus.off('element.hover', handleConnectionHover);
                eventBus.off('element.out', handleConnectionLeave);
                eventBus.off('element.dblclick', handleDoubleClick);
            };
        } catch (error) {
            console.error('Erreur configuration interactions:', error);
        }
    }, [viewerRef, editMode]);
}

function distanceToSegment(point: any, start: any, end: any): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
    }

    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    const projectionX = start.x + t * dx;
    const projectionY = start.y + t * dy;

    return Math.sqrt((point.x - projectionX) ** 2 + (point.y - projectionY) ** 2);
}

function ZoomControls({ onZoomIn, onZoomOut, onFit }: { onZoomIn: () => void; onZoomOut: () => void; onFit: () => void; }) {
    return (
        <div className="flex gap-1 bg-white rounded-lg border border-gray-300 p-1">
            <button onClick={onZoomIn} className="p-2 rounded hover:bg-gray-100" title="Zoom +">
                <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={onZoomOut} className="p-2 rounded hover:bg-gray-100" title="Zoom -">
                <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={onFit} className="p-2 rounded hover:bg-gray-100" title="Ajuster">
                <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
        </div>
    );
}

// 🆕 Utilisation de forwardRef pour exposer le containerRef
const BPMNViewer = forwardRef<BPMNViewerHandle, BPMNViewerProps>(({
    xml,
    height = '800px',
    onClose,
    onError,
    onUpdate,
    readOnly = false
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(!readOnly);
    const [hasChanges, setHasChanges] = useState(false);
    const [exporting, setExporting] = useState(false);

    const scriptLoaded = useBPMNScript(onError);
    useConnectionInteractions(viewerRef, editMode);

    // 🆕 Exposer le containerRef au parent
    useImperativeHandle(ref, () => ({
        getContainerRef: () => containerRef.current
    }));

    useEffect(() => {
        if (!scriptLoaded || !containerRef.current || viewerRef.current) return;

        try {
            viewerRef.current = new window.BpmnJS({
                container: containerRef.current,
                height,
                keyboard: { bindTo: document },
                textRenderer: {
                    defaultStyle: {
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: '600',
                        fontSize: '16px',
                        lineHeight: 1.3
                    },
                    externalStyle: {
                        fontSize: '16px',
                        lineHeight: 1.3
                    }
                }
            });

            const eventBus = viewerRef.current.get('eventBus');
            ['elements.changed', 'element.updateLabel', 'connection.reconnect', 'shape.move.end', 'connection.updateWaypoints'].forEach(event => {
                eventBus.on(event, () => setHasChanges(true));
            });

            setLoading(false);
        } catch (error) {
            onError?.("Erreur initialisation viewer");
            setLoading(false);
        }

        return () => {
            viewerRef.current?.destroy();
            viewerRef.current = null;
        };
    }, [scriptLoaded, height, onError]);

    const applyLaneColors = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const applyColors = () => {
            const laneElements = Array.from(
                container.querySelectorAll('[data-element-id^="Lane_"]')
            ).sort((a, b) => {
                const aRect = a.querySelector('rect');
                const bRect = b.querySelector('rect');
                const aX = aRect ? parseFloat(aRect.getAttribute('x') || '0') : 0;
                const bX = bRect ? parseFloat(bRect.getAttribute('x') || '0') : 0;
                return aX - bX;
            });

            laneElements.forEach((lane, index) => {
                const laneId = lane.getAttribute('data-element-id');
                if (!laneId) return;

                const color = LANE_COLORS[index % LANE_COLORS.length];
                const laneRect = lane.querySelector('rect');
                const laneLabel = lane.querySelector('.djs-label');

                if (!laneRect) return;

                const existingHeader = lane.querySelector('.lane-header-custom');
                if (existingHeader) {
                    existingHeader.remove();
                }

                const headerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                headerRect.classList.add('lane-header-custom');

                const laneX = parseFloat(laneRect.getAttribute('x') || '0');
                const laneY = parseFloat(laneRect.getAttribute('y') || '0');
                const laneWidth = parseFloat(laneRect.getAttribute('width') || '0');

                headerRect.setAttribute('x', laneX.toString());
                headerRect.setAttribute('y', laneY.toString());
                headerRect.setAttribute('width', laneWidth.toString());
                headerRect.setAttribute('height', '100');
                headerRect.setAttribute('fill', color.stroke);
                headerRect.setAttribute('opacity', '0.95');
                headerRect.style.pointerEvents = 'none';

                lane.insertBefore(headerRect, lane.firstChild);

                if (laneLabel) {
                    const textElements = laneLabel.querySelectorAll('text, tspan');
                    textElements.forEach((text) => {
                        (text as SVGElement).setAttribute('fill', '#ffffff');
                        (text as SVGElement).style.fontWeight = '700';
                        (text as SVGElement).style.fontSize = '18px';
                    });
                }
            });

            console.log('✅ Couleurs des lanes appliquées');
        };

        const svgContainer = container.querySelector('.djs-container svg');

        if (!svgContainer) {
            setTimeout(applyColors, 100);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const lanes = container.querySelectorAll('[data-element-id^="Lane_"]');

            if (lanes.length > 0) {
                applyColors();
                obs.disconnect();
            }
        });

        observer.observe(svgContainer, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            applyColors();
        }, 500);

    }, []);

    const displayDiagram = useCallback(async (xmlContent: string) => {
        if (!viewerRef.current) return;

        try {
            setLoading(true);
            await viewerRef.current.importXML(xmlContent);
            viewerRef.current.get('canvas').zoom('fit-viewport');

            applyLaneColors();

            setLoading(false);
            setHasChanges(false);
        } catch (error: any) {
            console.error('Erreur rendu BPMN:', error);
            onError?.(`Erreur: ${error.message}`);
            setLoading(false);
        }
    }, [onError, applyLaneColors]);

    useEffect(() => {
        if (viewerRef.current && xml && !loading) {
            displayDiagram(xml);
        }
    }, [xml, loading, displayDiagram]);

    const toggleEditMode = useCallback(() => {
        if (readOnly) return;
        const newMode = !editMode;
        setEditMode(newMode);

        if (containerRef.current) {
            const container = containerRef.current;
            container.classList.remove('bpmn-view-only', 'bpmn-editable');
            container.classList.add(newMode ? 'bpmn-editable' : 'bpmn-view-only');
        }
    }, [editMode, readOnly]);

    const saveChanges = useCallback(async () => {
        if (!viewerRef.current || !onUpdate) return;

        try {
            const { xml: updatedXml } = await viewerRef.current.saveXML({ format: true });
            onUpdate(updatedXml);
            setHasChanges(false);
            alert('✅ Modifications sauvegardées !');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            onError?.("Erreur lors de la sauvegarde");
        }
    }, [onUpdate, onError]);

    const downloadPNG = useCallback(async () => {
        if (!containerRef.current) {
            onError?.("Conteneur introuvable");
            return;
        }

        setExporting(true);

        try {
            const html2canvas = (await import('html2canvas')).default;
            const svgContainer = containerRef.current.querySelector('.djs-container');

            if (!svgContainer) {
                onError?.("SVG introuvable");
                setExporting(false);
                return;
            }

            const editElements = svgContainer.querySelectorAll(`
                .djs-bendpoint,
                .djs-segment-dragger,
                .djs-connection circle:not([class*="marker"]),
                .djs-waypoint-move-handle,
                .djs-connect-handle,
                .djs-resize-handle,
                .djs-context-pad,
                .djs-outline,
                .djs-drag-group,
                .djs-dragger,
                .djs-visual-changed,
                .djs-attach-support
            `);

            const originalDisplays: string[] = [];
            editElements.forEach(el => {
                originalDisplays.push((el as HTMLElement).style.display);
                (el as HTMLElement).style.display = 'none';
            });

            await new Promise(resolve => setTimeout(resolve, 150));

            const canvas = await html2canvas(svgContainer as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 0
            });

            editElements.forEach((el, index) => {
                (el as HTMLElement).style.display = originalDisplays[index];
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `diagram-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    alert('✅ PNG téléchargé avec succès !');
                } else {
                    onError?.("Erreur lors de la création du PNG");
                }
                setExporting(false);
            }, 'image/png', 1.0);

        } catch (error: any) {
            console.error('Erreur export PNG:', error);
            onError?.(`Erreur lors de l'export PNG: ${error.message}`);
            setExporting(false);

            const svgContainer = containerRef.current?.querySelector('.djs-container');
            if (svgContainer) {
                const editElements = svgContainer.querySelectorAll(`
                    .djs-bendpoint,
                    .djs-segment-dragger,
                    .djs-connection circle:not([class*="marker"]),
                    .djs-waypoint-move-handle,
                    .djs-connect-handle,
                    .djs-resize-handle,
                    .djs-context-pad,
                    .djs-outline
                `);
                editElements.forEach(el => {
                    (el as HTMLElement).style.display = '';
                });
            }
        }
    }, [onError]);

    const downloadSVG = useCallback(async () => {
        if (!containerRef.current) {
            onError?.("Conteneur introuvable");
            return;
        }

        setExporting(true);

        try {
            const svgElement = containerRef.current.querySelector('.djs-container svg');

            if (!svgElement) {
                onError?.("SVG introuvable");
                setExporting(false);
                return;
            }

            const clonedSvg = svgElement.cloneNode(true) as SVGElement;

            const editElementsToRemove = clonedSvg.querySelectorAll(`
                .djs-bendpoint,
                .djs-segment-dragger,
                .djs-connection circle:not([class*="marker"]),
                .djs-waypoint-move-handle,
                .djs-connect-handle,
                .djs-resize-handle,
                .djs-context-pad,
                .djs-outline,
                .djs-drag-group,
                .djs-dragger
            `);

            editElementsToRemove.forEach(el => el.remove());

            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = BPMN_VIEWER_STYLES;
            clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

            const applyComputedStyles = (element: Element) => {
                const computed = window.getComputedStyle(element);

                const criticalProps: Array<{ css: keyof CSSStyleDeclaration; svg: string }> = [
                    { css: 'fill', svg: 'fill' },
                    { css: 'stroke', svg: 'stroke' },
                    { css: 'strokeWidth', svg: 'stroke-width' },
                    { css: 'strokeDasharray', svg: 'stroke-dasharray' },
                    { css: 'opacity', svg: 'opacity' },
                    { css: 'fontFamily', svg: 'font-family' },
                    { css: 'fontSize', svg: 'font-size' },
                    { css: 'fontWeight', svg: 'font-weight' },
                ];

                criticalProps.forEach(({ css, svg }) => {
                    const value = computed[css] as string;
                    if (value && value !== 'none' && value !== '' && value !== 'normal') {
                        element.setAttribute(svg, value);
                    }
                });

                Array.from(element.children).forEach(child => applyComputedStyles(child));
            };

            applyComputedStyles(clonedSvg);

            const bbox = (svgElement as SVGSVGElement).getBBox();
            clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`);
            clonedSvg.setAttribute('width', (bbox.width + 40).toString());
            clonedSvg.setAttribute('height', (bbox.height + 40).toString());
            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(clonedSvg);

            svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagram-${Date.now()}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ SVG téléchargé avec succès !');
            setExporting(false);

        } catch (error: any) {
            console.error('Erreur export SVG:', error);
            onError?.(`Erreur lors de l'export SVG: ${error.message}`);
            setExporting(false);
        }
    }, [onError]);

    const zoom = (delta: number) => viewerRef.current?.get('canvas').zoom(viewerRef.current.get('canvas').zoom() + delta);
    const fitViewport = () => viewerRef.current?.get('canvas').zoom('fit-viewport');

    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            container.classList.remove('bpmn-view-only', 'bpmn-editable');
            container.classList.add(editMode ? 'bpmn-editable' : 'bpmn-view-only');
        }
    }, [editMode]);

    return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200">
            <style>{BPMN_VIEWER_STYLES}</style>

            <div className="flex items-center justify-between p-4 px-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                    <FileBarChart className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800 m-0">Diagramme BPMN</h2>
                    {hasChanges && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-semibold">Modifications non sauvegardées</span>}
                </div>

                <div className="flex items-center gap-2">
                    {!readOnly && (<>
                        <button onClick={toggleEditMode} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border transition-all ${editMode ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} title={editMode ? "Passer en mode visualisation" : "Activer le mode édition"}>
                            {editMode ? (<><Unlock className="w-4 h-4" />Édition active</>) : (<><Lock className="w-4 h-4" />Mode lecture</>)}
                        </button>
                        {hasChanges && onUpdate && (<button onClick={saveChanges} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium text-sm animate-pulse"><Save className="w-4 h-4" />Sauvegarder</button>)}
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    </>)}

                    <ZoomControls onZoomIn={() => zoom(0.1)} onZoomOut={() => zoom(-0.1)} onFit={fitViewport} />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <button
                        onClick={downloadPNG}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                        title="Télécharger en PNG (haute qualité, sans outils d'édition)"
                    >
                        <ImageIcon className="w-4 h-4" />
                        {exporting ? 'Export...' : 'PNG'}
                    </button>

                    <button
                        onClick={downloadSVG}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                        title="Télécharger en SVG (vectoriel, sans outils d'édition)"
                    >
                        <FileImage className="w-4 h-4" />
                        {exporting ? 'Export...' : 'SVG'}
                    </button>

                    {onClose && (<><div className="w-px h-6 bg-gray-300 mx-1"></div><button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-600" /></button></>)}
                </div>
            </div>

            {editMode && !readOnly && (
                <div className="mx-6 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 m-0"><strong>🎯 Mode édition activé :</strong> Déplacez les éléments (drag & drop). Sur les flèches : <strong>Survolez</strong> pour voir les outils et augmenter l'épaisseur, <strong>double-cliquez</strong> pour ajouter un angle/coin.</p>
                </div>
            )}

            <div ref={containerRef} style={{ height, position: 'relative' }} className={`bg-white ${editMode ? 'bpmn-editable' : 'bpmn-view-only'}`}>
                {(loading || exporting) && (
                    <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
                        <div className="text-center">
                            <svg className="w-12 h-12 text-blue-600 spinner mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-600">
                                {exporting ? 'Génération de l\'image en cours...' : 'Chargement du diagramme...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

BPMNViewer.displayName = 'BPMNViewer';

export default BPMNViewer;