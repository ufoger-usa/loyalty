// src/components/usePushNotifications.js
import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = 'BOu8Eimzv_gE4cKeEClHBlrnSN9mAaFcIe-0XBFelWqWB5J4l07mi4-v58YRkO4yK2zknd9grcTEKqFL4CHd3U8';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const subscribe = async () => {
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      // Send subscription to backend
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON())
      });
      setIsSubscribed(true);
      alert('Push notifications enabled!');
    } catch (e) {
      setError(e.message);
    }
  };

  // Helper to trigger a test notification
  const sendTestNotification = async () => {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test push notification from UFOGER Loyalty.'
      })
    });
  };

  return { isSupported, isSubscribed, subscribe, sendTestNotification, error };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
