let notificationPermission: NotificationPermission = 'default';

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  notificationPermission = result;
  return result === 'granted';
}

export function showNotification(title: string, body: string, options?: { icon?: string; tag?: string; url?: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: options?.icon || '/images/logo.png',
    tag: options?.tag,
    badge: '/images/logo.png',
  });

  if (options?.url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = options.url!;
      notification.close();
    };
  }

  setTimeout(() => notification.close(), 7000);
}

export function showOrderStatusNotification(orderId: string, status: string) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    approved: {
      title: '✅ Order Approved! — متجر ضياء',
      body: `Your order #${orderId} has been approved and is being processed.`,
    },
    delivered: {
      title: '🎮 Order Delivered! — متجر ضياء',
      body: `Your order #${orderId} has been delivered. Check your account!`,
    },
    rejected: {
      title: '❌ Order Update — متجر ضياء',
      body: `There was an issue with order #${orderId}. Please check your profile.`,
    },
    pending: {
      title: '⏳ Order Received — متجر ضياء',
      body: `Your order #${orderId} is pending review. We'll notify you soon!`,
    },
  };

  const msg = statusMessages[status] || {
    title: '📦 Order Update — متجر ضياء',
    body: `Order #${orderId} status: ${status}`,
  };

  showNotification(msg.title, msg.body, {
    tag: `order-${orderId}`,
    url: '/profile',
  });
}
