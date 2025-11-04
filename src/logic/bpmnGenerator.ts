// bpmnGenerator.ts
export interface ProcessRow {
    id: string;
    service: string;
    step: string;
    task: string;
    type: "Séquentielle" | "Conditionnelle";
    condition: string;
    yes: string;
    no: string;
}

interface TaskPosition {
    x: number;
    y: number;
    service: string;
    laneIndex: number;
}

interface BPMNGeneratorConfig {
    laneHeight?: number;
    taskWidth?: number;
    taskHeight?: number;
    taskSpacing?: number;
    startX?: number;
    startY?: number;
}

export class BPMNGenerator {
    private config: Required<BPMNGeneratorConfig>;
    private taskPositions: Map<string, TaskPosition>;
    private serviceMap: Map<string, ProcessRow[]>;
    private allSteps: Map<string, ProcessRow>;
    private columnPositions: Map<string, number>;

    constructor(config: BPMNGeneratorConfig = {}) {
        this.config = {
            laneHeight: config.laneHeight || 200,
            taskWidth: config.taskWidth || 120,
            taskHeight: config.taskHeight || 80,
            taskSpacing: config.taskSpacing || 180,
            startX: config.startX || 280,
            startY: config.startY || 80
        };
        this.taskPositions = new Map();
        this.serviceMap = new Map();
        this.allSteps = new Map();
        this.columnPositions = new Map();
    }

    /**
     * Génère le XML BPMN complet à partir des données du processus
     */
    public generate(data: ProcessRow[]): string {
        if (data.length === 0) {
            throw new Error("Aucune donnée à générer");
        }

        // Initialiser les structures de données
        this.groupByService(data);
        this.buildStepMap(data);
        this.calculateColumnPositions(data);

        const services = Array.from(this.serviceMap.keys());

        const lanesXML = this.generateLanes(services);
        const { tasksXML, sequenceFlowsXML } = this.generateTasks(data, services);
        const { shapesXML, edgesXML } = this.generateDiagram(services, data);

        return this.buildXML(lanesXML, tasksXML, sequenceFlowsXML, shapesXML, edgesXML);
    }

    /**
     * Groupe les tâches par service
     */
    private groupByService(data: ProcessRow[]): void {
        this.serviceMap.clear();
        data.forEach(row => {
            if (!this.serviceMap.has(row.service)) {
                this.serviceMap.set(row.service, []);
            }
            this.serviceMap.get(row.service)!.push(row);
        });
    }

    /**
     * Construit une map de toutes les étapes pour un accès rapide
     */
    private buildStepMap(data: ProcessRow[]): void {
        this.allSteps.clear();
        data.forEach(row => {
            this.allSteps.set(row.step, row);
        });
    }

    /**
     * Calcule les positions en colonnes pour chaque étape
     */
    private calculateColumnPositions(data: ProcessRow[]): void {
        this.columnPositions.clear();

        // Trier les étapes par ordre chronologique
        const sortedSteps = data.slice().sort((a, b) => {
            const [majorA, minorA] = a.step.split('.').map(Number);
            const [majorB, minorB] = b.step.split('.').map(Number);
            return majorA !== majorB ? majorA - majorB : minorA - minorB;
        });

        // Assigner une colonne à chaque étape
        sortedSteps.forEach((row, index) => {
            this.columnPositions.set(row.step, index);
        });
    }

    /**
     * Génère les lanes (couloirs) pour chaque service
     */
    private generateLanes(services: string[]): string {
        let lanesXML = '';

        services.forEach((service, serviceIndex) => {
            const laneId = this.getLaneId(service);
            const rows = this.serviceMap.get(service)!;

            let flowNodeRefs = '';

            // Ajouter Start dans la première lane
            if (serviceIndex === 0) {
                flowNodeRefs += `        <flowNodeRef>Start</flowNodeRef>\n`;
            }

            rows.forEach(row => {
                const taskId = this.getTaskId(row.step);
                flowNodeRefs += `        <flowNodeRef>${taskId}</flowNodeRef>\n`;

                if (row.type === "Conditionnelle") {
                    const gatewayId = this.getGatewayId(row.step);
                    flowNodeRefs += `        <flowNodeRef>${gatewayId}</flowNodeRef>\n`;
                }
            });

            // Ajouter End dans la dernière lane
            if (serviceIndex === services.length - 1) {
                flowNodeRefs += `        <flowNodeRef>End</flowNodeRef>\n`;
            }

            lanesXML += `      <lane id="${laneId}" name="${this.escapeXml(service)}">
${flowNodeRefs}      </lane>\n`;
        });

        return lanesXML;
    }

    /**
     * Génère les tâches et les flux de séquence
     */
    private generateTasks(data: ProcessRow[], services: string[]): { tasksXML: string, sequenceFlowsXML: string } {
        let tasksXML = `    <startEvent id="Start" name="Début" />\n`;
        let sequenceFlowsXML = '';

        // Positionner toutes les tâches
        data.forEach((row) => {
            const columnIndex = this.columnPositions.get(row.step) || 0;
            const laneIndex = services.indexOf(row.service);

            const taskX = this.config.startX + (columnIndex * this.config.taskSpacing);
            const taskY = this.config.startY + (laneIndex * this.config.laneHeight) + 60;

            this.taskPositions.set(row.step, { x: taskX, y: taskY, service: row.service, laneIndex });
        });

        // Générer les tâches XML
        data.forEach((row) => {
            const taskId = this.getTaskId(row.step);

            if (row.type === "Conditionnelle") {
                const gatewayId = this.getGatewayId(row.step);

                tasksXML += `    <userTask id="${taskId}" name="${this.escapeXml(row.task)}" />\n`;
                tasksXML += `    <exclusiveGateway id="${gatewayId}" name="${this.escapeXml(row.condition)}" />\n`;

                // Flow: tâche -> gateway
                sequenceFlowsXML += `    <sequenceFlow id="Flow_${taskId}_${gatewayId}" sourceRef="${taskId}" targetRef="${gatewayId}" />\n`;

                // Flows conditionnels - CORRECTION: gérer les cas vides
                if (row.yes && row.yes.trim()) {
                    const targetId = this.resolveTargetId(row.yes);
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${gatewayId}_yes" name="Oui" sourceRef="${gatewayId}" targetRef="${targetId}" />\n`;
                } else {
                    // Si pas de yes, aller vers End
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${gatewayId}_yes" name="Oui" sourceRef="${gatewayId}" targetRef="End" />\n`;
                }

                if (row.no && row.no.trim()) {
                    const targetId = this.resolveTargetId(row.no);
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${gatewayId}_no" name="Non" sourceRef="${gatewayId}" targetRef="${targetId}" />\n`;
                } else {
                    // Si pas de no, aller vers End
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${gatewayId}_no" name="Non" sourceRef="${gatewayId}" targetRef="End" />\n`;
                }
            } else {
                // Tâche séquentielle
                tasksXML += `    <userTask id="${taskId}" name="${this.escapeXml(row.task)}" />\n`;

                // Flow vers l'étape suivante - CORRECTION: gérer les cas vides
                if (row.yes && row.yes.trim()) {
                    const targetId = this.resolveTargetId(row.yes);
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${taskId}_next" sourceRef="${taskId}" targetRef="${targetId}" />\n`;
                } else {
                    // Si pas de "yes", connecter à End
                    sequenceFlowsXML += `    <sequenceFlow id="Flow_${taskId}_end" sourceRef="${taskId}" targetRef="End" />\n`;
                }
            }
        });

        // Ajouter l'événement de fin
        tasksXML += `    <endEvent id="End" name="Fin" />\n`;

        // Flow de Start vers la première tâche
        if (data.length > 0) {
            const firstTaskId = this.getTaskId(data[0].step);
            sequenceFlowsXML = `    <sequenceFlow id="Flow_start" sourceRef="Start" targetRef="${firstTaskId}" />\n` + sequenceFlowsXML;
        }

        return { tasksXML, sequenceFlowsXML };
    }

    /**
     * Génère les formes et arêtes du diagramme
     */
    private generateDiagram(services: string[], data: ProcessRow[]): { shapesXML: string, edgesXML: string } {
        let shapesXML = '';
        let edgesXML = '';

        // Formes des lanes
        services.forEach((service, serviceIndex) => {
            const laneId = this.getLaneId(service);
            const laneY = this.config.startY + (serviceIndex * this.config.laneHeight);

            shapesXML += `      <bpmndi:BPMNShape id="${laneId}_di" bpmnElement="${laneId}" isHorizontal="true">
        <dc:Bounds x="160" y="${laneY}" width="3000" height="${this.config.laneHeight}" />
      </bpmndi:BPMNShape>\n`;
        });

        // Event de début (dans la première lane)
        const startX = 200;
        const startY = this.config.startY + 60;
        shapesXML += `      <bpmndi:BPMNShape id="Start_di" bpmnElement="Start">
        <dc:Bounds x="${startX}" y="${startY}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${startX + 3}" y="${startY + 40}" width="30" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>\n`;

        // Edge: Start -> première tâche
        if (data.length > 0) {
            const firstPos = this.taskPositions.get(data[0].step)!;
            edgesXML += `      <bpmndi:BPMNEdge id="Flow_start_di" bpmnElement="Flow_start">
        <di:waypoint x="${startX + 36}" y="${startY + 18}" />
        <di:waypoint x="${firstPos.x}" y="${firstPos.y + this.config.taskHeight / 2}" />
      </bpmndi:BPMNEdge>\n`;
        }

        // Formes des tâches et gateways
        data.forEach((row) => {
            const taskId = this.getTaskId(row.step);
            const pos = this.taskPositions.get(row.step)!;

            shapesXML += `      <bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">
        <dc:Bounds x="${pos.x}" y="${pos.y}" width="${this.config.taskWidth}" height="${this.config.taskHeight}" />
      </bpmndi:BPMNShape>\n`;

            if (row.type === "Conditionnelle") {
                const gatewayId = this.getGatewayId(row.step);
                const gatewayX = pos.x + this.config.taskWidth + 40;
                const gatewayY = pos.y + (this.config.taskHeight / 2) - 25;

                shapesXML += `      <bpmndi:BPMNShape id="${gatewayId}_di" bpmnElement="${gatewayId}" isMarkerVisible="true">
        <dc:Bounds x="${gatewayX}" y="${gatewayY}" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${gatewayX - 15}" y="${gatewayY + 55}" width="80" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>\n`;

                // Edge: tâche -> gateway
                edgesXML += `      <bpmndi:BPMNEdge id="Flow_${taskId}_${gatewayId}_di" bpmnElement="Flow_${taskId}_${gatewayId}">
        <di:waypoint x="${pos.x + this.config.taskWidth}" y="${pos.y + this.config.taskHeight / 2}" />
        <di:waypoint x="${gatewayX}" y="${gatewayY + 25}" />
      </bpmndi:BPMNEdge>\n`;

                const endPos = this.getEndPosition(services);

                // Edges conditionnels - CORRECTION: gérer les connexions vers End
                if (row.yes && row.yes.trim()) {
                    const targetPos = this.getTargetPosition(row.yes);
                    if (targetPos) {
                        edgesXML += this.generateConditionalEdge(gatewayId, 'yes', gatewayX, gatewayY, targetPos, true);
                    } else {
                        // Connecter à End
                        edgesXML += this.generateEdgeToEnd(gatewayId, 'yes', gatewayX, gatewayY, endPos, true);
                    }
                } else {
                    // Pas de yes, connecter à End
                    edgesXML += this.generateEdgeToEnd(gatewayId, 'yes', gatewayX, gatewayY, endPos, true);
                }

                if (row.no && row.no.trim()) {
                    const targetPos = this.getTargetPosition(row.no);
                    if (targetPos) {
                        edgesXML += this.generateConditionalEdge(gatewayId, 'no', gatewayX, gatewayY, targetPos, false);
                    } else {
                        // Connecter à End
                        edgesXML += this.generateEdgeToEnd(gatewayId, 'no', gatewayX, gatewayY, endPos, false);
                    }
                } else {
                    // Pas de no, connecter à End
                    edgesXML += this.generateEdgeToEnd(gatewayId, 'no', gatewayX, gatewayY, endPos, false);
                }
            } else {
                // Edge séquentiel - CORRECTION: gérer les connexions vers End
                if (row.yes && row.yes.trim()) {
                    const targetPos = this.getTargetPosition(row.yes);
                    if (targetPos) {
                        edgesXML += this.generateSequentialEdge(taskId, pos, targetPos);
                    } else {
                        // Connecter à End
                        const endPos = this.getEndPosition(services);
                        edgesXML += `      <bpmndi:BPMNEdge id="Flow_${taskId}_end_di" bpmnElement="Flow_${taskId}_end">
        <di:waypoint x="${pos.x + this.config.taskWidth}" y="${pos.y + this.config.taskHeight / 2}" />
        <di:waypoint x="${endPos.x}" y="${endPos.y + 18}" />
      </bpmndi:BPMNEdge>\n`;
                    }
                } else {
                    // Pas de yes, connecter à End
                    const endPos = this.getEndPosition(services);
                    edgesXML += `      <bpmndi:BPMNEdge id="Flow_${taskId}_end_di" bpmnElement="Flow_${taskId}_end">
        <di:waypoint x="${pos.x + this.config.taskWidth}" y="${pos.y + this.config.taskHeight / 2}" />
        <di:waypoint x="${endPos.x}" y="${endPos.y + 18}" />
      </bpmndi:BPMNEdge>\n`;
                }
            }
        });

        // Event de fin
        const endPos = this.getEndPosition(services);
        shapesXML += `      <bpmndi:BPMNShape id="End_di" bpmnElement="End">
        <dc:Bounds x="${endPos.x}" y="${endPos.y}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${endPos.x + 8}" y="${endPos.y + 40}" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>\n`;

        return { shapesXML, edgesXML };
    }

    /**
     * Génère un edge conditionnel avec waypoints appropriés
     */
    private generateConditionalEdge(
        gatewayId: string,
        type: 'yes' | 'no',
        gatewayX: number,
        gatewayY: number,
        targetPos: TaskPosition,
        isYes: boolean
    ): string {
        const gatewayCenterX = gatewayX + 25;
        const gatewayCenterY = gatewayY + 25;
        const targetCenterX = targetPos.x + this.config.taskWidth / 2;
        const targetCenterY = targetPos.y + this.config.taskHeight / 2;

        let waypoints = '';

        // Si le target est dans une lane différente, créer des waypoints
        if (Math.abs(targetCenterY - gatewayCenterY) > 20) {
            waypoints = `        <di:waypoint x="${gatewayCenterX}" y="${gatewayCenterY}" />
        <di:waypoint x="${gatewayCenterX + (isYes ? 50 : -50)}" y="${gatewayCenterY}" />
        <di:waypoint x="${gatewayCenterX + (isYes ? 50 : -50)}" y="${targetCenterY}" />
        <di:waypoint x="${targetPos.x}" y="${targetCenterY}" />`;
        } else {
            waypoints = `        <di:waypoint x="${gatewayCenterX}" y="${gatewayCenterY}" />
        <di:waypoint x="${targetPos.x}" y="${targetCenterY}" />`;
        }

        const label = type === 'yes' ? 'Oui' : 'Non';

        return `      <bpmndi:BPMNEdge id="Flow_${gatewayId}_${type}_di" bpmnElement="Flow_${gatewayId}_${type}">
${waypoints}
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${gatewayCenterX + 10}" y="${gatewayCenterY - 10}" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>\n`;
    }

    /**
     * NOUVELLE MÉTHODE: Génère un edge vers End depuis un gateway
     */
    private generateEdgeToEnd(
        gatewayId: string,
        type: 'yes' | 'no',
        gatewayX: number,
        gatewayY: number,
        endPos: { x: number, y: number },
        isYes: boolean
    ): string {
        const gatewayCenterX = gatewayX + 25;
        const gatewayCenterY = gatewayY + 25;
        const endCenterY = endPos.y + 18;

        let waypoints = '';

        // Créer des waypoints pour aller vers End
        if (Math.abs(endCenterY - gatewayCenterY) > 20) {
            waypoints = `        <di:waypoint x="${gatewayCenterX}" y="${gatewayCenterY}" />
        <di:waypoint x="${gatewayCenterX + (isYes ? 50 : -50)}" y="${gatewayCenterY}" />
        <di:waypoint x="${gatewayCenterX + (isYes ? 50 : -50)}" y="${endCenterY}" />
        <di:waypoint x="${endPos.x}" y="${endCenterY}" />`;
        } else {
            waypoints = `        <di:waypoint x="${gatewayCenterX}" y="${gatewayCenterY}" />
        <di:waypoint x="${endPos.x}" y="${endCenterY}" />`;
        }

        const label = type === 'yes' ? 'Oui' : 'Non';

        return `      <bpmndi:BPMNEdge id="Flow_${gatewayId}_${type}_di" bpmnElement="Flow_${gatewayId}_${type}">
${waypoints}
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${gatewayCenterX + 10}" y="${gatewayCenterY - 10}" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>\n`;
    }

    /**
     * Génère un edge séquentiel
     */
    private generateSequentialEdge(taskId: string, sourcePos: TaskPosition, targetPos: TaskPosition): string {
        const sourceCenterY = sourcePos.y + this.config.taskHeight / 2;
        const targetCenterY = targetPos.y + this.config.taskHeight / 2;

        let waypoints = '';

        if (Math.abs(targetCenterY - sourceCenterY) > 20) {
            // Si changement de lane, ajouter des waypoints intermédiaires
            const midX = sourcePos.x + this.config.taskWidth + 50;
            waypoints = `        <di:waypoint x="${sourcePos.x + this.config.taskWidth}" y="${sourceCenterY}" />
        <di:waypoint x="${midX}" y="${sourceCenterY}" />
        <di:waypoint x="${midX}" y="${targetCenterY}" />
        <di:waypoint x="${targetPos.x}" y="${targetCenterY}" />`;
        } else {
            waypoints = `        <di:waypoint x="${sourcePos.x + this.config.taskWidth}" y="${sourceCenterY}" />
        <di:waypoint x="${targetPos.x}" y="${targetCenterY}" />`;
        }

        return `      <bpmndi:BPMNEdge id="Flow_${taskId}_next_di" bpmnElement="Flow_${taskId}_next">
${waypoints}
      </bpmndi:BPMNEdge>\n`;
    }

    /**
     * Récupère la position d'une cible (étape ou service)
     */
    private getTargetPosition(target: string): TaskPosition | null {
        if (!target || !target.trim()) return null;

        // Vérifier si c'est "End" ou "Fin"
        if (target.toLowerCase() === 'end' || target.toLowerCase() === 'fin') {
            return null;
        }

        if (target.includes('.')) {
            // C'est une étape
            return this.taskPositions.get(target) || null;
        }

        // C'est un service - trouver la première tâche de ce service
        const rows = this.serviceMap.get(target);
        if (rows && rows.length > 0) {
            return this.taskPositions.get(rows[0].step) || null;
        }

        return null;
    }

    /**
     * Calcule la position de l'événement de fin
     */
    private getEndPosition(services: string[]): { x: number, y: number } {
        const maxColumn = Math.max(...Array.from(this.columnPositions.values()));
        const endX = this.config.startX + ((maxColumn + 1) * this.config.taskSpacing) + 100;
        const endY = this.config.startY + ((services.length - 1) * this.config.laneHeight) + 60;
        return { x: endX, y: endY };
    }

    /**
     * Construit le XML BPMN complet
     */
    private buildXML(
        lanesXML: string,
        tasksXML: string,
        sequenceFlowsXML: string,
        shapesXML: string,
        edgesXML: string
    ): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
             id="Definitions_1" 
             targetNamespace="http://example.com"
             exporter="BPMN Voice Generator"
             exporterVersion="1.0.0">
  <process id="Process_1" isExecutable="false">
    <laneSet id="LaneSet_1">
${lanesXML}    </laneSet>
${tasksXML}
${sequenceFlowsXML}
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${shapesXML}
${edgesXML}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
    }

    // === Méthodes utilitaires ===

    private getLaneId(service: string): string {
        return `Lane_${service.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    }

    private getTaskId(step: string): string {
        return `Task_${step.replace(/\./g, '_')}`;
    }

    private getGatewayId(step: string): string {
        return `Gateway_${step.replace(/\./g, '_')}`;
    }

    private resolveTargetId(target: string): string {
        if (!target || !target.trim()) return 'End';

        // Si c'est un numéro d'étape (ex: "1.3")
        if (target.includes('.')) {
            return this.getTaskId(target);
        }

        // Si c'est "End" ou "Fin"
        if (target.toLowerCase() === 'end' || target.toLowerCase() === 'fin') {
            return 'End';
        }

        // Sinon c'est un nom de service - trouver la première tâche
        const rows = this.serviceMap.get(target);
        if (rows && rows.length > 0) {
            return this.getTaskId(rows[0].step);
        }

        return 'End';
    }

    private escapeXml(text: string): string {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

// Fonction helper pour usage simple
export function generateBPMN(data: ProcessRow[], config?: BPMNGeneratorConfig): string {
    const generator = new BPMNGenerator(config);
    return generator.generate(data);
}