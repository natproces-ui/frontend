/**
 * Configuration API pour SFD Generator
 * Port 8004 en local, URL Render en production
 */

const getSfdApiBaseUrl = (): string => {
    if (process.env.NEXT_PUBLIC_SFD_API_URL) {
        return process.env.NEXT_PUBLIC_SFD_API_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        return 'https://sfd-generator-api.onrender.com'; // À remplacer par votre URL Render
    }

    return 'http://localhost:8004';
};

const SFD_API_BASE_URL = getSfdApiBaseUrl();

export const SFD_API_CONFIG = {
    baseUrl: SFD_API_BASE_URL,

    endpoints: {
        /* ---------------------- FORMAT 1 ---------------------- */
        format1Extract: '/api/format1/extract',

        /* ---------------------- FORMAT 2 ---------------------- */
        format2Extract: '/api/format2/extract',

        /* ---------------------- WORD GENERATION ---------------------- */
        wordGenerate: '/api/word/generate',
        wordDownload: '/api/word/download', // + /{filename}

        /* ---------------------- ROOT & HEALTH ---------------------- */
        root: '/',
        health: '/health',
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

// Log de debug en dev
if (typeof window !== 'undefined' && SFD_API_CONFIG.isDevelopment()) {
    console.log('🔧 SFD API Configuration:', SFD_API_CONFIG.getEnvironmentInfo());
}