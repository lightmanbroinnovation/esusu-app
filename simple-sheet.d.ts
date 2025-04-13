declare module 'react-native-simple-bottom-sheet' {
    import React from 'react';
    import { ViewProps } from 'react-native';
  
    interface BottomSheetProps extends ViewProps {
      isOpen?: boolean;
      onClose?: () => void;
    }
  
    const BottomSheet: React.FC<BottomSheetProps>;
  
    export default BottomSheet;
  }