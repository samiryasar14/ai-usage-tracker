import * as Notifications from "expo-notifications";

// Foreground notifications are suppressed by Expo unless a handler is set
// that explicitly opts back in. This only affects notifications fired while
// the app is open/backgrounded — see the in-app copy on PairingScreen for
// the honest limitation (no wake-from-fully-closed support without a cloud
// push service, which this local-network-only app deliberately doesn't have).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Requests notification permission if not already determined; returns whether it's granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Reads current permission status without prompting — used to surface a "notifications are off" note. */
export async function getNotificationPermissionGranted(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

/** Fires an immediate local notification — no server/push service involved. */
export async function notifyLocal(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
