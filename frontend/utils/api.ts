
// Centralized API configuration
// In production, this should come from process.env.NEXT_PUBLIC_API_URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const endpoints = {
  // Staff
  staff: `${API_BASE_URL}/api/staff`,
  staffClock: `${API_BASE_URL}/api/staff/clock`,
  staffAssign: `${API_BASE_URL}/api/staff/assign`,
  staffDashboard: (id: string) => `${API_BASE_URL}/api/staff/dashboard/${id}`,

  // ERP / Beds
  beds: `${API_BASE_URL}/api/erp/beds`,
  admit: `${API_BASE_URL}/api/erp/admit`,
  discharge: (id: string) => `${API_BASE_URL}/api/erp/discharge/${id}`,
  startCleaning: (id: string) => `${API_BASE_URL}/api/erp/beds/${id}/start-cleaning`,
  cleaningComplete: (id: string) => `${API_BASE_URL}/api/erp/beds/${id}/cleaning-complete`,

  // Surgery Unit
  startSurgery: `${API_BASE_URL}/api/surgery/start`,
  extendSurgery: (id: string) => `${API_BASE_URL}/api/surgery/extend/${id}`,
  completeSurgery: (id: string) => `${API_BASE_URL}/api/surgery/complete/${id}`,
  releaseSurgery: (id: string) => `${API_BASE_URL}/api/surgery/release/${id}`,
  // Ambulances
  ambulances: `${API_BASE_URL}/api/ambulances`,
  ambulanceDispatch: `${API_BASE_URL}/api/ambulance/dispatch`,
  ambulanceReset: (id: string) => `${API_BASE_URL}/api/ambulance/reset/${id}`,

  // Dashboard / Analytics
  dashboardStats: `${API_BASE_URL}/api/dashboard/stats`,
  insights: `${API_BASE_URL}/api/dashboard/insights`,
  predictions: `${API_BASE_URL}/api/predictions`,
  predictInflow: `${API_BASE_URL}/api/predict-inflow`,
  timeToCapacity: `${API_BASE_URL}/api/metrics/latency`,
  latencyMetrics: `${API_BASE_URL}/api/metrics/latency`,

  // Events / Alerts
  events: `${API_BASE_URL}/api/events`,
  alertsActive: `${API_BASE_URL}/api/alerts/active`,

  // Triage / Patients
  triage: `${API_BASE_URL}/api/triage`,
  triageAssess: `${API_BASE_URL}/api/triage/assess`,
  patients: `${API_BASE_URL}/api/patients`,

  // History
  historyByDate: (date: string) => `${API_BASE_URL}/api/history/day/${date}`,
  historySurgery: `${API_BASE_URL}/api/history/surgery`,
  historyOpd: `${API_BASE_URL}/api/history/opd`,
};