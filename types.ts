
export enum AdherenceStatus {
  TAKEN = 'Taken',
  MISSED = 'Missed',
  SNOOZED = 'Snoozed',
  PENDING = 'Pending'
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  compartment: number; // 1-7
  frequency: 'daily' | 'weekly' | 'custom';
  times: string[]; // ISO 8601 time strings (HH:mm)
  inventory: number;
  totalCapacity: number;
  color: string;
}

export interface AdherenceLog {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  actualTime?: string;
  status: AdherenceStatus;
  compartment: number;
}

export interface HealthSummary {
  weeklyAdherence: number;
  missedDoses: number;
  totalScheduled: number;
  aiAdvice: string;
}

export interface UserProfile {
  name: string;
  age: number | string;
  notes: string;
}

export interface CaregiverProfile {
  name: string;
  contact: string;
}
