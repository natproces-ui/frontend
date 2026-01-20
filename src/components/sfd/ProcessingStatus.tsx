'use client';

import React from 'react';
import { Loader2, Upload, FileSearch, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { ProcessingStage } from '@/types/sfd';

interface ProcessingStatusProps {
    stage: ProcessingStage;
    message: string;
    progress?: number;
}

const STAGE_CONFIG = {
    idle: {
        icon: Upload,
        label: 'En attente',
        color: 'slate'
    },
    uploading: {
        icon: Loader2,
        label: 'Upload en cours',
        color: 'blue',
        animate: true
    },
    extracting: {
        icon: FileSearch,
        label: 'Extraction par Gemini AI',
        color: 'purple',
        animate: true
    },
    extracted: {
        icon: CheckCircle2,
        label: 'Extraction terminée',
        color: 'green'
    },
    generating: {
        icon: FileText,
        label: 'Génération Word',
        color: 'blue',
        animate: true
    },
    completed: {
        icon: CheckCircle2,
        label: 'Terminé',
        color: 'green'
    },
    error: {
        icon: XCircle,
        label: 'Erreur',
        color: 'red'
    }
};

export default function ProcessingStatus({
    stage,
    message,
    progress
}: ProcessingStatusProps) {
    const config = STAGE_CONFIG[stage];
    const Icon = config.icon;

    // Couleurs selon l'état
    const getColorClasses = (color: string) => {
        const colors = {
            slate: {
                bg: 'bg-slate-50',
                border: 'border-slate-200',
                icon: 'text-slate-600',
                text: 'text-slate-900'
            },
            blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                icon: 'text-blue-600',
                text: 'text-blue-900'
            },
            purple: {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                icon: 'text-purple-600',
                text: 'text-purple-900'
            },
            green: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                icon: 'text-green-600',
                text: 'text-green-900'
            },
            red: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: 'text-red-600',
                text: 'text-red-900'
            }
        };
        return colors[color as keyof typeof colors] || colors.slate;
    };

    const colors = getColorClasses(config.color);

    return (
        <div className={`
      border rounded-xl p-4 ${colors.bg} ${colors.border}
    `}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
          w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0
          ${config.animate ? 'animate-pulse' : ''}
        `}>
                    <Icon className={`w-5 h-5 ${colors.icon} ${config.animate ? 'animate-spin' : ''}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${colors.text} mb-1`}>
                        {config.label}
                    </h4>
                    <p className="text-sm text-slate-600">
                        {message}
                    </p>

                    {/* Progress Bar */}
                    {progress !== undefined && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-white rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${colors.icon.replace('text-', 'bg-')} transition-all duration-300`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {progress}%
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}