export type MedicineFrequency = 'daily' | 'weekdays' | 'weekly';

export type MedicineSchedule = {
  id: string;
  name: string;
  photoDataUrl: string;
  instruction: string;
  time: string;
  frequency: MedicineFrequency;
  startDate: string;
  endDate: string;
  voiceInstruction: string;
  active: boolean;
};

export type MedicineEventStatus = 'scheduled' | 'taken' | 'delayed' | 'missed';

export type MedicineEvent = {
  id: string;
  medicineId: string;
  status: MedicineEventStatus;
  timestamp: string;
  scheduledFor: string;
};

export const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isScheduledForDate = (medicine: MedicineSchedule, date = new Date()) => {
  const current = dateKey(date);
  if (!medicine.active || current < medicine.startDate || (medicine.endDate && current > medicine.endDate)) return false;
  if (medicine.frequency === 'daily') return true;
  if (medicine.frequency === 'weekly') return date.getDay() === new Date(`${medicine.startDate}T00:00:00`).getDay();
  return date.getDay() > 0 && date.getDay() < 6;
};

export const defaultMedicineSchedules = (): MedicineSchedule[] => {
  const today = dateKey();
  return [
    {
      id: 'vitamin-d',
      name: 'Vitamin D',
      photoDataUrl: '',
      instruction: 'Take with breakfast and a glass of water.',
      time: '09:00',
      frequency: 'daily',
      startDate: today,
      endDate: '',
      voiceInstruction: 'Morning medicine. Take it with breakfast.',
      active: true,
    },
    {
      id: 'warm-water',
      name: 'Warm water',
      photoDataUrl: '',
      instruction: 'A gentle hydration reminder.',
      time: '13:00',
      frequency: 'daily',
      startDate: today,
      endDate: '',
      voiceInstruction: '',
      active: true,
    },
    {
      id: 'calcium',
      name: 'Calcium',
      photoDataUrl: '',
      instruction: 'Use the instruction entered by your caregiver.',
      time: '20:00',
      frequency: 'daily',
      startDate: today,
      endDate: '',
      voiceInstruction: 'Evening medicine reminder.',
      active: true,
    },
  ];
};