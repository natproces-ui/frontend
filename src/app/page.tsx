// ============================================================================
// ÉTAPE 1 : Installation des dépendances
// ============================================================================

// Dans votre terminal, exécutez :
/*
npm install bpmn-js
npm install --save-dev @types/bpmn-js
*/

// ============================================================================
// ÉTAPE 2 : Fichier page.tsx complet avec bpmn-js
// ============================================================================

"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const BPMNViewer = dynamic(() => import('@/components/BPMNViewer'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Chargement du viewer...</div>
});

// ============================================================================
// TYPES
// ============================================================================

interface ProcessElement {
  id: string;
  service: string;
  step: string;
  task: string;
  type: "Séquentielle" | "Conditionnelle";
  condition?: string;
  yes?: string;
  no?: string;
}

// ============================================================================
// GÉNÉRATEUR BPMN XML
// ============================================================================

function generateBPMNXML(elements: ProcessElement[]): string {
  const services = Array.from(new Set(elements.map(el => el.service)));

  // Générer les lanes
  let lanesXML = '';
  let taskRefsMap: Record<string, string[]> = {};

  services.forEach(service => {
    taskRefsMap[service] = [];
  });

  elements.forEach(el => {
    taskRefsMap[el.service].push(`    <bpmn:flowNodeRef>Task_${el.id}</bpmn:flowNodeRef>`);
  });

  services.forEach(service => {
    const laneId = `Lane_${service.replace(/\s+/g, '_')}`;
    lanesXML += `
    <bpmn:lane id="${laneId}" name="${service}">
${taskRefsMap[service].join('\n')}
    </bpmn:lane>`;
  });

  // Générer les tâches
  let tasksXML = '';
  let flowsXML = '';
  let gatewaysXML = '';
  let shapesXML = '';
  let edgesXML = '';

  let yPos = 80;

  elements.forEach((el, idx) => {
    const taskId = `Task_${el.id}`;
    const xPos = 200 + (idx * 250);

    // Tâche
    tasksXML += `
    <bpmn:task id="${taskId}" name="${el.task}">
      <bpmn:incoming>Flow_to_${el.id}</bpmn:incoming>
      <bpmn:outgoing>Flow_from_${el.id}</bpmn:outgoing>
    </bpmn:task>`;

    // Shape pour le diagramme
    shapesXML += `
      <bpmndi:BPMNShape id="Shape_${taskId}" bpmnElement="${taskId}">
        <dc:Bounds x="${xPos}" y="${yPos}" width="100" height="80" />
      </bpmndi:BPMNShape>`;

    // Gateway si conditionnel
    if (el.type === "Conditionnelle") {
      const gwId = `Gateway_${el.id}`;
      gatewaysXML += `
    <bpmn:exclusiveGateway id="${gwId}" name="${el.condition || ''}">
      <bpmn:incoming>Flow_from_${el.id}</bpmn:incoming>
      <bpmn:outgoing>Flow_${el.id}_yes</bpmn:outgoing>
      <bpmn:outgoing>Flow_${el.id}_no</bpmn:outgoing>
    </bpmn:exclusiveGateway>`;

      shapesXML += `
      <bpmndi:BPMNShape id="Shape_${gwId}" bpmnElement="${gwId}" isMarkerVisible="true">
        <dc:Bounds x="${xPos + 125}" y="${yPos + 20}" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${xPos + 125}" y="${yPos}" width="90" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

      // Flux de la tâche au gateway
      flowsXML += `
    <bpmn:sequenceFlow id="Flow_from_${el.id}" sourceRef="${taskId}" targetRef="${gwId}" />`;

      edgesXML += `
      <bpmndi:BPMNEdge id="Edge_Flow_from_${el.id}" bpmnElement="Flow_from_${el.id}">
        <di:waypoint x="${xPos + 100}" y="${yPos + 40}" />
        <di:waypoint x="${xPos + 125}" y="${yPos + 45}" />
      </bpmndi:BPMNEdge>`;

      // Flux yes
      if (el.yes) {
        flowsXML += `
    <bpmn:sequenceFlow id="Flow_${el.id}_yes" name="Oui" sourceRef="${gwId}" targetRef="Task_${el.yes}" />`;

        edgesXML += `
      <bpmndi:BPMNEdge id="Edge_Flow_${el.id}_yes" bpmnElement="Flow_${el.id}_yes">
        <di:waypoint x="${xPos + 175}" y="${yPos + 45}" />
        <di:waypoint x="${xPos + 250}" y="${yPos + 40}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${xPos + 190}" y="${yPos + 25}" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`;
      }

      // Flux no
      if (el.no) {
        flowsXML += `
    <bpmn:sequenceFlow id="Flow_${el.id}_no" name="Non" sourceRef="${gwId}" targetRef="Task_${el.no}" />`;

        edgesXML += `
      <bpmndi:BPMNEdge id="Edge_Flow_${el.id}_no" bpmnElement="Flow_${el.id}_no">
        <di:waypoint x="${xPos + 150}" y="${yPos + 70}" />
        <di:waypoint x="${xPos + 150}" y="${yPos + 120}" />
        <di:waypoint x="250" y="${yPos + 120}" />
        <di:waypoint x="250" y="${yPos + 80}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${xPos + 155}" y="${yPos + 90}" width="23" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`;
      }
    } else if (el.yes) {
      // Flux séquentiel simple
      flowsXML += `
    <bpmn:sequenceFlow id="Flow_from_${el.id}" sourceRef="${taskId}" targetRef="Task_${el.yes}" />`;

      edgesXML += `
      <bpmndi:BPMNEdge id="Edge_Flow_from_${el.id}" bpmnElement="Flow_from_${el.id}">
        <di:waypoint x="${xPos + 100}" y="${yPos + 40}" />
        <di:waypoint x="${xPos + 250}" y="${yPos + 40}" />
      </bpmndi:BPMNEdge>`;
    }
  });

  // Start et End events
  const startXML = `
    <bpmn:startEvent id="StartEvent_1" name="Début">
      <bpmn:outgoing>Flow_start</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_start" sourceRef="StartEvent_1" targetRef="Task_${elements[0].id}" />`;

  const endXML = `
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_end</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_end" sourceRef="Task_${elements[elements.length - 1].id}" targetRef="EndEvent_1" />`;

  shapesXML += `
      <bpmndi:BPMNShape id="Shape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="132" y="${yPos + 22}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="135" y="${yPos + 65}" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="${200 + elements.length * 250}" y="${yPos + 22}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${200 + elements.length * 250 + 3}" y="${yPos + 65}" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

  edgesXML += `
      <bpmndi:BPMNEdge id="Edge_Flow_start" bpmnElement="Flow_start">
        <di:waypoint x="168" y="${yPos + 40}" />
        <di:waypoint x="200" y="${yPos + 40}" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_end" bpmnElement="Flow_end">
        <di:waypoint x="${200 + (elements.length - 1) * 250 + 100}" y="${yPos + 40}" />
        <di:waypoint x="${200 + elements.length * 250}" y="${yPos + 40}" />
      </bpmndi:BPMNEdge>`;

  const bpmnXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Processus" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">${lanesXML}
    </bpmn:laneSet>${startXML}${tasksXML}${gatewaysXML}${endXML}${flowsXML}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Shape_Participant_1" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="120" y="50" width="${300 + elements.length * 250}" height="${services.length * 200 + 100}" />
      </bpmndi:BPMNShape>${shapesXML}${edgesXML}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return bpmnXML;
}

// ============================================================================
// COMPOSANT TABLE
// ============================================================================

function ProcessTable({ data, setData }: { data: ProcessElement[], setData: (data: ProcessElement[]) => void }) {
  const handleCellChange = (rowIndex: number, field: keyof ProcessElement, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setData(newData);
  };

  const addRow = () => {
    const newId = (data.length + 1).toString();
    setData([...data, {
      id: `1.${newId}`,
      service: "Nouveau service",
      step: `1.${newId}`,
      task: "Nouvelle tâche",
      type: "Séquentielle",
      yes: "",
    }]);
  };

  const deleteRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-100 dark:bg-blue-900">
            <th className="border border-gray-300 px-2 py-2">ID</th>
            <th className="border border-gray-300 px-2 py-2">Service</th>
            <th className="border border-gray-300 px-2 py-2">Étape</th>
            <th className="border border-gray-300 px-2 py-2">Tâche</th>
            <th className="border border-gray-300 px-2 py-2">Type</th>
            <th className="border border-gray-300 px-2 py-2">Condition</th>
            <th className="border border-gray-300 px-2 py-2">Si Oui →</th>
            <th className="border border-gray-300 px-2 py-2">Si Non →</th>
            <th className="border border-gray-300 px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.id} onChange={(e) => handleCellChange(idx, 'id', e.target.value)} className="w-full px-1 py-1 bg-transparent" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.service} onChange={(e) => handleCellChange(idx, 'service', e.target.value)} className="w-full px-1 py-1 bg-transparent" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.step} onChange={(e) => handleCellChange(idx, 'step', e.target.value)} className="w-full px-1 py-1 bg-transparent" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.task} onChange={(e) => handleCellChange(idx, 'task', e.target.value)} className="w-full px-1 py-1 bg-transparent" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <select value={row.type} onChange={(e) => handleCellChange(idx, 'type', e.target.value as any)} className="w-full px-1 py-1 bg-transparent">
                  <option value="Séquentielle">Séquentielle</option>
                  <option value="Conditionnelle">Conditionnelle</option>
                </select>
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.condition || ''} onChange={(e) => handleCellChange(idx, 'condition', e.target.value)} disabled={row.type === "Séquentielle"} className="w-full px-1 py-1 bg-transparent disabled:opacity-50" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.yes || ''} onChange={(e) => handleCellChange(idx, 'yes', e.target.value)} className="w-full px-1 py-1 bg-transparent" />
              </td>
              <td className="border border-gray-300 px-2 py-1">
                <input type="text" value={row.no || ''} onChange={(e) => handleCellChange(idx, 'no', e.target.value)} disabled={row.type === "Séquentielle"} className="w-full px-1 py-1 bg-transparent disabled:opacity-50" />
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                <button onClick={() => deleteRow(idx)} className="text-red-600 hover:text-red-800 font-bold">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        ➕ Ajouter une ligne
      </button>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ProcessMate() {
  const [processData, setProcessData] = useState<ProcessElement[]>([
    { id: "1.1", service: "RH", step: "1.1", task: "Identifier besoin", type: "Séquentielle", yes: "1.2" },
    { id: "1.2", service: "Finance", step: "1.2", task: "Valider budget", type: "Conditionnelle", condition: "Budget disponible ?", yes: "1.3", no: "1.1" },
    { id: "1.3", service: "RH", step: "1.3", task: "Publier annonce", type: "Séquentielle" },
  ]);

  const [bpmnXML, setBpmnXML] = useState<string>("");
  const [showXML, setShowXML] = useState(false);

  const handleGenerate = () => {
    try {
      if (processData.length === 0) {
        alert("Le tableau est vide.");
        return;
      }
      const xml = generateBPMNXML(processData);
      setBpmnXML(xml);
      console.log("✅ BPMN généré");
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleExport = () => {
    if (!bpmnXML) {
      alert("Générer d'abord le BPMN.");
      return;
    }
    const blob = new Blob([bpmnXML], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "process-diagram.bpmn";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setProcessData([
      { id: "1.1", service: "RH", step: "1.1", task: "Identifier besoin", type: "Séquentielle", yes: "1.2" },
      { id: "1.2", service: "Finance", step: "1.2", task: "Valider budget", type: "Conditionnelle", condition: "Budget disponible ?", yes: "1.3", no: "1.1" },
      { id: "1.3", service: "RH", step: "1.3", task: "Publier annonce", type: "Séquentielle" },
    ]);
    setBpmnXML("");
    setShowXML(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">🧩 ProcessMate avec bpmn-js</h1>
        </header>

        <section className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">📋 Tableau</h2>
          <ProcessTable data={processData} setData={setProcessData} />
        </section>

        <section className="mb-6 flex justify-center gap-4">
          <button onClick={handleGenerate} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md">🔄 Générer</button>
          <button onClick={handleExport} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md" disabled={!bpmnXML}>📤 Exporter</button>
          <button onClick={() => setShowXML(!showXML)} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md" disabled={!bpmnXML}>{showXML ? '🖼️ Diagramme' : '📝 XML'}</button>
          <button onClick={handleReset} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold shadow-md">♻️ Reset</button>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">{showXML ? '📝 XML' : '🎨 Diagramme'}</h2>
          {showXML ? (
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs max-h-96">{bpmnXML || 'Aucun XML'}</pre>
          ) : (
            <BPMNViewer xml={bpmnXML} />
          )}
        </section>
      </div>
    </div>
  );
}