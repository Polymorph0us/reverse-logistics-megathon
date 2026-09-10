import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BatchPassport, FraudAlert, Notification, ReturnRequest, DestructionCertificate, TimelineEvent, MasterConsignment, DenaturedBatchTag, ElectronicWasteTransferNote, IncinerationLog, FinalIncinerationRecord } from '@/api/types';
import { SEED_BATCHES, SEED_ALERTS, SEED_RETURNS, SEED_DESTRUCTIONS } from './seedData';

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
  
  // Actions
  addBatch: (batch: BatchPassport) => void;
  updateBatch: (batchId: string, updates: Partial<BatchPassport>) => void;
  addTimelineEvent: (batchId: string, event: TimelineEvent) => void;
  
  addFraudAlert: (alert: FraudAlert) => void;
  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;
  
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
  
  seedIfEmpty: () => void;
}

export const useSharedStore = create<SharedState>()(
  persist(
    (set, get) => ({
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
      
      seedIfEmpty: () => {
        const state = get();
        if (state.batches.length === 0) {
          set({
            batches: SEED_BATCHES,
            fraudAlerts: SEED_ALERTS,
            returns: SEED_RETURNS,
            destructions: SEED_DESTRUCTIONS,
            notifications: []
          });
        }
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
