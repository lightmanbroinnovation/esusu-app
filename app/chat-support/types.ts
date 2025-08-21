// Chat Support TypeScript Interfaces

export interface ChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'agent';
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachments: Attachment[];
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Attachment {
  type: 'image' | 'document';
  url: string;
  filename: string;
  size: number;
}

export interface ChatSession {
  chatId: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  issueType: 'general' | 'technical' | 'billing' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  createdAt: string;
  resolvedAt?: string;
  estimatedWaitTime?: number;
  messageCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface ChatInitRequest {
  userId: string;
  userPhone: string;
  userName: string;
  issueType: 'general' | 'technical' | 'billing' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
}

export interface ChatInitResponse {
  status: 'Success' | 'Error';
  data: {
    chatId: string;
    sessionId: string;
    agentId: string;
    agentName: string;
    status: string;
    createdAt: string;
    estimatedWaitTime: number;
    message: string;
  };
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: Attachment[];
  timestamp: string;
}

export interface SendMessageResponse {
  status: 'Success' | 'Error';
  data: {
    messageId: string;
    chatId: string;
    status: string;
    timestamp: string;
    message: string;
  };
}

export interface GetMessagesRequest {
  chatId: string;
  page?: number;
  limit?: number;
  before?: string;
}

export interface GetMessagesResponse {
  status: 'Success' | 'Error';
  data: {
    chatId: string;
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

export interface GetSessionsRequest {
  page?: number;
  limit?: number;
  status?: 'active' | 'resolved' | 'closed';
}

export interface GetSessionsResponse {
  status: 'Success' | 'Error';
  data: {
    sessions: ChatSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

export interface UpdateStatusRequest {
  chatId: string;
  status: 'resolved' | 'closed' | 'reopened';
  resolution?: string;
  rating?: number;
  feedback?: string;
}

export interface UpdateStatusResponse {
  status: 'Success' | 'Error';
  data: {
    chatId: string;
    status: string;
    updatedAt: string;
    message: string;
  };
}

export interface UploadRequest {
  file: any; // File object
  chatId: string;
  messageType: string;
}

export interface UploadResponse {
  status: 'Success' | 'Error';
  data: {
    fileId: string;
    filename: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  };
}

export interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: {
    id: string;
    name: string;
    description: string;
  }[];
}

export interface GetCategoriesResponse {
  status: 'Success' | 'Error';
  data: {
    categories: SupportCategory[];
  };
}

export interface FAQSuggestion {
  id: string;
  question: string;
  answer: string;
  relevance: number;
}

export interface GetFAQSuggestionsRequest {
  issueType: string;
  keywords?: string;
}

export interface GetFAQSuggestionsResponse {
  status: 'Success' | 'Error';
  data: {
    suggestions: FAQSuggestion[];
  };
}

export interface ErrorResponse {
  status: 'Error';
  message: string;
  errorCode: string;
  details?: any;
}

// WebSocket Event Types
export interface WebSocketConnectEvent {
  userId: string;
  chatId: string;
}

export interface WebSocketNewMessageEvent {
  chatId: string;
  message: ChatMessage;
}

export interface WebSocketTypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface WebSocketAgentStatusEvent {
  chatId: string;
  agentId: string;
  status: 'online' | 'away' | 'busy';
  message: string;
}

export interface WebSocketChatStatusEvent {
  chatId: string;
  status: string;
  message: string;
  timestamp: string;
}

// API Service Interface
export interface ChatSupportAPI {
  // Initialize chat session
  initChat(request: ChatInitRequest): Promise<ChatInitResponse>;
  
  // Send message
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
  
  // Get chat messages
  getMessages(request: GetMessagesRequest): Promise<GetMessagesResponse>;
  
  // Get chat sessions
  getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse>;
  
  // Update chat status
  updateStatus(request: UpdateStatusRequest): Promise<UpdateStatusResponse>;
  
  // Upload attachment
  uploadFile(request: UploadRequest): Promise<UploadResponse>;
  
  // Get support categories
  getCategories(): Promise<GetCategoriesResponse>;
  
  // Get FAQ suggestions
  getFAQSuggestions(request: GetFAQSuggestionsRequest): Promise<GetFAQSuggestionsResponse>;
  
  // Health check
  healthCheck(): Promise<{ status: string; timestamp: string }>;
}

// WebSocket Service Interface
export interface ChatSupportWebSocket {
  // Connect to WebSocket
  connect(userId: string, chatId: string): void;
  
  // Disconnect from WebSocket
  disconnect(): void;
  
  // Send message via WebSocket
  sendMessage(message: string): void;
  
  // Send typing indicator
  sendTyping(isTyping: boolean): void;
  
  // Event listeners
  onMessage(callback: (event: WebSocketNewMessageEvent) => void): void;
  onTyping(callback: (event: WebSocketTypingEvent) => void): void;
  onAgentStatus(callback: (event: WebSocketAgentStatusEvent) => void): void;
  onChatStatus(callback: (event: WebSocketChatStatusEvent) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
  onError(callback: (error: any) => void): void;
}

// Chat State Management
export interface ChatState {
  currentChat: ChatSession | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  typing: boolean;
}

// Chat Actions
export interface ChatActions {
  initChat: (request: ChatInitRequest) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  updateStatus: (request: UpdateStatusRequest) => Promise<void>;
  uploadFile: (file: any) => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  clearError: () => void;
}
