export const DASHBOARD_REFRESH_EVENT = 'dashboard:refresh';
export const DASHBOARD_REFRESH_CHANNEL = 'dashboard-sync';
export const DASHBOARD_REFRESH_EVENT_NAME = 'refresh';

/**
 * Dispatches a custom event to notify listeners that dashboard data
 * should be refreshed (e.g., after adding a transaction via AI widgets).
 */
export function dispatchDashboardRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
}

/**
 * Registers a listener for dashboard refresh requests and returns a cleanup fn.
 */
export function subscribeToDashboardRefresh(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(DASHBOARD_REFRESH_EVENT, callback);
  return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, callback);
}
