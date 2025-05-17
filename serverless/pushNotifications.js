// serverless/pushNotifications.js
// Example: Express-style handler for Netlify Functions or Vercel Serverless
const webpush = require('web-push');

// Replace with your own VAPID keys (see instructions below)
const VAPID_PUBLIC_KEY = 'BOu8Eimzv_gE4cKeEClHBlrnSN9mAaFcIe-0XBFelWqWB5J4l07mi4-v58YRkO4yK2zknd9grcTEKqFL4CHd3U8';
const VAPID_PRIVATE_KEY = 'Vgrq_SiWYumqVdjkkabjKcq4mEncE5w9ig66zhGeKek';

webpush.setVapidDetails(
  'mailto:your@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In-memory store for demo; use a real DB in production
const subscriptions = [];

// Handler to save subscription
exports.saveSubscription = (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  // Avoid duplicates
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
  }
  res.json({ success: true });
};

// Handler to send a notification to all subscribers
exports.sendNotification = async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });
  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err) {
      // Remove invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        const idx = subscriptions.findIndex(s => s.endpoint === sub.endpoint);
        if (idx !== -1) subscriptions.splice(idx, 1);
      }
    }
  }
  res.json({ sent });
};

// Example Express app setup (for local dev)
// const express = require('express');
// const app = express();
// app.use(express.json());
// app.post('/api/save-subscription', exports.saveSubscription);
// app.post('/api/send-notification', exports.sendNotification);
// app.listen(3001);

// For Netlify/Vercel, export as handler
// module.exports = exports;
