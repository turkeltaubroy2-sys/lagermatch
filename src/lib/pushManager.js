import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = 'BC_PLACEHOLDER_VAPID_PUBLIC_KEY_FOR_DEVELOPMENT'; // In production, this should be generated

export const pushManager = {
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    return null;
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribeUser(profileId) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // If VAPID key is placeholder, don't try to subscribe to real push service
      // as it will fail. In a real app, you'd provide a valid key here.
      if (VAPID_PUBLIC_KEY.includes('PLACEHOLDER')) {
        console.warn('Push subscription skipped: VAPID key is a placeholder.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      // Save to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          profile_id: profileId,
          subscription: subscription
        });

      if (error) throw error;
      console.log('Push subscription saved to Supabase');
    } catch (error) {
      console.error('Failed to subscribe user to push:', error);
    }
  }
};
