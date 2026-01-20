/**
 * Types pour le SFD Generator
 */

// ============================================================================
// TYPES DE FORMAT
// ============================================================================
export type SFDFormatType = 'format1' | 'format2';

export interface FormatOption {
    id: SFDFormatType;
    name: string;
    description: string;
    icon: string;
}

// ============================================================================
// FORMAT 1 - SFD CLASSIQUE
// ============================================================================
export interface Format1SFD {
    nom_projet: string;
    version: string;
    date: string;
    auteur: string;
    contexte: {
        presentation: string;
        objectifs_metier: string[];
        perimetre: string;
        acteurs: Array<{
            role: string;
            description: string;
        }>;
    };
    description_generale: {
        architecture_fonctionnelle: string;
        flux_principaux: string[];
        regles_gestion: string[];
    };
    modules: Array<{
        id: string;
        nom: string;
        description: string;
        fonctions: Array<{
            id: string;
            nom: string;
            description: string;
            regles_metier: string[];
            donnees_entree: string[];
            donnees_sortie: string[];
            cas_nominal: string;
            cas_erreur: string[];
            contraintes: string[];
        }>;
    }>;
    exigences_non_fonctionnelles: {
        performance: string[];
        securite: string[];
        disponibilite: string[];
        scalabilite: string[];
    };
    contraintes_techniques: {
        environnement: string[];
        technologies: string[];
        normes: string[];
    };
    glossaire: Record<string, string>;
    notes: string;
}

// ============================================================================
// FORMAT 2 - SFD AGILE
// ============================================================================
export interface Format2SFD {
    nom_projet: string;
    version: string;
    date: string;
    product_owner: string;
    scrum_master: string;
    vision_produit: {
        probleme: string;
        utilisateurs_cibles: string[];
        valeur_apportee: string;
        objectifs: string[];
    };
    epics: Array<{
        id: string;
        nom: string;
        description: string;
        objectif: string;
        user_stories: Array<{
            id: string;
            titre: string;
            en_tant_que: string;
            je_veux: string;
            afin_de: string;
            criteres_acceptation: string[];
            regles_metier: string[];
            priorite: string;
            estimation: string;
            statut: string;
        }>;
    }>;
    regles_metier: Array<{
        id: string;
        nom: string;
        description: string;
        impact: string[];
    }>;
    modele_data: {
        entites: Array<{
            nom: string;
            attributs: string;
        }>;
        relations: string[];
    };
    workflows: Array<{
        nom: string;
        etapes: string[];
        description: string;
    }>;
    definition_of_done: string[];
    notes: string;
}

// ============================================================================
// TYPE UNION
// ============================================================================
export type SFDData = Format1SFD | Format2SFD;

// ============================================================================
// ÉTATS DE TRAITEMENT
// ============================================================================
export type ProcessingStage =
    | 'idle'           // Aucun traitement en cours
    | 'uploading'      // Upload fichier
    | 'extracting'     // Extraction avec Gemini
    | 'extracted'      // JSON extrait
    | 'generating'     // Génération Word
    | 'completed'      // Word généré
    | 'error';         // Erreur

export interface ProcessingStatus {
    stage: ProcessingStage;
    message: string;
    progress?: number;
}

// ============================================================================
// RÉSULTATS
// ============================================================================
export interface ExtractionResult {
    success: boolean;
    data: SFDData;
    format: SFDFormatType;
    fileName?: string;
}

export interface WordGenerationResult {
    success: boolean;
    fileName: string;
    downloadUrl: string;
    message: string;
}