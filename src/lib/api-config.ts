/**
 * Configuration centralisée de l'API
 * Gère automatiquement l'environnement (dev/production)
 */

// Détection automatique de l'URL backend
const getApiBaseUrl = (): string => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        return 'https://processmate-back.onrender.com';
    }

    return 'http://localhost:8001';
};

const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
    baseUrl: API_BASE_URL,

    endpoints: {
        /* ---------------------- PARSER ---------------------- */
        parse: '/api/parser/parse',
        parseText: '/api/parser/parse-text',
        parseDownload: '/api/parser/parse-download',
        analyze: '/api/parser/analyze',

        /* ---------------------- FLOWCHART ---------------------- */
        generateFlowchart: '/api/flowchart/generate',
        generateFlowchartFromJson: '/api/flowchart/generate-from-json',
        generateDotOnly: '/api/flowchart/generate-dot-only',
        flowchartFormats: '/api/flowchart/formats',

        /* ---------------------- BPMN ---------------------- */
        generateBPMN: '/api/bpmn/generate',
        generateBPMNxml: '/api/bpmn/generate-xml',
        bpmnFormats: '/api/bpmn/formats',
        bpmnInfo: '/api/bpmn/info',

        transcribe: '/api/stt/transcribe',

        /* ---------------------- BPMN AI ---------------------- */
        bpmnAiEnrichTable: '/api/bpmn-ai/enrich-table',
        bpmnAiInfo: '/api/bpmn-ai/info',

        /* ---------------------- IMG → BPMN ---------------------- */
        imgToBpmnAnalyze: '/api/img-to-bpmn/analyze',
        imgToBpmnImprove: '/api/img-to-bpmn/improve',
        imgToBpmnVerify: '/api/img-to-bpmn/verify',
        imgToBpmnBatchAnalyze: '/api/img-to-bpmn/batch-analyze',
        imgToBpmnEnrichTask: '/api/img-to-bpmn/enrich-task',
        imgToBpmnEnrichWorkflow: '/api/img-to-bpmn/enrich-workflow',
        imgToBpmnInfo: '/api/img-to-bpmn/info',

        /* ---------------------- DOCUMENT GENERATION ---------------------- */  // 🆕 SECTION AJOUTÉE
        docGenerate: '/api/doc/generate',  // 🆕 ENDPOINT AJOUTÉ

        /* ---------------------- MEGA TABLE ---------------------- */
        megaProcessJson: '/api/mega/process-json',
        megaProcessExcel: '/api/mega/process-excel',
        megaStats: '/api/mega/stats',
        megaInfo: '/api/mega/info',

        /* ---------------------- ROOT & HEALTH ---------------------- */
        apiRoot: '/api',
        health: '/health',
        quickStart: '/api/quick-start',

        // Scanner Pro
        scannerScan: "/api/scanner/scan",
        scannerScanAndAnalyze: "/api/scanner/scan-and-analyze",
        scannerInfo: "/api/scanner/info"
    },

    /**
     * Construit l'URL complète pour un endpoint
     */
    getFullUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint}`;
    },

    /**
     * Vérifie si on est en mode développement
     */
    isDevelopment(): boolean {
        return process.env.NODE_ENV === 'development';
    },

    /**
     * Vérifie si on est en mode production
     */
    isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    },

    /**
     * Retourne des informations sur l'environnement actuel
     */
    getEnvironmentInfo() {
        return {
            environment: process.env.NODE_ENV || 'development',
            baseUrl: this.baseUrl,
            isProduction: this.isProduction(),
            isDevelopment: this.isDevelopment()
        };
    }
};

// Log de debug en dev (côté navigateur)
if (typeof window !== 'undefined' && API_CONFIG.isDevelopment()) {
    console.log('🔧 API Configuration:', API_CONFIG.getEnvironmentInfo());
}

// Types pour le scanner
export interface ScanResult {
    success: boolean;
    scanned_image: string;
    document_detected: boolean;
    confidence: number;
    corners?: number[][];
    original_size: [number, number];
    scanned_size: [number, number];
    message?: string;
}

export interface ScanAndAnalyzeResult {
    success: boolean;
    workflow: any[];
    steps_count: number;
    scanned_image: string;
    document_detected: boolean;
    scan_confidence: number;
    metadata: {
        original_size: [number, number];
        scanned_size: [number, number];
        scan_mode: string;
        enhanced: boolean;
    };
}