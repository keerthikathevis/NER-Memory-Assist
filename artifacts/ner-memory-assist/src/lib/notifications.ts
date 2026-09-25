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
  const payload: NotificationPayload = {
    title: labels.title,
    body: medicine.name + ' · ' + labels.scheduled + ' ' + medicine.time,
    tag: 'ner-medicine-' + medicine.id + '-' + scheduledFor + '-' + medicine.time,
    data: { medicineId: medicine.id, scheduledFor, time: medicine.time },
  };

  // Medicine photos are optional. The reminder itself only uses the stable
  // app icon, so a missing photo can never prevent the notification.
  const options = {
    body: payload.body,
    tag: payload.tag,
    data: payload.data,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    requireInteraction: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            window.setTimeout(() => reject(new Error('Service worker timeout')), 5000),
          ),
        ]);
        await registration.showNotification(payload.title, options);
        return true;
      } catch {
        // Fall through to the regular Notification API.
      }
    }

    new Notification(payload.title, options);
    return true;
  } catch {
    return false;
  }
};
