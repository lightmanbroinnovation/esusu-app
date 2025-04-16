import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useAppTheme = () => {
  const theme = useSelector((state: RootState) => state.theme);

  const getTextStyle = (variant: 'regular' | 'medium' | 'bold' = 'regular') => {
    const fontFamily = {
      regular: 'DMSans-Regular',
      medium: 'DMSans-Medium',
      bold: 'DMSans-Bold',
    }[variant];

    return {
      fontFamily,
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
    };
  };

  return {
    ...theme,
    getTextStyle,
  };
}; 