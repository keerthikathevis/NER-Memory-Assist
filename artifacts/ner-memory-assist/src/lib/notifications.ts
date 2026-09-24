import { dateKey, type MedicineSchedule } from './medicine';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

type NotificationPayload = {
  title: string;
  body: string;
  tag: string;
  data: { medicineId: string; scheduledFor: string; time: string };
};

export const notificationPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
};

export const sendMedicineNotification = async (
  medicine: MedicineSchedule,
  labels: { title: string; scheduled: string; taken: string; later: string },
): Promise<boolean> => {
  if (notificationPermission() !== 'granted') return false;

  const scheduledFor = dateKey();
  const photo = medicine.photoDataUrl?.trim();
  const notificationImage = photo || '/icon-192.svg';

  const payload: NotificationPayload = {
    title: labels.title,
    body: medicine.name + ' · ' + labels.scheduled + ' ' + medicine.time,
    tag: 'ner-medicine-' + medicine.id + '-' + scheduledFor + '-' + medicine.time,
    data: { medicineId: medicine.id, scheduledFor, time: medicine.time },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: payload.data,
        image: notificationImage,
        icon: notificationImage,
        badge: '/icon-192.svg',
        requireInteraction: true,
        actions: [
          { action: 'taken', title: labels.taken },
          { action: 'later', title: labels.later },
        ],
      });
      return true;
    }

    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: payload.data,
      image: notificationImage,
      icon: notificationImage,
    });
    return true;
  } catch {
    return false;
  }
};
