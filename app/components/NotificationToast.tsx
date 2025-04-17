import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { removeNotification } from '../store/slices/notificationSlice';

const NotificationToast = () => {
  const notifications = useSelector((state: RootState) => state.notification.notifications);
  const dispatch = useDispatch();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notifications.length > 0) {
      // Show notification
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Remove notification after animation
        if (notifications[0]?.id) {
          dispatch(removeNotification(notifications[0].id));
        }
      });
    }
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  const latestNotification = notifications[0];
  const { type, title, message } = latestNotification;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: getBackgroundColor(),
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getIconName()} size={24} color="white" />
      </View>
      <View style={styles.textContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
});

export default NotificationToast; 