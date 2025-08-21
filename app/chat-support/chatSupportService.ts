// Chat Support API Service Implementation
// This is a sample implementation showing how the frontend will interact with the backend

import { 
  ChatSupportAPI, 
  ChatInitRequest, 
  ChatInitResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  GetSessionsRequest,
  GetSessionsResponse,
  UpdateStatusRequest,
  UpdateStatusResponse,
  UploadRequest,
  UploadResponse,
  GetCategoriesResponse,
  GetFAQSuggestionsRequest,
  GetFAQSuggestionsResponse,
  ErrorResponse
} from './types';

class ChatSupportService implements ChatSupportAPI {
  private baseURL: string;
  private authToken: string | null;

  constructor() {
    this.baseURL = 'https://esusu-server.onrender.com/api/chat-support';
    this.authToken = null;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Get headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Make HTTP request with error handling
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat support API error:', error);
      throw error;
    }
  }

  // Initialize chat session
  async initChat(request: ChatInitRequest): Promise<ChatInitResponse> {
    return this.makeRequest<ChatInitResponse>('/init', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Send message
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    return this.makeRequest<SendMessageResponse>('/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get chat messages
  async getMessages(request: GetMessagesRequest): Promise<GetMessagesResponse> {
    const { chatId, page = 1, limit = 50, before } = request;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (before) {
      params.append('before', before);
    }

    return this.makeRequest<GetMessagesResponse>(`/messages/${chatId}?${params}`);
  }

  // Get chat sessions
  async getSessions(request: GetSessionsRequest = {}): Promise<GetSessionsResponse> {
    const { page = 1, limit = 20, status } = request;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return this.makeRequest<GetSessionsResponse>(`/sessions?${params}`);
  }

  // Update chat status
  async updateStatus(request: UpdateStatusRequest): Promise<UpdateStatusResponse> {
    return this.makeRequest<UpdateStatusResponse>('/status', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Upload file
  async uploadFile(request: UploadRequest): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('chatId', request.chatId);
    formData.append('messageType', request.messageType);

    // Override headers for file upload
    const headers = { ...this.getHeaders() };
    delete headers['Content-Type']; // Let browser set content-type for FormData

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Get support categories
  async getCategories(): Promise<GetCategoriesResponse> {
    return this.makeRequest<GetCategoriesResponse>('/categories');
  }

  // Get FAQ suggestions
  async getFAQSuggestions(request: GetFAQSuggestionsRequest): Promise<GetFAQSuggestionsResponse> {
    const { issueType, keywords } = request;
    const params = new URLSearchParams({
      issueType,
    });

    if (keywords) {
      params.append('keywords', keywords);
    }

    return this.makeRequest<GetFAQSuggestionsResponse>(`/faq-suggestions?${params}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}

// WebSocket Service Implementation
export class ChatSupportWebSocketService {
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Connect to WebSocket
  connect(userId: string, chatId: string) {
    try {
      // Replace with your WebSocket server URL
      const wsUrl = `wss://esusu-server.onrender.com/ws/chat-support?userId=${userId}&chatId=${chatId}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connect');
        
        // Send connection event
        this.socket?.send(JSON.stringify({
          event: 'connect',
          data: { userId, chatId }
        }));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnect');
        this.attemptReconnect(userId, chatId);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.emit('error', error);
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Send message via WebSocket
  sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        event: 'message',
        data: { message }
      }));
    }
  }

  // Send typing indicator
  sendTyping(isTyping: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        event: 'typing',
        data: { isTyping }
      }));
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: any) {
    const { event, ...eventData } = data;
    
    switch (event) {
      case 'new_message':
        this.emit('new_message', eventData);
        break;
      case 'typing':
        this.emit('typing', eventData);
        break;
      case 'agent_status':
        this.emit('agent_status', eventData);
        break;
      case 'chat_status':
        this.emit('chat_status', eventData);
        break;
      default:
        console.log('Unknown WebSocket event:', event);
    }
  }

  // Attempt to reconnect
  private attemptReconnect(userId: string, chatId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId, chatId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Remove event listener
  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Export singleton instances
export const chatSupportAPI = new ChatSupportService();
export const chatSupportWebSocket = new ChatSupportWebSocketService();

// Usage examples for backend engineer reference:

/*
// Example 1: Initialize a chat session
const initResponse = await chatSupportAPI.initChat({
  userId: "user123",
  userPhone: "+2348012345678",
  userName: "John Doe",
  issueType: "technical",
  priority: "high",
  description: "I can't access my dashboard"
});

// Example 2: Send a message
const messageResponse = await chatSupportAPI.sendMessage({
  chatId: "chat456",
  message: "Hello, I need help with my account",
  messageType: "text",
  timestamp: new Date().toISOString()
});

// Example 3: Get chat history
const messagesResponse = await chatSupportAPI.getMessages({
  chatId: "chat456",
  page: 1,
  limit: 50
});

// Example 4: Upload a file
const file = new File(['content'], 'screenshot.png', { type: 'image/png' });
const uploadResponse = await chatSupportAPI.uploadFile({
  file,
  chatId: "chat456",
  messageType: "image"
});

// Example 5: WebSocket connection
chatSupportWebSocket.connect("user123", "chat456");

chatSupportWebSocket.on('new_message', (data) => {
  console.log('New message received:', data);
});

chatSupportWebSocket.sendMessage("Hello from client!");
*/
