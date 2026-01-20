//ProcessTable.tsx
'use client';

import { useState } from 'react';
import { FileText, Trash2, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { Table1Row } from '@/logic/bpmnGenerator';
import { TaskEnrichment } from '@/logic/bpmnTypes';
import EnrichmentModal from '@/components/DetailModal';

interface TableProps {
    data: Table1Row[];
    enrichments: Map<string, TaskEnrichment>;
    processTitle: string;
    onDataChange: (data: Table1Row[]) => void;
    onEnrichmentsChange: (enrichments: Map<string, TaskEnrichment>) => void;
    onShowSuccess: (message: string) => void;
}

export default function Table({
    data,
    enrichments,
    processTitle,
    onDataChange,
    onEnrichmentsChange,
    onShowSuccess
}: TableProps) {
    const [showTable2, setShowTable2] = useState(false);
    const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
    const [selectedTaskForEnrichment, setSelectedTaskForEnrichment] = useState<{ id: string, name: string } | null>(null);

    // Handlers Modal Détails
    const openEnrichmentModal = (taskId: string, taskName: string) => {
        setSelectedTaskForEnrichment({ id: taskId, name: taskName });
        setEnrichmentModalOpen(true);
    };

    const closeEnrichmentModal = () => {
        setEnrichmentModalOpen(false);
        setSelectedTaskForEnrichment(null);
    };

    const handleSaveEnrichment = (enrichment: TaskEnrichment) => {
        const newEnrichments = new Map(enrichments);
        newEnrichments.set(enrichment.id_tache, enrichment);
        onEnrichmentsChange(newEnrichments);
        onShowSuccess("Détails sauvegardés !");
    };

    // Handlers Table 1
    const handleChange = (index: number, field: keyof Table1Row, value: string) => {
        const updated = [...data];
        if (field === "typeBpmn") {
            updated[index][field] = value as Table1Row["typeBpmn"];
            if (value !== "ExclusiveGateway") {
                updated[index].condition = "";
                updated[index].outputNon = "";
            }
        } else {
            updated[index][field] = value as any;
        }
        onDataChange(updated);
    };

    const handleAddRow = () => {
        const newRow: Table1Row = {
            id: crypto.randomUUID(),
            étape: "",
            typeBpmn: "Task",
            département: "",
            acteur: "",
            condition: "",
            outputOui: "",
            outputNon: "",
            outil: "",
        };
        onDataChange([...data, newRow]);

        // Créer automatiquement des détails vides
        const newEnrichment: TaskEnrichment = {
            id_tache: newRow.id,
            descriptif: '',
            duree_estimee: '',
            frequence: '',
            kpi: ''
        };
        const newEnrichments = new Map(enrichments);
        newEnrichments.set(newRow.id, newEnrichment);
        onEnrichmentsChange(newEnrichments);
    };

    const handleDeleteRow = (index: number) => {
        const rowToDelete = data[index];
        onDataChange(data.filter((_, i) => i !== index));

        // Supprimer automatiquement les détails correspondants
        const newEnrichments = new Map(enrichments);
        newEnrichments.delete(rowToDelete.id);
        onEnrichmentsChange(newEnrichments);
    };

    return (
        <>
            {/* TABLE 1 - Structure du processus */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <caption className="bg-gray-800 text-white p-4 text-left">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {processTitle} ({data.length} étapes)
                            </h2>
                        </caption>
                        <thead className="bg-gray-700 text-white">
                            <tr>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">ID</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Étape</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Type BPMN</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Département</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Acteur</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Condition</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Si Oui</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Si Non</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Outil</th>
                                <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText className="w-12 h-12 text-gray-300" />
                                            <p className="text-lg font-semibold">Tableau vide</p>
                                            <p className="text-sm">
                                                Uploadez une image, enregistrez vocalement ou ajoutez manuellement des lignes
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 px-2 py-1 text-center font-mono text-xs bg-gray-100">
                                            {row.id}
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.étape}
                                                onChange={(e) => handleChange(i, "étape", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <select
                                                value={row.typeBpmn}
                                                onChange={(e) => handleChange(i, "typeBpmn", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            >
                                                <option value="StartEvent">StartEvent</option>
                                                <option value="EndEvent">EndEvent</option>
                                                <option value="Task">Task</option>
                                                <option value="ExclusiveGateway">ExclusiveGateway</option>
                                            </select>
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.département}
                                                onChange={(e) => handleChange(i, "département", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.acteur}
                                                onChange={(e) => handleChange(i, "acteur", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.condition}
                                                onChange={(e) => handleChange(i, "condition", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                                disabled={row.typeBpmn !== "ExclusiveGateway"}
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.outputOui}
                                                onChange={(e) => handleChange(i, "outputOui", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.outputNon}
                                                onChange={(e) => handleChange(i, "outputNon", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                                disabled={row.typeBpmn !== "ExclusiveGateway"}
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={row.outil}
                                                onChange={(e) => handleChange(i, "outil", e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEnrichmentModal(row.id, row.étape)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Ajouter/Modifier les détails"
                                                >
                                                    {enrichments.has(row.id) &&
                                                        (enrichments.get(row.id)?.descriptif ||
                                                            enrichments.get(row.id)?.duree_estimee ||
                                                            enrichments.get(row.id)?.frequence ||
                                                            enrichments.get(row.id)?.kpi) ? (
                                                        <Edit className="w-5 h-5 fill-blue-200" />
                                                    ) : (
                                                        <Edit className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRow(i)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Supprimer la ligne"
                                                >
                                                    <Trash2 className="w-5 h-5 mx-auto" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOUTONS ACTIONS TABLE */}
            <div className="mt-4 flex gap-4">
                <button
                    onClick={handleAddRow}
                    className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter une étape
                </button>

                {/* TOGGLE TABLE 2 */}
                <button
                    onClick={() => setShowTable2(!showTable2)}
                    className="px-6 py-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-all flex items-center gap-2"
                >
                    {showTable2 ? (
                        <>
                            <EyeOff className="w-5 h-5" />
                            Masquer les détails
                        </>
                    ) : (
                        <>
                            <Eye className="w-5 h-5" />
                            Afficher les détails
                        </>
                    )}
                </button>
            </div>

            {/* TABLE 2 - DÉTAILS (AFFICHAGE CONDITIONNEL) */}
            {showTable2 && (
                <div className="mt-6 mb-6 bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-800 text-white p-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Détails documentaires ({Array.from(enrichments.values()).filter(e => e.descriptif || e.duree_estimee || e.frequence || e.kpi).length} tâche(s) détaillée(s))
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-gray-700 text-white">
                                <tr>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">ID Tâche</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Nom Tâche</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Descriptif</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Durée estimée</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Fréquence</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">KPI</th>
                                    <th className="border border-gray-600 px-3 py-2 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => {
                                    const enrichment = enrichments.get(row.id);
                                    const hasEnrichment = enrichment && (enrichment.descriptif || enrichment.duree_estimee || enrichment.frequence || enrichment.kpi);

                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="border border-gray-300 px-2 py-1 text-center font-mono text-xs bg-gray-100">
                                                {row.id}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 font-medium">
                                                {row.étape || <span className="text-gray-400 italic">Sans nom</span>}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 max-w-xs">
                                                <div className="truncate" title={enrichment?.descriptif}>
                                                    {enrichment?.descriptif || <span className="text-gray-400">-</span>}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2">
                                                {enrichment?.duree_estimee || <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2">
                                                {enrichment?.frequence || <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2">
                                                {enrichment?.kpi || <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="border border-gray-300 p-1 text-center">
                                                <button
                                                    onClick={() => openEnrichmentModal(row.id, row.étape)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-5 h-5 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL DE DÉTAILS */}
            <EnrichmentModal
                isOpen={enrichmentModalOpen}
                taskId={selectedTaskForEnrichment?.id || ''}
                taskName={selectedTaskForEnrichment?.name || ''}
                enrichment={selectedTaskForEnrichment ? enrichments.get(selectedTaskForEnrichment.id) || null : null}
                onSave={handleSaveEnrichment}
                onClose={closeEnrichmentModal}
            />
        </>
    );
}