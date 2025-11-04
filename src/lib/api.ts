import { SCVRoot, Refs, Heritier, Compte } from './types';

const API_BASE = 'http://localhost:8001';

export const api = {
  async getRefs(): Promise<Refs> {
    const res = await fetch(`${API_BASE}/refs`);
    if (!res.ok) throw new Error('Failed to fetch refs');
    return res.json();
  },

  async generateFull(): Promise<SCVRoot> {
    const res = await fetch(`${API_BASE}/generate/full`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate full JSON');
    return res.json();
  },

  async generateDeposant(): Promise<{ identifiantDeposant: any; infosContact: any }> {
    const res = await fetch(`${API_BASE}/generate/deposant`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate deposant');
    return res.json();
  },

  async generateHeritier(index: number = 0): Promise<Heritier> {
    const res = await fetch(`${API_BASE}/generate/heritier?index=${index}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate heritier');
    return res.json();
  },

  async generateCompte(deposantId?: string): Promise<Compte> {
    const url = deposantId
      ? `${API_BASE}/generate/compte?deposant_id=${deposantId}`
      : `${API_BASE}/generate/compte`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate compte');
    return res.json();
  },

  async validate(data: SCVRoot): Promise<{ valid: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Validation failed');
    return res.json();
  }
};