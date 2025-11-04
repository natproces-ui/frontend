'use client';

import React, { useState, useRef, useEffect } from 'react';
import '@/app/clinic/css/style.css';
import FlowchartViewer from '@/components/clinic/FlowchartViewer';
import EditorView from '@/components/clinic/EditorView';
import TableComponent from '@/components/clinic/Table'; // ← NOUVEAU
import { initializeViz, VizInstance } from '@/components/clinic/flowchartUtils';

const API_URL = 'http://localhost:8002';

interface ParsedData {
    ast: any;
    statistics: {
        total_lines: number;
        statement_count: number;
        root_type: string;
        filename: string;
    };
}

export default function ClinicPage() {
    // Step 1 State
    const [file1, setFile1] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [loading1, setLoading1] = useState(false);
    const [error1, setError1] = useState('');
    const [success1, setSuccess1] = useState('');

    // Step 2 State
    const [file2, setFile2] = useState<File | null>(null);
    const [loading2, setLoading2] = useState(false);
    const [error2, setError2] = useState('');
    const [success2, setSuccess2] = useState('');
    const [pngImageUrl, setPngImageUrl] = useState('');
    const [dotSource, setDotSource] = useState('');
    const [currentFileName, setCurrentFileName] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState<'simple' | 'editor' | 'table'>('simple'); // ← AJOUT 'table'

    // Refs
    const fileInput1Ref = useRef<HTMLInputElement>(null);
    const fileInput2Ref = useRef<HTMLInputElement>(null);
    const vizRef = useRef<VizInstance | null>(null);

    // Initialize Viz.js
    useEffect(() => {
        const init = async () => {
            vizRef.current = await initializeViz();
        };
        init();
    }, []);

    // Step 1: Handle file selection
    const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile1(e.target.files[0]);
            setError1('');
            setSuccess1('');
        }
    };

    const handleFile1Drop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile1(e.dataTransfer.files[0]);
            setError1('');
            setSuccess1('');
        }
    };

    // Step 1: Parse code
    const handleParse = async () => {
        if (!file1) return;

        setError1('');
        setSuccess1('');
        setLoading1(true);

        const formData = new FormData();
        formData.append('file', file1);

        try {
            const response = await fetch(`${API_URL}/parse`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Erreur lors du parsing');
            }

            setParsedData(data);
            setSuccess1('Analyse réussie!');
        } catch (err: any) {
            setError1(err.message);
        } finally {
            setLoading1(false);
        }
    };

    // Step 1: Download JSON
    const handleDownloadJson = () => {
        if (!parsedData) return;

        const jsonStr = JSON.stringify(parsedData.ast, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${parsedData.statistics.filename.split('.')[0]}cpt_ast.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Step 2: Handle file selection
    const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile2(file);
            setCurrentFileName(file.name.replace('.json', ''));
            setError2('');
            setSuccess2('');
        }
    };

    const handleFile2Drop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setFile2(file);
            setCurrentFileName(file.name.replace('.json', ''));
            setError2('');
            setSuccess2('');
        }
    };

    // Step 2: Get flowchart
    const handleGetFlowchart = async () => {
        if (!file2) return;

        setError2('');
        setSuccess2('');
        setLoading2(true);

        try {
            const arrayBuffer = await file2.arrayBuffer();
            const fileBlob = new Blob([arrayBuffer], { type: file2.type });
            const fileName = file2.name;

            // Get PNG
            const formDataPng = new FormData();
            formDataPng.append('file', fileBlob, fileName);

            const pngResponse = await fetch(`${API_URL}/get-flowchart`, {
                method: 'POST',
                body: formDataPng,
            });

            if (!pngResponse.ok) {
                const err = await pngResponse.json();
                throw new Error(err.detail?.message || 'Fichier non pris en charge');
            }

            const pngBlob = await pngResponse.blob();
            const pngUrl = URL.createObjectURL(pngBlob);
            setPngImageUrl(pngUrl);

            // Get DOT
            const formDataDot = new FormData();
            formDataDot.append('file', fileBlob, fileName);

            const dotResponse = await fetch(`${API_URL}/get-flowchart-editable`, {
                method: 'POST',
                body: formDataDot,
            });

            if (dotResponse.ok) {
                const dotText = await dotResponse.text();
                setDotSource(dotText);
            }

            setSuccess2('Flowchart généré avec succès!');
        } catch (err: any) {
            setError2(err.message);
        } finally {
            setLoading2(false);
        }
    };

    return (
        <>
            {/* Include Viz.js scripts */}
            <script src="https://cdnjs.cloudflare.com/ajax/libs/viz.js/2.1.2/viz.js" async />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/viz.js/2.1.2/full.render.js" async />

            <div className="container">
                <header>
                    <h1>Clinic</h1>
                    <p className="tagline">Rendre visible l'invisible</p>
                </header>

                <div className="steps">
                    {/* Step 1: Parse WinDev Code */}
                    <div className="step-card">
                        <div className="step-header">
                            <div className="step-number">1</div>
                            <div className="step-title">Parser le code WinDev</div>
                        </div>
                        <p className="step-description">
                            Uploadez votre fichier contenant du code WinDev pour générer un AST JSON
                        </p>

                        <div
                            className={`upload-zone ${file1 ? '' : ''}`}
                            onClick={() => fileInput1Ref.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFile1Drop}
                        >
                            {!file1 ? (
                                <>
                                    <div className="upload-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                    </div>
                                    <div className="upload-text">Cliquez pour sélectionner un fichier</div>
                                    <div className="upload-hint">ou glissez-déposez votre fichier .swift, .wl</div>
                                </>
                            ) : (
                                <div className="file-info">
                                    <div className="file-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                    </div>
                                    <div className="file-details">
                                        <div className="file-name">{file1.name}</div>
                                        <div className="file-size">{(file1.size / 1024).toFixed(2)} KB</div>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInput1Ref}
                                type="file"
                                accept=".swift,.wl,.txt,.windev"
                                onChange={handleFile1Change}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <button className="btn" onClick={handleParse} disabled={!file1 || loading1}>
                            Analyser le code
                        </button>
                        {loading1 && <div className="loader show" />}

                        {error1 && <div className="error-message show">{error1}</div>}
                        {success1 && <div className="success-message show">{success1}</div>}

                        {parsedData && (
                            <div className="result-section show">
                                <div className="result-title">Résultat de l'analyse</div>
                                <div className="stats">
                                    <div className="stat-item">
                                        <div className="stat-label">Lignes</div>
                                        <div className="stat-value">{parsedData.statistics.total_lines}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Instructions</div>
                                        <div className="stat-value">{parsedData.statistics.statement_count}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Type</div>
                                        <div className="stat-value">{parsedData.statistics.root_type}</div>
                                    </div>
                                </div>
                                <button className="btn" onClick={handleDownloadJson}>
                                    Télécharger le JSON
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Get Flowchart */}
                    <div className="step-card">
                        <div className="step-header">
                            <div className="step-number">2</div>
                            <div className="step-title">Obtenir le flowchart</div>
                        </div>
                        <p className="step-description">
                            Uploadez votre fichier JSON pour récupérer le flowchart correspondant
                        </p>

                        <div
                            className="upload-zone"
                            onClick={() => fileInput2Ref.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFile2Drop}
                        >
                            {!file2 ? (
                                <>
                                    <div className="upload-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="12" y1="18" x2="12" y2="12"></line>
                                            <line x1="9" y1="15" x2="15" y2="15"></line>
                                        </svg>
                                    </div>
                                    <div className="upload-text">Cliquez pour sélectionner un fichier JSON</div>
                                    <div className="upload-hint">Fichiers supportés: cpt, gar</div>
                                </>
                            ) : (
                                <div className="file-info">
                                    <div className="file-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                    </div>
                                    <div className="file-details">
                                        <div className="file-name">{file2.name}</div>
                                        <div className="file-size">{(file2.size / 1024).toFixed(2)} KB</div>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInput2Ref}
                                type="file"
                                accept=".json"
                                onChange={handleFile2Change}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <button className="btn" onClick={handleGetFlowchart} disabled={!file2 || loading2}>
                            Obtenir le flowchart
                        </button>
                        {loading2 && <div className="loader show" />}

                        {error2 && <div className="error-message show">{error2}</div>}
                        {success2 && <div className="success-message show">{success2}</div>}

                        {pngImageUrl && (
                            <div className="result-section show">
                                <div className="result-title">Flowchart</div>
                                <div className="flowchart-container">
                                    {/* 3 ONGLETS */}
                                    <div className="view-tabs">
                                        <button
                                            className={`tab-btn ${activeTab === 'simple' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('simple')}
                                        >
                                            Vue simple
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('editor')}
                                        >
                                            Mode édition
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('table')}
                                        >
                                            Tableau métier
                                        </button>
                                    </div>

                                    {/* VUE SIMPLE */}
                                    {activeTab === 'simple' && (
                                        <FlowchartViewer imageUrl={pngImageUrl} />
                                    )}

                                    {/* MODE ÉDITION */}
                                    {activeTab === 'editor' && (
                                        <EditorView
                                            dotSource={dotSource}
                                            onDotSourceChange={setDotSource}
                                            vizInstance={vizRef.current}
                                            currentFileName={currentFileName}
                                        />
                                    )}

                                    {/* TABLEAU MÉTIER */}
                                    {activeTab === 'table' && dotSource && (
                                        <TableComponent dotSource={dotSource} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}