import type { MedicineSchedule } from './medicine';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export const notificationPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
};

export const sendMedicineNotification = (medicine: MedicineSchedule, labels: { title: string; scheduled: string; taken: string; later: string }) => {
  if (notificationPermission() !== 'granted') return false;
  new Notification(labels.title, {
    body: `${medicine.name} · ${labels.scheduled} ${medicine.time}`,
    tag: `ner-medicine-${medicine.id}`,
  });
  return true;
};