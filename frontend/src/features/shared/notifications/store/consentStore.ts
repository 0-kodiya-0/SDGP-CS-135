import { create } from 'zustand';

export interface ConsentRequest {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  onApprove: () => void;
  onDeny: () => void;
}

interface ConsentState {
  requests: ConsentRequest[];
  isOpen: boolean;
  
  // Actions
  addConsentRequest: (request: Omit<ConsentRequest, 'id' | 'timestamp'>) => string;
  removeConsentRequest: (id: string) => void;
  respondToRequest: (id: string, approved: boolean) => void;
  clearAllRequests: () => void;
  toggleConsentPanel: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  requests: [],
  isOpen: false,
  
  addConsentRequest: (request) => {
    const id = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newRequest: ConsentRequest = {
      ...request,
      id,
      timestamp: Date.now(),
    };
    
    set((state) => {
      const updatedRequests = [newRequest, ...state.requests];
      
      // Auto-open the panel when a new consent request is added
      return {
        requests: updatedRequests,
        isOpen: true
      };
    });
    
    return id;
  },
  
  removeConsentRequest: (id) => {
    set((state) => ({
      requests: state.requests.filter(request => request.id !== id)
    }));
  },
  
  respondToRequest: (id, approved) => {
    const { requests } = get();
    const request = requests.find(r => r.id === id);
    
    if (request) {
      // Call the appropriate callback
      if (approved) {
        request.onApprove();
      } else {
        request.onDeny();
      }
      
      // Remove the request after response
      set((state) => ({
        requests: state.requests.filter(r => r.id !== id)
      }));
    }
  },
  
  clearAllRequests: () => {
    set({ requests: [] });
  },
  
  toggleConsentPanel: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
  
  setOpen: (isOpen) => {
    set({ isOpen });
  }
}));