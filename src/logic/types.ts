// logic/types.ts - TYPES PARTAGÉS

export interface Table1Row {
    id: string;
    étape: string;
    typeBpmn: 'StartEvent' | 'Task' | 'ExclusiveGateway' | 'EndEvent' | 'UserTask';
    département: string;
    acteur: string;
    condition: string;
    outputOui: string;
    outputNon: string;
    outil: string;
}

export interface NodePosition {
    x: number;
    y: number;
    layer: number;
    laneIndex: number;
    acteur: string;
}