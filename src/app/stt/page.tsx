'use client';

import { useState } from "react";
import { generateBPMN, ProcessRow } from "@/logic/bpmnGenerator";
import BPMNViewer from "@/components/BPMNViewer";

export default function VoiceProcessPage() {
    const [data, setData] = useState<ProcessRow[]>([]);
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDiagram, setShowDiagram] = useState(false);
    const [bpmnXml, setBpmnXml] = useState<string>("");

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 4000);
    };

    const showSuccess = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };

    // Générer le BPMN en utilisant le module séparé
    const handleGenerateBPMN = () => {
        try {
            const xml = generateBPMN(data);
            setBpmnXml(xml);
            setShowDiagram(true);
            showSuccess("✅ Diagramme BPMN généré avec succès !");
        } catch (err: any) {
            showError(err.message || "Erreur lors de la génération du BPMN");
        }
    };

    // Télécharger le XML BPMN
    const downloadBPMN = () => {
        if (!bpmnXml) {
            showError("Générez d'abord le diagramme");
            return;
        }

        const blob = new Blob([bpmnXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'process.bpmn';
        a.click();
        URL.revokeObjectURL(url);
        showSuccess("✅ Fichier BPMN téléchargé !");
    };

    // Enregistrement vocal
    const toggleRecording = async () => {
        if (!recording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                const chunks: BlobPart[] = [];

                recorder.ondataavailable = (e) => chunks.push(e.data);

                recorder.onstop = async () => {
                    setProcessing(true);
                    const blob = new Blob(chunks, { type: "audio/webm" });
                    const formData = new FormData();
                    formData.append("file", blob, "audio.webm");

                    try {
                        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
                        const result = await res.json();

                        if (result?.error) {
                            showError(result.error);
                            return;
                        }

                        if (result?.parsedData && Array.isArray(result.parsedData)) {
                            const newRows: ProcessRow[] = [];

                            for (const item of result.parsedData) {
                                const step = item.step || generateNextStep(newRows.length);

                                const newRow: ProcessRow = {
                                    id: crypto.randomUUID(),
                                    service: item.service || "",
                                    step: step,
                                    task: item.task || "",
                                    type: item.type || "Séquentielle",
                                    condition: item.condition || "",
                                    yes: item.yes || "",
                                    no: item.no || "",
                                };

                                if (!newRow.task || !newRow.service) continue;

                                if (newRow.type === "Conditionnelle") {
                                    if (!newRow.condition || !newRow.yes || !newRow.no) continue;
                                }

                                if (newRow.type === "Séquentielle") {
                                    newRow.condition = "";
                                    newRow.no = "";
                                    if (!newRow.yes) {
                                        newRow.yes = generateNextStep(data.length + newRows.length);
                                    }
                                }

                                newRows.push(newRow);
                            }

                            if (newRows.length > 0) {
                                setData((prev) => [...prev, ...newRows]);
                                showSuccess(`✅ ${newRows.length} ligne(s) ajoutée(s)`);
                            } else {
                                showError("Aucune ligne valide extraite");
                            }
                        }
                    } catch (e: any) {
                        showError("Erreur de transcription");
                    } finally {
                        setProcessing(false);
                        stream.getTracks().forEach(track => track.stop());
                    }
                };

                recorder.start();
                setMediaRecorder(recorder);
                setRecording(true);
            } catch (err) {
                showError("Impossible d'accéder au microphone");
            }
        } else {
            mediaRecorder?.stop();
            setRecording(false);
        }
    };

    const generateNextStep = (offset: number = 0): string => {
        const totalRows = data.length + offset;
        if (totalRows === 0) return "1.1";
        const lastStep = offset > 0 ? `1.${totalRows}` : data[data.length - 1].step;
        const match = lastStep.match(/^(\d+)\.(\d+)$/);
        if (match) {
            return `${match[1]}.${parseInt(match[2]) + 1}`;
        }
        return `1.${totalRows + 1}`;
    };

    const handleChange = (index: number, field: keyof ProcessRow, value: string) => {
        const updated = [...data];
        if (field === "type") {
            updated[index][field] = value as "Séquentielle" | "Conditionnelle";
            if (value === "Séquentielle") {
                updated[index].condition = "";
                updated[index].no = "";
            }
        } else {
            updated[index][field] = value as any;
        }
        setData(updated);
    };

    const handleAddRow = () => {
        const newRow: ProcessRow = {
            id: crypto.randomUUID(),
            service: "",
            step: generateNextStep(),
            task: "",
            type: "Séquentielle",
            condition: "",
            yes: generateNextStep(1),
            no: "",
        };
        setData([...data, newRow]);
    };

    const handleDeleteRow = (index: number) => {
        setData(data.filter((_, i) => i !== index));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">🎤 Processus Métier avec BPMN</h1>

            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h2 className="font-semibold text-blue-900 mb-2">💡 Guide d'utilisation :</h2>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Séquentielle</strong> : "RH reçoit les candidatures puis les trie"</li>
                    <li>• <strong>Conditionnelle</strong> : "Finance valide le budget, si disponible passe à Communication, sinon retour à RH"</li>
                </ul>
            </div>

            <div className="mb-6 flex gap-4 flex-wrap">
                <button
                    onClick={toggleRecording}
                    disabled={processing}
                    className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${recording ? "bg-red-600 hover:bg-red-700 animate-pulse"
                        : processing ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    {processing ? "⏳ Traitement..." : recording ? "⏹️ Arrêter" : "🎙️ Enregistrer"}
                </button>

                <button
                    onClick={handleGenerateBPMN}
                    disabled={data.length === 0}
                    className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                    📊 Générer le Diagramme BPMN
                </button>

                {bpmnXml && (
                    <button
                        onClick={downloadBPMN}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
                    >
                        💾 Télécharger BPMN
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                    <strong>⚠️ Erreur :</strong> {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
                    {success}
                </div>
            )}

            {showDiagram && bpmnXml && (
                <div className="mb-6">
                    <BPMNViewer
                        xml={bpmnXml}
                        height="600px"
                        onClose={() => setShowDiagram(false)}
                        onError={(err) => showError(err)}
                    />
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                {["ID", "Service", "Étape", "Tâche", "Type", "Condition", "Si Oui →", "Si Non →", "Actions"].map(
                                    (col) => <th key={col} className="border border-gray-600 px-3 py-2 text-left font-semibold">{col}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-gray-500">
                                        Aucune ligne. Utilisez le micro pour ajouter des étapes.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 px-2 py-1 text-center font-mono text-xs">{i + 1}</td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400"
                                                value={row.service}
                                                onChange={e => handleChange(i, "service", e.target.value)}
                                                placeholder="Ex: RH"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400"
                                                value={row.step}
                                                onChange={e => handleChange(i, "step", e.target.value)}
                                                placeholder="Ex: 1.1"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400"
                                                value={row.task}
                                                onChange={e => handleChange(i, "task", e.target.value)}
                                                placeholder="Description"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <select
                                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400"
                                                value={row.type}
                                                onChange={e => handleChange(i, "type", e.target.value)}>
                                                <option value="Séquentielle">Séquentielle</option>
                                                <option value="Conditionnelle">Conditionnelle</option>
                                            </select>
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className={`w-full px-2 py-1 border rounded ${row.type === "Séquentielle" ? 'bg-gray-100' : ''}`}
                                                value={row.condition}
                                                onChange={e => handleChange(i, "condition", e.target.value)}
                                                placeholder={row.type === "Conditionnelle" ? "Question ?" : "—"}
                                                disabled={row.type === "Séquentielle"}
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-400"
                                                value={row.yes}
                                                onChange={e => handleChange(i, "yes", e.target.value)}
                                                placeholder="1.3 ou Service"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                className={`w-full px-2 py-1 border rounded ${row.type === "Séquentielle" ? 'bg-gray-100' : ''}`}
                                                value={row.no}
                                                onChange={e => handleChange(i, "no", e.target.value)}
                                                placeholder={row.type === "Conditionnelle" ? "1.1 ou Service" : "—"}
                                                disabled={row.type === "Séquentielle"}
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button
                                                className="text-red-500 font-bold hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                                                onClick={() => handleDeleteRow(i)}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50 border-t">
                    <button
                        onClick={handleAddRow}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        ➕ Ajouter une ligne
                    </button>
                </div>
            </div>
        </div>
    );
}