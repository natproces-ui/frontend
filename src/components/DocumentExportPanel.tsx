'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Table1Row } from '@/logic/bpmnGenerator';
import { TaskEnrichment, ProcessMetadata } from '@/logic/bpmnTypes';
import { API_CONFIG } from '@/lib/api-config';
import DocumentPreviewModal from './DocumentPreviewModal';

interface DocumentExportPanelProps {
    data: Table1Row[];
    enrichments: Map<string, TaskEnrichment>;
    processMetadata: ProcessMetadata;
    bpmnXml: string;
    containerRef: React.RefObject<HTMLDivElement>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

interface ExportOptions {
    include_diagram: boolean;
    include_enrichments: boolean;
    include_annexes: boolean;
    detail_level: 'synthesis' | 'standard' | 'complete';
}

interface DocumentResponse {
    success: boolean;
    document_id: string;
    filename: string;
    file_size: number;
    download_url: string;
    preview: any;
}

export default function DocumentExportPanel({
    data,
    enrichments,
    processMetadata,
    bpmnXml,
    containerRef,
    onSuccess,
    onError
}: DocumentExportPanelProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [showOptions, setShowOptions] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [documentData, setDocumentData] = useState<DocumentResponse | null>(null);

    const [options, setOptions] = useState<ExportOptions>({
        include_diagram: true,
        include_enrichments: true,
        include_annexes: true,
        detail_level: 'standard'
    });

    const captureDiagramAsBase64 = async (): Promise<string | null> => {
        if (!containerRef.current || !options.include_diagram) {
            return null;
        }

        try {
            const html2canvas = (await import('html2canvas')).default;
            const svgContainer = containerRef.current.querySelector('.djs-container');

            if (!svgContainer) {
                throw new Error('Container SVG introuvable');
            }

            const editElements = svgContainer.querySelectorAll(`
                .djs-bendpoint, .djs-segment-dragger,
                .djs-connection circle:not([class*="marker"]),
                .djs-waypoint-move-handle, .djs-connect-handle,
                .djs-resize-handle, .djs-context-pad, .djs-outline
            `);

            const originalDisplays: string[] = [];
            editElements.forEach(el => {
                originalDisplays.push((el as HTMLElement).style.display);
                (el as HTMLElement).style.display = 'none';
            });

            await new Promise(resolve => setTimeout(resolve, 100));

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

            return canvas.toDataURL('image/png', 1.0);

        } catch (error: any) {
            console.error('Erreur capture diagramme:', error);
            onError(`Erreur lors de la capture du diagramme: ${error.message}`);
            return null;
        }
    };

    const validateData = (): boolean => {
        if (data.length === 0) {
            onError('Le tableau est vide. Ajoutez au moins une étape.');
            return false;
        }

        const hasStartEvent = data.some(step => step.typeBpmn === 'StartEvent');
        const hasEndEvent = data.some(step => step.typeBpmn === 'EndEvent');

        if (!hasStartEvent || !hasEndEvent) {
            onError('Le processus doit contenir au moins un StartEvent et un EndEvent.');
            return false;
        }

        if (options.include_diagram && !bpmnXml) {
            onError('Générez d\'abord le diagramme BPMN avant d\'exporter.');
            return false;
        }

        return true;
    };

    const generateWordDocument = async () => {
        if (!validateData()) return;

        setIsGenerating(true);
        setCurrentStep('Validation des données...');

        try {
            setCurrentStep('Capture du diagramme BPMN...');
            const diagramBase64 = await captureDiagramAsBase64();

            if (diagramBase64 && diagramBase64.length > 15 * 1024 * 1024) {
                throw new Error('Le diagramme est trop volumineux (>15MB).');
            }

            setCurrentStep('Préparation des données...');

            const payload = {
                metadata: {
                    nom: processMetadata.nom || 'Processus métier',
                    version: processMetadata.version || '1.0',
                    proprietaire: processMetadata.proprietaire || 'Non spécifié',
                    dateCreation: processMetadata.dateCreation || new Date().toISOString().split('T')[0],
                    dateModification: new Date().toISOString().split('T')[0]
                },
                workflow: data,
                enrichments: Object.fromEntries(enrichments),
                diagram_image: diagramBase64,
                options: options
            };

            setCurrentStep('Génération du document Word...');

            const url = API_CONFIG.getFullUrl(API_CONFIG.endpoints.docGenerate);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la génération');
            }

            const result: DocumentResponse = await response.json();

            setDocumentData(result);
            setShowPreview(true);
            onSuccess('✅ Document généré avec succès !');

        } catch (error: any) {
            console.error('Erreur génération document:', error);
            onError(error.message || 'Erreur lors de la génération du document');
        } finally {
            setIsGenerating(false);
            setCurrentStep('');
        }
    };

    const handleDownload = () => {
        if (!documentData) return;

        const url = API_CONFIG.getFullUrl(documentData.download_url);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        onSuccess('📥 Téléchargement lancé !');
        setShowPreview(false);
    };

    return (
        <>
            <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Export Documentation Word</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Rapport professionnel avec diagramme et enrichissements
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        {showOptions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                {/* Options */}
                {showOptions && (
                    <div className="p-4 bg-gray-900 border-b border-gray-700">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[
                                { key: 'include_diagram', label: 'Inclure le diagramme BPMN' },
                                { key: 'include_enrichments', label: 'Inclure les enrichissements' },
                                { key: 'include_annexes', label: 'Inclure les annexes' }
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={options[key as keyof ExportOptions] as boolean}
                                        onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                                Niveau de détail
                            </label>
                            <div className="flex gap-4">
                                {(['synthesis', 'standard', 'complete'] as const).map((level) => (
                                    <label key={level} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white">
                                        <input
                                            type="radio"
                                            value={level}
                                            checked={options.detail_level === level}
                                            onChange={(e) => setOptions({ ...options, detail_level: e.target.value as any })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="capitalize">
                                            {level === 'synthesis' ? 'Synthèse' : level === 'standard' ? 'Standard' : 'Complet'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action */}
                <div className="p-4">
                    {isGenerating ? (
                        <div className="flex flex-col items-center py-6 gap-3">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <div className="text-center">
                                <p className="text-base font-semibold text-white">{currentStep}</p>
                                <p className="text-xs text-gray-400 mt-1">Cela peut prendre quelques secondes...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-gray-300">
                                        <p className="font-semibold mb-1.5 text-gray-200">Contenu du rapport :</p>
                                        <ul className="space-y-0.5 text-gray-400">
                                            <li>• Page de garde avec métadonnées</li>
                                            <li>• Table des matières automatique</li>
                                            {options.include_diagram && <li>• Diagramme BPMN haute résolution</li>}
                                            <li>• Description de {data.length} étape(s)</li>
                                            {options.include_enrichments && enrichments.size > 0 && (
                                                <li>• {enrichments.size} enrichissement(s)</li>
                                            )}
                                            <li>• Cartographie des acteurs</li>
                                            {options.include_annexes && <li>• Annexes (métriques, glossaire)</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={generateWordDocument}
                                disabled={data.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                <Download className="w-4 h-4" />
                                Générer le rapport Word
                            </button>

                            {data.length === 0 && (
                                <p className="text-center text-xs text-gray-500">
                                    Ajoutez au moins une étape pour générer le rapport
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {documentData && (
                <DocumentPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    preview={documentData.preview}
                    filename={documentData.filename}
                    fileSize={documentData.file_size}
                    downloadUrl={documentData.download_url}
                    onDownload={handleDownload}
                />
            )}
        </>
    );
}