const webpush = require('web-push');

const VAPID_PUBLIC_KEY = 'BOu8Eimzv_gE4cKeEClHBlrnSN9mAaFcIe-0XBFelWqWB5J4l07mi4-v58YRkO4yK2zknd9grcTEKqFL4CHd3U8';
const VAPID_PRIVATE_KEY = 'Vgrq_SiWYumqVdjkkabjKcq4mEncE5w9ig66zhGeKek';

webpush.setVapidDetails(
  'mailto:your@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

let subscriptions = [];

exports.handler = async function(event) {
  if (event.httpMethod === 'POST' && event.path.endsWith('/save-subscription')) {
    const sub = JSON.parse(event.body);
    if (!sub || !sub.endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid subscription' }) };
    }
    if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
      subscriptions.push(sub);
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === 'POST' && event.path.endsWith('/send-notification')) {
    const { title, body } = JSON.parse(event.body);
    const payload = JSON.stringify({ title, body });
    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          const idx = subscriptions.findIndex(s => s.endpoint === sub.endpoint);
          if (idx !== -1) subscriptions.splice(idx, 1);
        }
      }
    }
    return { statusCode: 200, body: JSON.stringify({ sent }) };
  }

  return { statusCode: 404, body: 'Not found' };
};
