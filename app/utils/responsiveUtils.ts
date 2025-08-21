import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen size breakpoints
export const SCREEN_SIZES = {
  SMALL: 375,    // iPhone SE, small Android phones
  MEDIUM: 414,   // iPhone 12/13/14, most Android phones
  LARGE: 768,    // iPad, large tablets
  XLARGE: 1024,  // Large tablets, small laptops
};

// Responsive sizing function
export const getResponsiveSize = (baseSize: number): number => {
  if (width < SCREEN_SIZES.SMALL) {
    return baseSize * 0.85; // Very small phones
  } else if (width < SCREEN_SIZES.MEDIUM) {
    return baseSize * 0.95; // Small phones
  } else if (width < SCREEN_SIZES.LARGE) {
    return baseSize; // Medium phones
  } else if (width < SCREEN_SIZES.XLARGE) {
    return baseSize * 1.1; // Large phones and small tablets
  } else {
    return baseSize * 1.2; // Large tablets and beyond
  }
};

// Responsive padding function
export const getResponsivePadding = (basePadding: number): number => {
  if (width < SCREEN_SIZES.SMALL) {
    return basePadding * 0.8;
  } else if (width < SCREEN_SIZES.MEDIUM) {
    return basePadding * 0.9;
  } else if (width < SCREEN_SIZES.LARGE) {
    return basePadding;
  } else {
    return basePadding * 1.2;
  }
};

// Responsive font size function
export const getResponsiveFontSize = (baseSize: number): number => {
  if (width < SCREEN_SIZES.SMALL) {
    return baseSize * 0.9;
  } else if (width < SCREEN_SIZES.MEDIUM) {
    return baseSize * 0.95;
  } else if (width < SCREEN_SIZES.LARGE) {
    return baseSize;
  } else if (width < SCREEN_SIZES.XLARGE) {
    return baseSize * 1.05;
  } else {
    return baseSize * 1.1;
  }
};

// Check if device is small
export const isSmallDevice = (): boolean => {
  return width < SCREEN_SIZES.SMALL;
};

// Check if device is tablet
export const isTablet = (): boolean => {
  return width >= SCREEN_SIZES.LARGE;
};

// Responsive modal width
export const getResponsiveModalWidth = (): number => {
  if (isTablet()) {
    return Math.min(width * 0.8, 500);
  } else {
    return width * 0.9;
  }
};

// Responsive button height
export const getResponsiveButtonHeight = (baseHeight: number): number => {
  if (isSmallDevice()) {
    return baseHeight * 0.9;
  } else if (isTablet()) {
    return baseHeight * 1.1;
  } else {
    return baseHeight;
  }
};

// Platform-specific responsive adjustments
export const getPlatformResponsiveSize = (baseSize: number): number => {
  const responsiveSize = getResponsiveSize(baseSize);
  
  // Platform-specific adjustments
  if (Platform.OS === 'ios') {
    return responsiveSize * 1.05; // iOS devices tend to have better density
  } else {
    return responsiveSize * 0.95; // Android devices might need slightly smaller sizes
  }
};

// Responsive shadow
export const getResponsiveShadow = (baseShadow: number) => {
  return {
    shadowOffset: {
      width: getResponsiveSize(baseShadow),
      height: getResponsiveSize(baseShadow),
    },
    shadowOpacity: 0.25,
    shadowRadius: getResponsiveSize(baseShadow),
    elevation: getResponsiveSize(baseShadow),
  };
};

// Responsive UI settings
export const getResponsiveUISettings = () => {
  return {
    fontSize: getResponsiveFontSize(16),
    iconSize: getResponsiveSize(24),
    buttonHeight: getResponsiveButtonHeight(48),
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(16),
    spacing: getResponsiveSize(8),
    shadow: getResponsiveShadow(4),
    modalWidth: getResponsiveModalWidth(),
  };
}; 