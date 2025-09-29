/**
 * Error Reporting Handler
 * Handles BGG API errors, logging, and error analytics
 */

import { EventHandler } from '../EventBus';
import {
  BGGEvent,
  BGGApiErrorEvent,
  BGGApiRateLimitedEvent,
  GameSearchFailedEvent,
  GameDetailsFailedEvent,
  CollectionFailedEvent,
} from '../BGGEvents';

export interface ErrorReport {
  errorId: string;
  timestamp: string;
  errorType: string;
  operation: string;
  errorCode: string;
  errorMessage: string;
  userMessage?: string;
  retryable: boolean;
  retryAfter?: number;
  context: Record<string, any>;
  stackTrace?: string;
}

export class ErrorReportingHandler {
  private errorHistory: ErrorReport[] = [];
  private errorCounts: Map<string, number> = new Map();
  private operationErrors: Map<string, number> = new Map();
  private retryableErrors: Set<string> = new Set();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // API error events
    this.handleBGGApiError = this.handleBGGApiError.bind(this);
    this.handleBGGApiRateLimited = this.handleBGGApiRateLimited.bind(this);

    // Service error events
    this.handleGameSearchFailed = this.handleGameSearchFailed.bind(this);
    this.handleGameDetailsFailed = this.handleGameDetailsFailed.bind(this);
    this.handleCollectionFailed = this.handleCollectionFailed.bind(this);
  }

  /**
   * Handle BGG API error events
   */
  handleBGGApiError: EventHandler<BGGApiErrorEvent> = async event => {
    try {
      const { operation, error, request, response, retryable } = event.data;

      // Create error report
      const errorReport: ErrorReport = {
        errorId: event.eventId,
        timestamp: event.timestamp,
        errorType: 'bgg_api_error',
        operation,
        errorCode: error.code,
        errorMessage: error.message,
        userMessage: error.userMessage,
        retryable,
        retryAfter: error.retryAfter,
        context: {
          request,
          response,
          source: event.source,
        },
      };

      // Track error
      this.trackError(errorReport);

      // Log error
      this.logError(errorReport);

      // Handle specific error types
      this.handleSpecificErrorType(error.code, errorReport);
    } catch (error) {
      console.error(
        'ErrorReportingHandler: Error handling BGG API error:',
        error
      );
    }
  };

  /**
   * Handle BGG API rate limited events
   */
  handleBGGApiRateLimited: EventHandler<BGGApiRateLimitedEvent> =
    async event => {
      try {
        const { operation, retryAfter, requestCount, windowStart, windowEnd } =
          event.data;

        // Create error report
        const errorReport: ErrorReport = {
          errorId: event.eventId,
          timestamp: event.timestamp,
          errorType: 'bgg_api_rate_limited',
          operation,
          errorCode: 'RATE_LIMIT',
          errorMessage: `Rate limited after ${requestCount} requests`,
          userMessage: 'Too many requests. Please wait before trying again.',
          retryable: true,
          retryAfter,
          context: {
            requestCount,
            windowStart,
            windowEnd,
            source: event.source,
          },
        };

        // Track error
        this.trackError(errorReport);

        // Log error
        this.logError(errorReport);

        // Track rate limiting patterns
        this.trackRateLimitingPattern(operation, requestCount, retryAfter);
      } catch (error) {
        console.error(
          'ErrorReportingHandler: Error handling BGG API rate limited:',
          error
        );
      }
    };

  /**
   * Handle game search failed events
   */
  handleGameSearchFailed: EventHandler<GameSearchFailedEvent> = async event => {
    try {
      const { query, filters, error, retryable } = event.data;

      // Create error report
      const errorReport: ErrorReport = {
        errorId: event.eventId,
        timestamp: event.timestamp,
        errorType: 'game_search_failed',
        operation: 'searchGames',
        errorCode: error.code,
        errorMessage: error.message,
        userMessage: error.userMessage,
        retryable,
        context: {
          query: this.sanitizeQuery(query),
          filters,
          source: event.source,
        },
      };

      // Track error
      this.trackError(errorReport);

      // Log error
      this.logError(errorReport);

      // Analyze search failure patterns
      this.analyzeSearchFailurePattern(query, error.code);
    } catch (error) {
      console.error(
        'ErrorReportingHandler: Error handling game search failed:',
        error
      );
    }
  };

  /**
   * Handle game details failed events
   */
  handleGameDetailsFailed: EventHandler<GameDetailsFailedEvent> =
    async event => {
      try {
        const { gameId, error, retryable, attempt, maxAttempts } = event.data;

        // Create error report
        const errorReport: ErrorReport = {
          errorId: event.eventId,
          timestamp: event.timestamp,
          errorType: 'game_details_failed',
          operation: 'getGameDetails',
          errorCode: error.code,
          errorMessage: error.message,
          userMessage: error.userMessage,
          retryable,
          context: {
            gameId,
            attempt,
            maxAttempts,
            source: event.source,
          },
        };

        // Track error
        this.trackError(errorReport);

        // Log error
        this.logError(errorReport);

        // Analyze game details failure patterns
        this.analyzeGameDetailsFailurePattern(
          gameId,
          error.code,
          attempt,
          maxAttempts
        );
      } catch (error) {
        console.error(
          'ErrorReportingHandler: Error handling game details failed:',
          error
        );
      }
    };

  /**
   * Handle collection failed events
   */
  handleCollectionFailed: EventHandler<CollectionFailedEvent> = async event => {
    try {
      const { username, error, retryable } = event.data;

      // Create error report
      const errorReport: ErrorReport = {
        errorId: event.eventId,
        timestamp: event.timestamp,
        errorType: 'collection_failed',
        operation: 'getUserCollection',
        errorCode: error.code,
        errorMessage: error.message,
        userMessage: error.userMessage,
        retryable,
        context: {
          username: this.sanitizeUsername(username),
          source: event.source,
        },
      };

      // Track error
      this.trackError(errorReport);

      // Log error
      this.logError(errorReport);

      // Analyze collection failure patterns
      this.analyzeCollectionFailurePattern(username, error.code);
    } catch (error) {
      console.error(
        'ErrorReportingHandler: Error handling collection failed:',
        error
      );
    }
  };

  /**
   * Track error
   */
  private trackError(errorReport: ErrorReport): void {
    // Add to error history
    this.errorHistory.push(errorReport);

    // Keep only last 1000 errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }

    // Track error counts
    const errorKey = `${errorReport.errorType}:${errorReport.errorCode}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Track operation errors
    this.operationErrors.set(
      errorReport.operation,
      (this.operationErrors.get(errorReport.operation) || 0) + 1
    );

    // Track retryable errors
    if (errorReport.retryable) {
      this.retryableErrors.add(errorReport.errorId);
    }
  }

  /**
   * Log error
   */
  private logError(errorReport: ErrorReport): void {
    const logLevel = this.getLogLevel(errorReport.errorCode);
    const logMessage = this.formatLogMessage(errorReport);

    switch (logLevel) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      default:
        console.log(logMessage);
    }

    // In production, this would send to error reporting service (Sentry, Bugsnag, etc.)
    // Example: errorReportingService.captureException(errorReport);
  }

  /**
   * Handle specific error types
   */
  private handleSpecificErrorType(
    errorCode: string,
    errorReport: ErrorReport
  ): void {
    switch (errorCode) {
      case 'RATE_LIMIT':
        this.handleRateLimitError(errorReport);
        break;
      case 'API_UNAVAILABLE':
        this.handleApiUnavailableError(errorReport);
        break;
      case 'NETWORK_ERROR':
        this.handleNetworkError(errorReport);
        break;
      case 'PARSE_ERROR':
        this.handleParseError(errorReport);
        break;
      default:
        this.handleGenericError(errorReport);
    }
  }

  /**
   * Handle rate limit errors
   */
  private handleRateLimitError(errorReport: ErrorReport): void {
    // Log rate limiting information
    console.warn(`Rate limit exceeded for operation: ${errorReport.operation}`);

    // Track rate limiting patterns
    if (errorReport.context.request) {
      console.warn('Request details:', errorReport.context.request);
    }
  }

  /**
   * Handle API unavailable errors
   */
  private handleApiUnavailableError(errorReport: ErrorReport): void {
    // Log API unavailability
    console.error(
      `BGG API unavailable for operation: ${errorReport.operation}`
    );

    // Track API availability issues
    this.trackApiAvailabilityIssue(errorReport.operation);
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(errorReport: ErrorReport): void {
    // Log network issues
    console.error(`Network error for operation: ${errorReport.operation}`);

    // Track network issues
    this.trackNetworkIssue(errorReport.operation);
  }

  /**
   * Handle parse errors
   */
  private handleParseError(errorReport: ErrorReport): void {
    // Log parse issues
    console.error(`Parse error for operation: ${errorReport.operation}`);

    // Track parse issues
    this.trackParseIssue(errorReport.operation);
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(errorReport: ErrorReport): void {
    // Log generic error
    console.error(`Generic error for operation: ${errorReport.operation}`);
  }

  /**
   * Track rate limiting patterns
   */
  private trackRateLimitingPattern(
    operation: string,
    requestCount: number,
    retryAfter: number
  ): void {
    // Track rate limiting patterns for optimization
    console.warn(
      `Rate limiting pattern detected: ${operation} - ${requestCount} requests, retry after ${retryAfter}s`
    );
  }

  /**
   * Analyze search failure patterns
   */
  private analyzeSearchFailurePattern(query: string, errorCode: string): void {
    // Analyze search failure patterns
    console.warn(
      `Search failure pattern: query="${query}", error=${errorCode}`
    );
  }

  /**
   * Analyze game details failure patterns
   */
  private analyzeGameDetailsFailurePattern(
    gameId: string,
    errorCode: string,
    attempt: number,
    maxAttempts: number
  ): void {
    // Analyze game details failure patterns
    console.warn(
      `Game details failure pattern: gameId=${gameId}, error=${errorCode}, attempt=${attempt}/${maxAttempts}`
    );
  }

  /**
   * Analyze collection failure patterns
   */
  private analyzeCollectionFailurePattern(
    username: string,
    errorCode: string
  ): void {
    // Analyze collection failure patterns
    console.warn(
      `Collection failure pattern: username=${username}, error=${errorCode}`
    );
  }

  /**
   * Track API availability issues
   */
  private trackApiAvailabilityIssue(operation: string): void {
    // Track API availability issues
    console.warn(`API availability issue tracked for operation: ${operation}`);
  }

  /**
   * Track network issues
   */
  private trackNetworkIssue(operation: string): void {
    // Track network issues
    console.warn(`Network issue tracked for operation: ${operation}`);
  }

  /**
   * Track parse issues
   */
  private trackParseIssue(operation: string): void {
    // Track parse issues
    console.warn(`Parse issue tracked for operation: ${operation}`);
  }

  /**
   * Get log level for error code
   */
  private getLogLevel(errorCode: string): 'error' | 'warn' | 'info' | 'debug' {
    switch (errorCode) {
      case 'RATE_LIMIT':
        return 'warn';
      case 'API_UNAVAILABLE':
      case 'NETWORK_ERROR':
        return 'error';
      case 'PARSE_ERROR':
        return 'warn';
      default:
        return 'error';
    }
  }

  /**
   * Format log message
   */
  private formatLogMessage(errorReport: ErrorReport): string {
    const context =
      Object.keys(errorReport.context).length > 0
        ? ` | Context: ${JSON.stringify(errorReport.context)}`
        : '';

    return `[${errorReport.errorType}] ${errorReport.operation}: ${errorReport.errorMessage} (${errorReport.errorCode})${context}`;
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    return query.replace(/[<>\"']/g, '').substring(0, 100);
  }

  /**
   * Sanitize username for logging
   */
  private sanitizeUsername(username: string): string {
    return username.replace(/[<>\"']/g, '').substring(0, 50);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorCounts: Array<{ errorType: string; count: number }>;
    operationErrors: Array<{ operation: string; count: number }>;
    retryableErrors: number;
    recentErrors: ErrorReport[];
  } {
    const errorCounts = Array.from(this.errorCounts.entries())
      .map(([errorType, count]) => ({ errorType, count }))
      .sort((a, b) => b.count - a.count);

    const operationErrors = Array.from(this.operationErrors.entries())
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count);

    const recentErrors = this.errorHistory.slice(-50).reverse();

    return {
      totalErrors: this.errorHistory.length,
      errorCounts,
      operationErrors,
      retryableErrors: this.retryableErrors.size,
      recentErrors,
    };
  }

  /**
   * Get error trends
   */
  getErrorTrends(): {
    errorsByHour: Array<{ hour: string; count: number }>;
    errorsByType: Array<{ type: string; count: number }>;
    errorsByOperation: Array<{ operation: string; count: number }>;
  } {
    const now = new Date();
    const errorsByHour: Map<string, number> = new Map();
    const errorsByType: Map<string, number> = new Map();
    const errorsByOperation: Map<string, number> = new Map();

    // Initialize hourly buckets for last 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().substring(0, 13) + ':00:00Z';
      errorsByHour.set(hourKey, 0);
    }

    // Count errors
    for (const error of this.errorHistory) {
      const errorTime = new Date(error.timestamp);
      const hourKey = errorTime.toISOString().substring(0, 13) + ':00:00Z';

      if (errorsByHour.has(hourKey)) {
        errorsByHour.set(hourKey, (errorsByHour.get(hourKey) || 0) + 1);
      }

      errorsByType.set(
        error.errorType,
        (errorsByType.get(error.errorType) || 0) + 1
      );
      errorsByOperation.set(
        error.operation,
        (errorsByOperation.get(error.operation) || 0) + 1
      );
    }

    return {
      errorsByHour: Array.from(errorsByHour.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      errorsByType: Array.from(errorsByType.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      errorsByOperation: Array.from(errorsByOperation.entries())
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
    this.operationErrors.clear();
    this.retryableErrors.clear();
  }
}

// Export singleton instance
export const errorReportingHandler = new ErrorReportingHandler();
