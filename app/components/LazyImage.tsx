import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageProps, StyleProp, ViewStyle, ImageStyle } from 'react-native';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholderColor?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  showLoadingIndicator?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  containerStyle,
  placeholderColor = '#e1e1e1',
  resizeMode = 'cover',
  showLoadingIndicator = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle the source correctly - string URIs need to be converted to objects
  const imageSource = typeof source === 'string' 
    ? { uri: source } 
    : typeof source === 'number' 
      ? source 
      : source;

  // Prepare fallback source for errors
  const fallbackSource = require('../../assets/images/favicon.png');

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Placeholder - shown while image is loading */}
      {isLoading && (
        <View 
          style={[
            styles.placeholder, 
            { backgroundColor: placeholderColor },
            style
          ]} 
        >
          {showLoadingIndicator && (
            <ActivityIndicator size="small" color="#0074FF" />
          )}
        </View>
      )}
      
      {/* Actual image */}
      <Image
        source={hasError ? fallbackSource : imageSource}
        style={[
          styles.image,
          isLoading && styles.imageLoading,
          style
        ]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    opacity: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LazyImage; 