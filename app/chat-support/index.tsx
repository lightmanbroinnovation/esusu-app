import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackButtonHandler } from '../utils/backButtonHandler';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
}

export default function ChatSupport() {
  const router = useRouter();
  
  // Use back button handler for chat support page
  useBackButtonHandler('/chat-support');
  
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  // Mock data - replace with real API calls
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'Account Verification Issue',
      lastMessage: 'Thank you for providing the documents. We will review them within 24 hours.',
      lastMessageTime: '2 hours ago',
      unreadCount: 0,
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Transaction Failed',
      lastMessage: 'Your transaction has been processed successfully.',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      status: 'resolved',
      createdAt: '2024-01-14T15:30:00Z'
    },
    {
      id: '3',
      title: 'App Login Problem',
      lastMessage: 'Please try clearing your app cache and restarting the app.',
      lastMessageTime: '3 days ago',
      unreadCount: 1,
      status: 'pending',
      createdAt: '2024-01-12T09:15:00Z'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#0072CE';
      case 'resolved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'resolved':
        return 'Resolved';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: '/chat-support/conversation',
      params: { chatId: chat.id, chatTitle: chat.title }
    });
  };

  const handleNewChat = () => {
    router.push({
      pathname: '/chat-support/conversation',
      params: { chatId: 'new', chatTitle: 'New Chat' }
    });
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatInfo}>
          <Text style={styles.chatTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.timeText}>{item.lastMessageTime}</Text>
      </View>
      
      <Text style={styles.lastMessage} numberOfLines={2}>
        {item.lastMessage}
      </Text>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Support</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with our support team
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewChat}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 20,
  },
  chatItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chatInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0072CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
