/**
 * Error Handling Utility
 * Standardized error handling across the application
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  API = 'API',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userFriendlyMessage: string;
}

export class ErrorHandler {
  /**
   * Create a standardized error object
   */
  static createError(
    type: ErrorType,
    message: string,
    userFriendlyMessage?: string,
    code?: string,
    details?: any
  ): AppError {
    return {
      type,
      message,
      code,
      details,
      timestamp: new Date(),
      userFriendlyMessage: userFriendlyMessage || this.getDefaultUserMessage(type)
    };
  }

  /**
   * Get default user-friendly message for error type
   */
  private static getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Your session has expired. Please log in again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.API:
        return 'Something went wrong. Please try again later.';
      case ErrorType.STORAGE:
        return 'Unable to save data. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: any, endpoint: string): AppError {
    console.error(`API Error for ${endpoint}:`, error);

    if (error.name === 'AbortError') {
      return this.createError(
        ErrorType.NETWORK,
        'Request timeout',
        'The request took too long. Please check your connection and try again.',
        'TIMEOUT'
      );
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return this.createError(
            ErrorType.AUTHENTICATION,
            'Unauthorized',
            'Please log in again to continue.',
            'UNAUTHORIZED',
            { status, data }
          );
        case 403:
          return this.createError(
            ErrorType.AUTHENTICATION,
            'Forbidden',
            'You do not have permission to perform this action.',
            'FORBIDDEN',
            { status, data }
          );
        case 404:
          return this.createError(
            ErrorType.API,
            'Not Found',
            'The requested resource was not found.',
            'NOT_FOUND',
            { status, data }
          );
        case 422:
          return this.createError(
            ErrorType.VALIDATION,
            'Validation Error',
            data?.message || 'Please check your input and try again.',
            'VALIDATION_ERROR',
            { status, data }
          );
        case 500:
          return this.createError(
            ErrorType.API,
            'Server Error',
            'Something went wrong on our end. Please try again later.',
            'SERVER_ERROR',
            { status, data }
          );
        default:
          return this.createError(
            ErrorType.API,
            `HTTP ${status}`,
            'Something went wrong. Please try again.',
            'HTTP_ERROR',
            { status, data }
          );
      }
    }

    if (error.request) {
      return this.createError(
        ErrorType.NETWORK,
        'Network Error',
        'Please check your internet connection and try again.',
        'NETWORK_ERROR',
        { request: error.request }
      );
    }

    return this.createError(
      ErrorType.UNKNOWN,
      error.message || 'Unknown error',
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      `Validation error for ${field}: ${message}`,
      message,
      'VALIDATION_ERROR',
      { field }
    );
  }

  /**
   * Handle storage errors
   */
  static handleStorageError(operation: string, error: any): AppError {
    return this.createError(
      ErrorType.STORAGE,
      `Storage error during ${operation}: ${error.message}`,
      'Unable to save data. Please try again.',
      'STORAGE_ERROR',
      { operation, originalError: error }
    );
  }

  /**
   * Log error for debugging
   */
  static logError(error: AppError, context?: string): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      context,
      details: error.details
    };

    if (__DEV__) {
      console.error('🚨 App Error:', logData);
    }

    // In production, you might want to send this to a logging service
    // Example: Analytics.track('error', logData);
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    return error.userFriendlyMessage;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return error.type === ErrorType.NETWORK || 
           error.type === ErrorType.API ||
           (error.code === 'TIMEOUT');
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}

export default ErrorHandler;



