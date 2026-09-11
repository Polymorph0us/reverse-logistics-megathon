import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BatchPassport, FraudAlert, Notification, ReturnRequest, DestructionCertificate, TimelineEvent, MasterConsignment, DenaturedBatchTag, ElectronicWasteTransferNote, IncinerationLog, FinalIncinerationRecord, OrganizationNode } from '@/api/types';
import { INITIAL_ORGANIZATIONS, SEED_BATCHES } from './seedData';

interface SharedState {
  batches: BatchPassport[];
  fraudAlerts: FraudAlert[];
  notifications: Notification[];
  returns: ReturnRequest[];
  destructions: DestructionCertificate[];
  masterConsignments: MasterConsignment[];  // Layer 3
  denaturedTags: DenaturedBatchTag[];       // Layer 4
  ewtns: ElectronicWasteTransferNote[];     // Layer 4
  incinerationLogs: IncinerationLog[];      // Layer 4
  finalIncinerationRecords: FinalIncinerationRecord[]; // Layer 5
  organizations: OrganizationNode[];
  
  // Actions
  addBatch: (batch: BatchPassport) => void;
  updateBatch: (batchId: string, updates: Partial<BatchPassport>) => void;
  addTimelineEvent: (batchId: string, event: TimelineEvent) => void;
  
  addFraudAlert: (alert: FraudAlert) => void;
  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  addReturn: (req: ReturnRequest) => void;
  updateReturn: (returnId: string, updates: Partial<ReturnRequest>) => void;
  
  addDestruction: (cert: DestructionCertificate) => void;
  
  // Layer 3 actions
  addMasterConsignment: (mcm: MasterConsignment) => void;
  updateMasterConsignment: (mcmId: string, updates: Partial<MasterConsignment>) => void;

  // Layer 4 actions
  addDenaturedTag: (tag: DenaturedBatchTag) => void;
  addEWTN: (ewtn: ElectronicWasteTransferNote) => void;
  updateEWTN: (ewtnId: string, updates: Partial<ElectronicWasteTransferNote>) => void;
  addIncinerationLog: (log: IncinerationLog) => void;
  // Layer 5 actions
  addFinalIncinerationRecord: (rec: FinalIncinerationRecord) => void;
  
  // Organization actions
  addOrganization: (org: OrganizationNode) => void;
  updateOrganization: (id: string, updates: Partial<OrganizationNode>) => void;
  deleteOrganization: (id: string) => void;

  clearAllData: () => void;
  seedIfEmpty: () => void;
}

export const useSharedStore = create<SharedState>()(
  persist(
    (set) => ({
      batches: [],
      fraudAlerts: [],
      notifications: [],
      returns: [],
      destructions: [],
      masterConsignments: [],
      denaturedTags: [],
      ewtns: [],
      incinerationLogs: [],
      finalIncinerationRecords: [],
      organizations: INITIAL_ORGANIZATIONS,
      
      clearAllData: () => {
        try {
          localStorage.removeItem('rxtrack-shared-state');
        } catch (e) {
          console.error(e);
        }
        set({
          batches: [],
          fraudAlerts: [],
          notifications: [],
          returns: [],
          destructions: [],
          masterConsignments: [],
          denaturedTags: [],
          ewtns: [],
          incinerationLogs: [],
          finalIncinerationRecords: [],
          organizations: INITIAL_ORGANIZATIONS,
        });
      },

      addBatch: (batch) => set((state) => ({ batches: [...state.batches, batch] })),
      updateBatch: (batchId, updates) => set((state) => ({
        batches: state.batches.map(b => b.batchId === batchId ? { ...b, ...updates } : b)
      })),
      addTimelineEvent: (batchId, event) => set((state) => ({
        batches: state.batches.map(b => b.batchId === batchId ? { ...b, timeline: [...b.timeline, event] } : b)
      })),
      
      addFraudAlert: (alert) => set((state) => ({ fraudAlerts: [alert, ...state.fraudAlerts] })),
      addNotification: (notif) => set((state) => ({ notifications: [notif, ...state.notifications] })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      addReturn: (req) => set((state) => ({ returns: [req, ...state.returns] })),
      updateReturn: (returnId, updates) => set((state) => ({
        returns: state.returns.map(r => r.returnId === returnId ? { ...r, ...updates } : r)
      })),
      
      addDestruction: (cert) => set((state) => ({ destructions: [cert, ...state.destructions] })),

      // Layer 3
      addMasterConsignment: (mcm) => set((state) => ({ masterConsignments: [mcm, ...state.masterConsignments] })),
      updateMasterConsignment: (mcmId, updates) => set((state) => ({
        masterConsignments: state.masterConsignments.map(m => m.mcmId === mcmId ? { ...m, ...updates } : m)
      })),

      // Layer 4
      addDenaturedTag: (tag) => set((state) => ({ denaturedTags: [tag, ...state.denaturedTags] })),
      addEWTN: (ewtn) => set((state) => ({ ewtns: [ewtn, ...state.ewtns] })),
      updateEWTN: (ewtnId, updates) => set((state) => ({
        ewtns: state.ewtns.map(e => e.ewtnId === ewtnId ? { ...e, ...updates } : e)
      })),
      addIncinerationLog: (log) => set((state) => ({ incinerationLogs: [log, ...state.incinerationLogs] })),
      // Layer 5
      addFinalIncinerationRecord: (rec) => set((state) => ({ finalIncinerationRecords: [rec, ...state.finalIncinerationRecords] })),
      
      // Organization actions
      addOrganization: (org) => set((state) => ({
        organizations: [org, ...(state.organizations || [])]
      })),
      updateOrganization: (id, updates) => set((state) => ({
        organizations: (state.organizations || []).map(o => o.id === id ? { ...o, ...updates } : o)
      })),
      deleteOrganization: (id) => set((state) => ({
        organizations: (state.organizations || []).filter(o => o.id !== id)
      })),

      seedIfEmpty: () => {
        const DUMMY_MOCK_IDS = new Set([
          'mfr-002', 'mfr-003', 'mfr-004', 
          'dist-002', 'dist-003', 'dist-004', 
          'ret-002', 'ret-003', 'ret-004', 'ret-005', 
          'wst-002', 'wst-003'
        ]);

        set((state) => {
          const updates: Partial<SharedState> = {};
          if (!state.batches || state.batches.length === 0) {
            updates.batches = SEED_BATCHES;
          }
          const existing = state.organizations || [];
          const cleaned = existing.filter(o => !DUMMY_MOCK_IDS.has(o.id));
          if (cleaned.length === 0) {
            updates.organizations = INITIAL_ORGANIZATIONS;
          } else if (cleaned.length !== existing.length) {
            updates.organizations = cleaned;
          }
          // Remove old mock notification history
          updates.notifications = [];
          return updates;
        });
      }
    }),
    {
      name: 'rxtrack-shared-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Explicitly bind the store to listen to storage events across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'rxtrack-shared-state' && e.newValue) {
    useSharedStore.persist.rehydrate();
  }
});
