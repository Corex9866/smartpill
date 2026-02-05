
import React from 'react';
import { 
  Bell, 
  Calendar, 
  Settings, 
  BarChart3, 
  Plus, 
  Pill, 
  User, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Wifi,
  Battery
} from 'lucide-react';

export const COMPARTMENTS = [1, 2, 3, 4, 5, 6, 7];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'medications', label: 'My Pills', icon: <Pill className="w-5 h-5" /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const COLORS = [
  'bg-blue-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

export const MEDICINE_QUOTES = [
  "Medicines cure diseases only when taken the right way.",
  "The right dose heals; the wrong dose harms.",
  "Medicine is powerful—use it wisely.",
  "Never share your medicines; your cure may be someone else’s poison.",
  "Follow the prescription, not assumptions.",
  "A doctor’s advice is as important as the medicine itself.",
  "Trust your doctor, take your medicine on time.",
  "Incomplete treatment leads to incomplete recovery.",
  "Don’t stop medicines just because you feel better.",
  "Take medicine on time—health doesn’t wait.",
  "Skipping doses skips recovery.",
  "Consistency in medication is consistency in healing.",
  "Finish the course, don’t invite relapse.",
  "Self-medication can be self-destruction.",
  "Antibiotics are not candies—use responsibly.",
  "Read the label before you swallow.",
  "When in doubt, ask a doctor—not Google."
];
