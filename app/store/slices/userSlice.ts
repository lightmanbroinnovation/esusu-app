import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  isAuthenticated: boolean;
  userId: string | null;
  userDetails: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  } | null;
}

const initialState: UserState = {
  isAuthenticated: false,
  userId: null,
  userDetails: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState['userDetails']>) => {
      state.userDetails = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.userDetails = null;
    },
  },
});

export const { setUser, setUserId, logout } = userSlice.actions;
export default userSlice.reducer; 