"use client";

import { useEffect, useRef } from "react";
import BpmnJS from "bpmn-js";
import "bpmn-js/dist/assets/bpmn-js.css";

const processData = [
    {
        id: "1.1",
        service: "RH",
        step: "1.1",
        task: "Identifier besoin de recrutement",
        type: "Séquentielle",
        condition: null,
        yes: "1.2",
        no: null,
    },
    {
        id: "1.2",
        service: "Finance",
        step: "1.2",
        task: "Valider budget",
        type: "Conditionnelle",
        condition: "Budget disponible ?",
        yes: "1.3",
        no: "1.1",
    },
    {
        id: "1.3",
        service: "Communication",
        step: "1.3",
        task: "Rédiger et publier l'offre",
        type: "Séquentielle",
        condition: null,
        yes: null,
        no: null,
    },
];

function generateBPMN() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
             id="Definitions_1" 
             targetNamespace="http://example.com">
  
  <process id="Process_1" isExecutable="false">
    <laneSet id="LaneSet_1">
      <!-- Lane RH -->
      <lane id="Lane_RH" name="RH">
        <flowNodeRef>StartEvent_1</flowNodeRef>
        <flowNodeRef>Task_1_1</flowNodeRef>
      </lane>
      <!-- Lane Finance -->
      <lane id="Lane_Finance" name="Finance">
        <flowNodeRef>Gateway_1_2</flowNodeRef>
      </lane>
      <!-- Lane Communication -->
      <lane id="Lane_Communication" name="Communication">
        <flowNodeRef>Task_1_3</flowNodeRef>
        <flowNodeRef>EndEvent_1</flowNodeRef>
      </lane>
    </laneSet>

    <!-- Éléments -->
    <startEvent id="StartEvent_1" name="Début" />
    <task id="Task_1_1" name="Identifier besoin de recrutement" />
    <exclusiveGateway id="Gateway_1_2" name="Budget disponible ?" isMarkerVisible="true" />
    <task id="Task_1_3" name="Rédiger et publier l'offre" />
    <endEvent id="EndEvent_1" name="Fin" />

    <!-- Sequence Flows -->
    <sequenceFlow id="Flow_Start" sourceRef="StartEvent_1" targetRef="Task_1_1" />
    <sequenceFlow id="Flow_1_1_2" sourceRef="Task_1_1" targetRef="Gateway_1_2" />
    <sequenceFlow id="Flow_1_2_yes" name="Oui" sourceRef="Gateway_1_2" targetRef="Task_1_3" />
    <sequenceFlow id="Flow_1_2_no" name="Non" sourceRef="Gateway_1_2" targetRef="Task_1_1" />
    <sequenceFlow id="Flow_End" sourceRef="Task_1_3" targetRef="EndEvent_1" />
  </process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">

      <!-- Lanes (comme ton exemple) -->
      <bpmndi:BPMNShape id="Lane_RH_di" bpmnElement="Lane_RH" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1200" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Finance_di" bpmnElement="Lane_Finance" isHorizontal="true">
        <dc:Bounds x="160" y="280" width="1200" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Communication_di" bpmnElement="Lane_Communication" isHorizontal="true">
        <dc:Bounds x="160" y="480" width="1200" height="200" />
      </bpmndi:BPMNShape>

      <!-- Éléments dans les lanes -->
      <!-- Lane RH -->
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="230" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="220" y="198" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_1_di" bpmnElement="Task_1_1">
        <dc:Bounds x="330" y="140" width="140" height="80" />
      </bpmndi:BPMNShape>

      <!-- Lane Finance -->
      <bpmndi:BPMNShape id="Gateway_1_2_di" bpmnElement="Gateway_1_2" isMarkerVisible="true">
        <dc:Bounds x="580" y="295" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="520" y="345" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Lane Communication -->
      <bpmndi:BPMNShape id="Task_1_3_di" bpmnElement="Task_1_3">
        <dc:Bounds x="680" y="520" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="880" y="542" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="870" y="578" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Connexions -->
      <bpmndi:BPMNEdge id="Flow_Start_di" bpmnElement="Flow_Start">
        <di:waypoint x="266" y="180" />
        <di:waypoint x="330" y="180" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_1_1_2_di" bpmnElement="Flow_1_1_2">
        <di:waypoint x="470" y="180" />
        <di:waypoint x="580" y="320" />
      </bpmndi:BPMNEdge>

      <!-- Oui : Finance → Communication -->
      <bpmndi:BPMNEdge id="Flow_1_2_yes_di" bpmnElement="Flow_1_2_yes">
        <di:waypoint x="630" y="320" />
        <di:waypoint x="680" y="560" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="640" y="295" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <!-- Non : Boucle Finance → RH (élégante comme ton exemple) -->
      <bpmndi:BPMNEdge id="Flow_1_2_no_di" bpmnElement="Flow_1_2_no">
        <di:waypoint x="605" y="345" />
        <di:waypoint x="605" y="400" />
        <di:waypoint x="410" y="400" />
        <di:waypoint x="410" y="220" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="500" y="370" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_End_di" bpmnElement="Flow_End">
        <di:waypoint x="820" y="560" />
        <di:waypoint x="880" y="560" />
      </bpmndi:BPMNEdge>

    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
}

export default function BpmnPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const viewer = new BpmnJS({
            container: containerRef.current,
        });

        const xml = generateBPMN();

        viewer.importXML(xml).then(() => {
            const canvas = viewer.get("canvas");
            canvas.zoom("fit-viewport", "auto");
        }).catch((err) => {
            console.error("Erreur d'import XML :", err);
        });

        return () => viewer.destroy();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2 className="text-xl font-semibold mb-4">Processus Recrutement avec Couloirs</h2>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "700px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            />
        </div>
    );
}