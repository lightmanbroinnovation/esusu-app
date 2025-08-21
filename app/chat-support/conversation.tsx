import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useBackButtonHandler } from '../utils/backButtonHandler';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  isAdmin: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  type: 'image' | 'document';
  uri: string;
  name: string;
  size?: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export default function Conversation() {
  const router = useRouter();
  
  // Use back button handler for chat support conversation page
  useBackButtonHandler('/chat-support/conversation');
  
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const chatId = params.chatId as string;
  const chatTitle = params.chatTitle as string;
  const isNewChat = chatId === 'new';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicSelection, setShowTopicSelection] = useState(isNewChat);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Support topics based on app features
  const supportTopics: Topic[] = [
    // Account & Verification
    {
      id: 'account-verification',
      title: 'Account Verification',
      description: 'Help with account setup, document uploads, and verification',
      icon: 'shield-checkmark',
      category: 'Account'
    },
    {
      id: 'login-access',
      title: 'Login & Access',
      description: 'Problems with login, passcodes, biometrics, or account access',
      icon: 'key',
      category: 'Account'
    },
    
    // Financial Transactions
    {
      id: 'deposits-withdrawals',
      title: 'Deposits & Withdrawals',
      description: 'Issues with money transfers, deposits, or withdrawals',
      icon: 'card',
      category: 'Financial'
    },
    {
      id: 'transactions',
      title: 'Transaction Issues',
      description: 'Failed transactions, payment errors, or balance problems',
      icon: 'swap-horizontal',
      category: 'Financial'
    },
    {
      id: 'commissions',
      title: 'Commissions & Bonuses',
      description: 'Problems with commission calculations or bonus withdrawals',
      icon: 'trending-up',
      category: 'Financial'
    },
    
    // Business Services
    {
      id: 'contributor-management',
      title: 'Contributor Management',
      description: 'Adding, managing, or verifying contributors',
      icon: 'people',
      category: 'Business'
    },
    {
      id: 'business-verification',
      title: 'Business Verification',
      description: 'Business location, CAC documents, or verification issues',
      icon: 'business',
      category: 'Business'
    },
    
    // Banking
    {
      id: 'bank-accounts',
      title: 'Bank Accounts',
      description: 'Linking bank accounts, settlement issues, or transfers',
      icon: 'card-outline',
      category: 'Banking'
    },
    
    // Technical Issues
    {
      id: 'app-technical',
      title: 'App Technical Issues',
      description: 'App crashes, performance problems, or technical bugs',
      icon: 'phone-portrait',
      category: 'Technical'
    },
    {
      id: 'notifications',
      title: 'Notifications & Sync',
      description: 'Push notification problems or data sync issues',
      icon: 'notifications',
      category: 'Technical'
    },
    
    // General Support
    {
      id: 'general-help',
      title: 'General Help',
      description: 'Feature explanations, how-to guides, or general questions',
      icon: 'help-circle',
      category: 'General'
    },
    {
      id: 'referral-program',
      title: 'Referral Program',
      description: 'Referral code issues or bonus problems',
      icon: 'gift',
      category: 'General'
    }
  ];

  // Mock messages for existing chats - replace with real API calls
  useEffect(() => {
    if (!isNewChat) {
      // Load existing chat messages
      const mockMessages: Message[] = [
        {
          id: '1',
          text: 'Hello! How can I help you today?',
          timestamp: '10:00 AM',
          isUser: false,
          isAdmin: true
        },
        {
          id: '2',
          text: 'Hi, I\'m having trouble with my account verification.',
          timestamp: '10:02 AM',
          isUser: true,
          isAdmin: false
        },
        {
          id: '3',
          text: 'I can help you with that. What specific issue are you experiencing?',
          timestamp: '10:03 AM',
          isUser: false,
          isAdmin: true
        },
        {
          id: '4',
          text: 'The app keeps saying my documents are not clear enough.',
          timestamp: '10:05 AM',
          isUser: true,
          isAdmin: false
        },
        {
          id: '5',
          text: 'I understand. Let me guide you through the document upload process. Make sure the documents are well-lit and all text is clearly visible.',
          timestamp: '10:07 AM',
          isUser: false,
          isAdmin: true
        }
      ];
      setMessages(mockMessages);
    } else if (selectedTopic) {
      // New chat with selected topic - show welcome message
      const welcomeMessage: Message = {
        id: '1',
        text: `Hello! I see you need help with "${selectedTopic.title}". How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        isAdmin: true
      };
      setMessages([welcomeMessage]);
    }
  }, [chatId, isNewChat, selectedTopic]);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowTopicSelection(false);
  };

  const handleBackToTopics = () => {
    setShowTopicSelection(true);
    setSelectedTopic(null);
    setMessages([]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          type: 'image',
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name || `document_${Date.now()}`,
          size: result.assets[0].size,
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.topicItem}
      onPress={() => handleTopicSelect(item)}
    >
      <View style={styles.topicIcon}>
        <Ionicons name={item.icon as any} size={24} color="#0072CE" />
      </View>
      <View style={styles.topicContent}>
        <Text style={styles.topicTitle}>{item.title}</Text>
        <Text style={styles.topicDescription}>{item.description}</Text>
        <View style={styles.topicCategory}>
          <Text style={styles.topicCategoryText}>{item.category}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const sendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      isAdmin: false,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    // Simulate admin response (replace with real API call)
    setTimeout(() => {
      const adminResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. Our support team will get back to you shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        isAdmin: true
      };
      setMessages(prev => [...prev, adminResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const renderAttachment = (attachment: Attachment) => (
    <View key={attachment.id} style={styles.attachmentPreview}>
      {attachment.type === 'image' ? (
        <Image source={{ uri: attachment.uri }} style={styles.imagePreview} />
      ) : (
        <View style={styles.documentPreview}>
          <Ionicons name="document" size={24} color="#0072CE" />
          <Text style={styles.documentName} numberOfLines={1}>
            {attachment.name}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.removeAttachment}
        onPress={() => removeAttachment(attachment.id)}
      >
        <Ionicons name="close-circle" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.adminMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.adminBubble
      ]}>
        {item.text && (
          <Text style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.adminText
          ]}>
            {item.text}
          </Text>
        )}
        
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.messageAttachments}>
            {item.attachments.map(attachment => (
              <View key={attachment.id} style={styles.messageAttachment}>
                {attachment.type === 'image' ? (
                  <Image source={{ uri: attachment.uri }} style={styles.messageImage} />
                ) : (
                  <View style={styles.messageDocument}>
                    <Ionicons name="document" size={20} color={item.isUser ? "white" : "#0072CE"} />
                    <Text style={[
                      styles.messageDocumentName,
                      { color: item.isUser ? "white" : "#0072CE" }
                    ]} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
        <Text style={[
          styles.timestamp,
          item.isUser ? styles.userTimestamp : styles.adminTimestamp
        ]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.adminMessage]}>
        <View style={[styles.messageBubble, styles.adminBubble]}>
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      </View>
    );
  };

  // Show topic selection for new chats
  if (showTopicSelection) {
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
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Select Topic</Text>
            <Text style={styles.headerSubtitle}>What can we help you with?</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Topic List */}
        <FlatList
          data={supportTopics}
          renderItem={renderTopicItem}
          keyExtractor={(item) => item.id}
          style={styles.topicList}
          contentContainerStyle={styles.topicListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={isNewChat ? handleBackToTopics : () => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {isNewChat ? selectedTopic?.title : chatTitle}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isNewChat ? 'New conversation' : 'Support team'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />
      </View>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachments.map(renderAttachment)}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderWidth: inputFocused ? 0 : 1,
                  borderColor: inputFocused ? 'transparent' : '#E5E7EB',
                }
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: (inputText.trim() || attachments.length > 0) ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() && attachments.length === 0}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color={(inputText.trim() || attachments.length > 0) ? "white" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Floating Attachment Button */}
        <TouchableOpacity style={styles.floatingAttachButton} onPress={() => {
          setShowAttachmentOptions(!showAttachmentOptions);
        }}>
          <Ionicons 
            name={showAttachmentOptions ? "close" : "attach"} 
            size={20} 
            color="#0072CE" 
          />
        </TouchableOpacity>
        
        {/* Animated Attachment Options */}
        {showAttachmentOptions && (
          <View style={styles.attachmentOptionsContainer}>
            <TouchableOpacity 
              style={[styles.attachmentOption, styles.cameraOption]} 
              onPress={() => {
                pickImage();
                setShowAttachmentOptions(false);
              }}
            >
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.attachmentOption, styles.documentOption]} 
              onPress={() => {
                pickDocument();
                setShowAttachmentOptions(false);
              }}
            >
              <Ionicons name="document" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#0072CE',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  adminText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: 'white',
    textAlign: 'right',
  },
  adminTimestamp: {
    color: '#6B7280',
    textAlign: 'left',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  textInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 80,
    minHeight: 36,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0072CE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicList: {
    flex: 1,
  },
  topicListContent: {
    padding: 20,
    paddingBottom: 10,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
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
  topicIcon: {
    width: 50,
    alignItems: 'center',
    marginRight: 15,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  topicCategory: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  topicCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0072CE',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  documentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0072CE',
    maxWidth: 100,
  },
  removeAttachment: {
    padding: 4,
  },
  messageAttachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  messageAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageImage: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  messageDocument: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageDocumentName: {
    marginLeft: 8,
    fontSize: 12,
  },
  attachmentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  floatingAttachButton: {
    position: 'absolute',
    bottom: 80, // Adjust as needed
    right: 20, // Adjust as needed
    backgroundColor: '#E0E7FF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  attachmentOptionsContainer: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  attachmentOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraOption: {
    backgroundColor: '#10B981',
  },
  documentOption: {
    backgroundColor: '#F59E0B',
  },
  messagesContainer: {
    flex: 1,
  },
});
