export type LeaveType = 'ferie' | 'permesso' | 'malattia' | 'smart-working';

export interface Person {
  id: string;
  name: string;
  colorClass: string;
  monthStr?: string;
}

export interface LeaveRecord {
  [personId: string]: {
    [dateString: string]: LeaveType;
  }
}

export const LEAVE_COLORS: Record<LeaveType, string> = {
  'ferie': 'bg-[#5B60F6] text-white',
  'permesso': 'bg-[#F5B041] text-white',
  'malattia': 'bg-[#F05353] text-white',
  'smart-working': 'bg-[#40C969] text-white',
};

export const LEAVE_DOTS: Record<LeaveType, string> = {
  'ferie': 'bg-[#5B60F6]',
  'permesso': 'bg-[#F5B041]',
  'malattia': 'bg-[#F05353]',
  'smart-working': 'bg-[#40C969]',
};

export const LEAVE_LABELS: Record<LeaveType, string> = {
  'ferie': 'Ferie',
  'permesso': 'Permesso',
  'malattia': 'Malattia',
  'smart-working': 'Smart working',
};

export const LEAVE_INITIALS: Record<LeaveType, string> = {
  'ferie': 'F',
  'permesso': 'P',
  'malattia': 'M',
  'smart-working': 'SW',
};
