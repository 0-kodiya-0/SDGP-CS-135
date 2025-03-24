import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationPanel: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        
        const updatedNotifications = [newNotification, ...state.notifications];
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return { 
          notifications: updatedNotifications,
          unreadCount: unreadCount
        };
      }),
      
      markAsRead: (id) => set((state) => {
        const updatedNotifications = state.notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return { 
          notifications: updatedNotifications,
          unreadCount: unreadCount
        };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0
      })),
      
      removeNotification: (id) => set((state) => {
        const updatedNotifications = state.notifications.filter(notification => notification.id !== id);
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return { 
          notifications: updatedNotifications,
          unreadCount: unreadCount
        };
      }),
      
      clearAllNotifications: () => set({ notifications: [], unreadCount: 0 }),
      
      toggleNotificationPanel: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setOpen: (isOpen) => set({ isOpen })
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount
      }),
    }
  )
);