import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { dispatchDashboardRefresh, DASHBOARD_REFRESH_CHANNEL, DASHBOARD_REFRESH_EVENT_NAME } from '../lib/dashboardEvents';

/**
 * Centralized realtime listener that detects database changes and dispatches
 * dashboard refresh events. This prevents multiple competing realtime channels.
 */
export function useDashboardSync() {
  useEffect(() => {
    let userId: string | null = null;

    const setupSync = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[DashboardSync] No user found');
        return;
      }
      userId = user.id;

      const channel = supabase
        .channel('dashboard-sync-realtime')
        // Listen to broadcast events from Edge Functions
        .on('broadcast', { event: DASHBOARD_REFRESH_EVENT_NAME }, () => {
          console.log('[DashboardSync] Broadcast refresh received');
          dispatchDashboardRefresh();
        })
        // Listen to postgres changes
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          (payload) => {
            const record = (payload.new || payload.old) as any;
            if (record?.user_id === userId) {
              console.log(`[DashboardSync] ${payload.eventType} on transactions`);
              dispatchDashboardRefresh();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'accounts' },
          (payload) => {
            const record = (payload.new || payload.old) as any;
            if (record?.user_id === userId) {
              console.log(`[DashboardSync] ${payload.eventType} on accounts`);
              dispatchDashboardRefresh();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload) => {
            const record = (payload.new || payload.old) as any;
            if (record?.user_id === userId) {
              console.log(`[DashboardSync] ${payload.eventType} on categories`);
              dispatchDashboardRefresh();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'periods' },
          (payload) => {
            const record = (payload.new || payload.old) as any;
            if (record?.user_id === userId) {
              console.log(`[DashboardSync] ${payload.eventType} on periods`);
              dispatchDashboardRefresh();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[DashboardSync] ✅ Connected to realtime');
          } else if (status !== 'SUBSCRIBED') {
            console.error(`[DashboardSync] ❌ Status: ${status}`);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSync();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);
}
