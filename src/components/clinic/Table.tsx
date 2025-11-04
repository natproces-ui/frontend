'use client';

import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import parse from 'dotparser';
import { Download } from 'lucide-react';

interface TableRow {
    id: string;
    service: string;
    etape: string;
    tache: string;
    type: string;
    condition: string;
    siOui: string;
    siNon: string;
    actions: string;
}

interface TableComponentProps {
    dotSource: string;
}

export default function TableComponent({ dotSource }: TableComponentProps) {
    const [rows, setRows] = useState<TableRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dotSource) {
            setLoading(false);
            return;
        }

        try {
            // Parse DOT
            const graphs = parse(dotSource);
            if (!graphs || graphs.length === 0) throw new Error('DOT invalide');

            const graph = graphs[0];
            const nodes: any = {};
            const edges: any[] = [];

            // Extraire nœuds
            graph.children.forEach((child: any) => {
                if (child.type === 'node_stmt') {
                    const id = child.node_id.id;
                    const attrs = child.attr_list.reduce((acc: any, attr: any) => {
                        acc[attr.id] = attr.eq;
                        return acc;
                    }, {});
                    nodes[id] = { id, ...attrs };
                } else if (child.type === 'edge_stmt') {
                    const from = child.edge_list[0].id;
                    const to = child.edge_list[1].id;
                    const label = child.attr_list.find((a: any) => a.id === 'label')?.eq || '';
                    edges.push({ from, to, label: label.replace(/"/g, '') });
                }
            });

            // Ordonner topologiquement
            const orderedNodes = topologicalSort(Object.keys(nodes), edges);

            // Générer tableau
            const tableRows: TableRow[] = orderedNodes.map((nodeId, index) => {
                const node = nodes[nodeId];
                const outgoing = edges.filter(e => e.from === nodeId);
                const incoming = edges.filter(e => e.to === nodeId);

                let type = 'Séquentielle';
                if (node.shape === 'diamond') type = 'Conditionnelle';
                if (node.shape === 'ellipse' || node.shape === 'oval') type = 'Début/Fin';
                if (node.color === 'purple') type = 'Boucle';

                const row: TableRow = {
                    id: `1.${index + 1}`,
                    service: '',
                    etape: `1.${index + 1}`,
                    tache: node.label?.replace(/"/g, '') || nodeId,
                    type,
                    condition: type === 'Conditionnelle' ? node.label?.replace(/"/g, '') || '' : '',
                    siOui: '',
                    siNon: '',
                    actions: ''
                };

                if (outgoing.length === 1) {
                    const nextId = findNodeIndex(orderedNodes, outgoing[0].to);
                    row.siOui = nextId >= 0 ? `1.${nextId + 1}` : '';
                } else if (outgoing.length === 2) {
                    const ouiEdge = outgoing.find(e => /oui|true|vrai/i.test(e.label));
                    const nonEdge = outgoing.find(e => /non|false|faux/i.test(e.label));
                    if (ouiEdge) {
                        const idx = findNodeIndex(orderedNodes, ouiEdge.to);
                        row.siOui = idx >= 0 ? `1.${idx + 1}` : '';
                    }
                    if (nonEdge) {
                        const idx = findNodeIndex(orderedNodes, nonEdge.to);
                        row.siNon = idx >= 0 ? `1.${idx + 1}` : '';
                    }
                }

                return row;
            });

            setRows(tableRows);
        } catch (err) {
            console.error(err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [dotSource]);

    const findNodeIndex = (ordered: string[], nodeId: string) => ordered.indexOf(nodeId);

    const topologicalSort = (nodes: string[], edges: any[]) => {
        const graph = new Map();
        const indegree = new Map();
        nodes.forEach(n => { graph.set(n, []); indegree.set(n, 0); });
        edges.forEach(e => {
            graph.get(e.from).push(e.to);
            indegree.set(e.to, (indegree.get(e.to) || 0) + 1);
        });

        const queue = nodes.filter(n => indegree.get(n) === 0);
        const result: string[] = [];

        while (queue.length) {
            const node = queue.shift()!;
            result.push(node);
            graph.get(node).forEach((neighbor: string) => {
                indegree.set(neighbor, indegree.get(neighbor) - 1);
                if (indegree.get(neighbor) === 0) queue.push(neighbor);
            });
        }

        return result.length === nodes.length ? result : nodes;
    };

    const handleCellChange = (index: number, field: keyof TableRow, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Flowchart');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'tableau_metier_a_remplir.xlsx');
    };

    if (loading) return <div className="p-4 text-center">Analyse du flowchart...</div>;
    if (rows.length === 0) return <div className="p-4 text-center text-red-500">Aucun nœud détecté dans le .dot</div>;

    return (
        <div className="p-4 max-w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tableau métier à compléter</h3>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    <Download size={16} />
                    Exporter Excel
                </button>
            </div>

            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        {['ID', 'Service', 'Étape', 'Tâche', 'Type', 'Condition', 'Si Oui →', 'Si Non →', 'Actions'].map(header => (
                            <th key={header} className="border border-gray-300 px-3 py-2 text-left font-medium">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1 font-mono">{row.id}</td>
                            <td className="border border-gray-300 px-3 py-1">
                                <input
                                    type="text"
                                    value={row.service}
                                    onChange={e => handleCellChange(idx, 'service', e.target.value)}
                                    className="w-full px-1 py-0.5 border rounded"
                                    placeholder="RH, Finance..."
                                />
                            </td>
                            <td className="border border-gray-300 px-3 py-1 font-mono">{row.etape}</td>
                            <td className="border border-gray-300 px-3 py-1">{row.tache}</td>
                            <td className="border border-gray-300 px-3 py-1">{row.type}</td>
                            <td className="border border-gray-300 px-3 py-1">
                                {row.type === 'Conditionnelle' ? (
                                    <input
                                        type="text"
                                        value={row.condition}
                                        onChange={e => handleCellChange(idx, 'condition', e.target.value)}
                                        className="w-full px-1 py-0.5 border rounded"
                                    />
                                ) : '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-1 font-mono">{row.siOui || '—'}</td>
                            <td className="border border-gray-300 px-3 py-1 font-mono">{row.siNon || '—'}</td>
                            <td className="border border-gray-300 px-3 py-1">
                                <input
                                    type="text"
                                    value={row.actions}
                                    onChange={e => handleCellChange(idx, 'actions', e.target.value)}
                                    className="w-full px-1 py-0.5 border rounded"
                                    placeholder="À remplir..."
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}