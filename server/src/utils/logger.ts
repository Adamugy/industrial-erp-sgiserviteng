/**
 * Simple Structured Logger for SGI ERP
 */

enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
}

class Logger {
    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | meta: ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }

    info(message: string, meta?: any) {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }

    warn(message: string, meta?: any) {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }

    error(message: string, error?: any, meta?: any) {
        let errorMessage = message;
        if (error instanceof Error) {
            errorMessage = `${message} | ${error.message}`;
            if (error.stack) {
                // In production you might want to log this to a file or monitoring service
                console.error(error.stack);
            }
        }
        console.error(this.formatMessage(LogLevel.ERROR, errorMessage, meta));
    }

    debug(message: string, meta?: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
}

export const logger = new Logger();
export default logger;
