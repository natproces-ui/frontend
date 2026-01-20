'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Sparkles, ArrowRight } from 'lucide-react';

import FileUploader from '@/components/sfd/FileUploader';
import FormatSelector from '@/components/sfd/FormatSelector';
import ProcessingStatus from '@/components/sfd/ProcessingStatus';
import ExtractionResult from '@/components/sfd/ExtractionResult';
import UserStoriesTable from '@/components/sfd/UserStoriesTable';

import { SFDFormatType, ProcessingStage, SFDData } from '@/types/sfd';
import { getErrorMessage } from '@/types/sfd/api';
import { SFD_API_CONFIG } from '@/lib/sfd-api-config';

export default function SFDGeneratorPage() {
    // États
    const [selectedFormat, setSelectedFormat] = useState<SFDFormatType>('format1');
    const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
    const [processingMessage, setProcessingMessage] = useState('');
    const [extractedData, setExtractedData] = useState<SFDData | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [currentText, setCurrentText] = useState<string | null>(null);

    // Réinitialiser les données extraites quand on change de format
    useEffect(() => {
        // Si on a des données extraites et qu'on change de format, on réinitialise
        if (extractedData) {
            setExtractedData(null);
            setProcessingStage('idle');
            setProcessingMessage('');
        }
    }, [selectedFormat]);

    // Extraction depuis fichier ou texte
    const handleExtraction = async () => {
        if (!currentFile && !currentText) {
            toast.error('Veuillez fournir un fichier ou du texte');
            return;
        }

        try {
            // Upload stage
            setProcessingStage('uploading');
            setProcessingMessage('Préparation de l\'envoi...');

            // Extraction stage
            setProcessingStage('extracting');
            setProcessingMessage('Extraction des informations avec Gemini AI...');

            const formData = new FormData();
            if (currentFile) {
                formData.append('file', currentFile);
            } else if (currentText) {
                formData.append('text', currentText);
            }

            // Endpoint selon le format
            const endpoint = selectedFormat === 'format1'
                ? '/api/format1/extract-json'
                : '/api/format2/extract-json';

            const response = await fetch(SFD_API_CONFIG.getFullUrl(endpoint), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(getErrorMessage(error));
            }

            const data = await response.json();

            // Success
            setExtractedData(data);
            setProcessingStage('extracted');
            setProcessingMessage('Extraction terminée avec succès !');

            toast.success('SFD extrait avec succès !');

        } catch (error) {
            console.error('Extraction error:', error);
            setProcessingStage('error');
            setProcessingMessage(getErrorMessage(error));
            toast.error(getErrorMessage(error));
        }
    };

    // Génération Word
    const handleGenerateWord = async (): Promise<{ blob: Blob; filename: string } | null> => {
        if (!extractedData) return null;

        try {
            setProcessingStage('generating');
            setProcessingMessage('Génération du document Word...');

            const response = await fetch(
                SFD_API_CONFIG.getFullUrl('/api/word/json-text-to-word-download'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        json_data: extractedData,
                        format_type: selectedFormat,
                        nom_fichier: `SFD_${extractedData.nom_projet}_${selectedFormat}`
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(getErrorMessage(error));
            }

            // Récupérer le fichier sans le télécharger automatiquement
            const blob = await response.blob();
            const filename = `SFD_${extractedData.nom_projet}.docx`;

            setProcessingStage('completed');
            setProcessingMessage('Document Word généré !');

            toast.success('Document Word généré !');

            return { blob, filename };

        } catch (error) {
            console.error('Word generation error:', error);
            setProcessingStage('error');
            setProcessingMessage(getErrorMessage(error));
            toast.error(getErrorMessage(error));
            return null;
        }
    };

    // Téléchargement JSON
    const handleDownloadJson = () => {
        if (!extractedData) return;

        const jsonString = JSON.stringify(extractedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SFD_${extractedData.nom_projet}_${selectedFormat}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('JSON téléchargé !');
    };

    // Reset
    const handleReset = () => {
        setProcessingStage('idle');
        setProcessingMessage('');
        setExtractedData(null);
        setCurrentFile(null);
        setCurrentText(null);
    };

    const isProcessing = ['uploading', 'extracting', 'generating'].includes(processingStage);
    const hasExtracted = extractedData !== null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                SFD Generator
                            </h1>
                            <p className="text-sm text-slate-600">
                                Générez vos spécifications fonctionnelles automatiquement
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Sidebar - Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Format Selection Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <FormatSelector
                                selectedFormat={selectedFormat}
                                onFormatChange={setSelectedFormat}
                                disabled={isProcessing}
                            />
                        </div>

                        {/* File Upload Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-medium text-slate-900 mb-4">
                                Source du SFD
                            </h3>
                            <FileUploader
                                onFileSelect={(file) => {
                                    setCurrentFile(file);
                                    setCurrentText(null);
                                    // Réinitialiser les résultats si on change de fichier après extraction
                                    if (extractedData) {
                                        setExtractedData(null);
                                        setProcessingStage('idle');
                                        setProcessingMessage('');
                                    }
                                }}
                                onTextInput={(text) => {
                                    setCurrentText(text);
                                    setCurrentFile(null);
                                    // Réinitialiser les résultats si on change de texte après extraction
                                    if (extractedData) {
                                        setExtractedData(null);
                                        setProcessingStage('idle');
                                        setProcessingMessage('');
                                    }
                                }}
                                disabled={isProcessing}
                            />
                        </div>

                        {/* Action Button */}
                        {!hasExtracted && (
                            <button
                                onClick={handleExtraction}
                                disabled={isProcessing || (!currentFile && !currentText)}
                                className={`
                  w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl
                  font-semibold shadow-sm transition-all
                  ${isProcessing || (!currentFile && !currentText)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                    }
                `}
                            >
                                <span>Extraire le SFD</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}

                        {/* Reset Button */}
                        {hasExtracted && (
                            <button
                                onClick={handleReset}
                                disabled={isProcessing}
                                className="w-full px-6 py-4 rounded-xl font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                            >
                                Nouveau SFD
                            </button>
                        )}
                    </div>

                    {/* Main Area - Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Processing Status */}
                        {processingStage !== 'idle' && (
                            <ProcessingStatus
                                stage={processingStage}
                                message={processingMessage}
                            />
                        )}

                        {/* Extracted Result */}
                        {hasExtracted && extractedData && (
                            <>
                                <ExtractionResult
                                    data={extractedData}
                                    format={selectedFormat}
                                    onGenerateWord={handleGenerateWord}
                                    onDownloadJson={handleDownloadJson}
                                    isGenerating={processingStage === 'generating'}
                                />

                                {/* User Stories Table - Seulement pour Format 2 (Agile) */}
                                {selectedFormat === 'format2' && extractedData.epics && (
                                    <UserStoriesTable epics={extractedData.epics} />
                                )}
                            </>
                        )}

                        {/* Empty State */}
                        {processingStage === 'idle' && !hasExtracted && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Prêt à générer votre SFD
                                </h3>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Sélectionnez un format, uploadez votre cahier des charges, et laissez l'IA extraire les informations.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}