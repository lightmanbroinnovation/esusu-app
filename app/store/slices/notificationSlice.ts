import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  permission: boolean;
  token: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  permission: false,
  token: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'success' | 'error' | 'info' | 'warning';
        title?: string;
        body: string;
      }>
    ) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: action.payload.type,
        message: action.payload.body,
        title: action.payload.title,
        timestamp: Date.now(),
      };
      
      state.notifications.unshift(notification);
      
      // Keep only last 5 notifications
      if (state.notifications.length > 5) {
        state.notifications = state.notifications.slice(0, 5);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setPermission: (state, action: PayloadAction<boolean>) => {
      state.permission = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setPermission,
  setToken,
} = notificationSlice.actions;

export default notificationSlice.reducer; 