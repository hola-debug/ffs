import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { dispatchDashboardRefresh, DASHBOARD_REFRESH_CHANNEL, DASHBOARD_REFRESH_EVENT_NAME } from '../lib/dashboardEvents';

/**
 * Listens for Supabase realtime broadcast events (emitted by Edge Functions /
 * DB webhooks) and re-dispatches the local dashboard refresh event so every
 * hook that already subscribes to `dashboard:refresh` refetches data.
 */
export function useDashboardSync() {
  useEffect(() => {
    const channel = supabase.channel(DASHBOARD_REFRESH_CHANNEL, {
      config: { broadcast: { ack: true } },
    });

    channel
      .on('broadcast', { event: DASHBOARD_REFRESH_EVENT_NAME }, () => {
        dispatchDashboardRefresh();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Optional logging for debugging
          console.debug('[dashboard-sync] Listening for refresh broadcasts');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
