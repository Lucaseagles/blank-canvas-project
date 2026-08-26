import webpush from 'web-push';

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; data?: any }
) {
  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  const privateKey = process.env['VAPID_PRIVATE_KEY'];
  const email = process.env['VAPID_EMAIL'] || 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured');
  }

  webpush.setVapidDetails(email, publicKey, privateKey);

  try {
    const response = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return response;
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription expired or invalid
      return { expired: true, endpoint: subscription.endpoint };
    }
    throw error;
  }
}
