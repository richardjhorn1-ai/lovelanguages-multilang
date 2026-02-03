interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  },

  error: (message: string, context?: LogContext) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  },

  time: (label: string): () => void => {
    const start = Date.now();
    return () => {
      logger.info(`${label} completed`, { duration: Date.now() - start });
    };
  }
};

export const generateRequestId = () =>
  `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
