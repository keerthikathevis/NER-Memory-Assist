import { dateKey, type MedicineSchedule } from './medicine';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

type NotificationPayload = {
  title: string;
  body: string;
  tag: string;
  data: { medicineId: string; scheduledFor: string; time: string };
};

const MEDICINE_IMAGE_CACHE = 'ner-memory-medicine-images-v1';

const cacheMedicinePhoto = async (medicine: MedicineSchedule): Promise<string | undefined> => {
  const photo = medicine.photoDataUrl?.trim();
  if (!photo || typeof caches === 'undefined') return undefined;

  const imageUrl = new URL(
    '/medicine-images/' + encodeURIComponent(medicine.id) + '.image',
    window.location.origin,
  ).toString();

  try {
    const cache = await caches.open(MEDICINE_IMAGE_CACHE);
    const existing = await cache.match(imageUrl);
    if (!existing) {
      const response = await fetch(photo);
      if (!response.ok) return undefined;
      await cache.put(imageUrl, response);
    }
    return imageUrl;
  } catch {
    return undefined;
  }
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
  const imageUrl = await cacheMedicinePhoto(medicine);

  const payload: NotificationPayload = {
    title: labels.title,
    body: medicine.name + ' · ' + labels.scheduled + ' ' + medicine.time,
    tag: 'ner-medicine-' + medicine.id + '-' + scheduledFor + '-' + medicine.time,
    data: { medicineId: medicine.id, scheduledFor, time: medicine.time },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const options = {
        body: payload.body,
        tag: payload.tag,
        data: payload.data,
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        ...(imageUrl ? { image: imageUrl } : {}),
        requireInteraction: true,
      };

      try {
        await registration.showNotification(payload.title, options);
      } catch {
        await registration.showNotification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          data: payload.data,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          requireInteraction: true,
        });
      }

      return true;
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: payload.data,
        icon: '/icon-192.svg',
        ...(imageUrl ? { image: imageUrl } : {}),
      });
    } catch {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        data: payload.data,
        icon: '/icon-192.svg',
      });
    }

    return true;
  } catch {
    return false;
  }
};
