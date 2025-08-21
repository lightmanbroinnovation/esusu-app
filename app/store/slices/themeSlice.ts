import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  fontFamily: string;
  isDarkMode: boolean;
  primaryColor: string;
}

const initialState: ThemeState = {
  fontFamily: 'Poppins-Regular',
  isDarkMode: false,
  primaryColor: '#007BFF',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
    resetTheme: (state) => {
      state.fontFamily = initialState.fontFamily;
      state.isDarkMode = initialState.isDarkMode;
      state.primaryColor = initialState.primaryColor;
    },
  },
});

export const { setFontFamily, toggleDarkMode, setPrimaryColor, resetTheme } = themeSlice.actions;
export default themeSlice.reducer; 