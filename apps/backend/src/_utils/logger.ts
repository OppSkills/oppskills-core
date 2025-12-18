import * as winston from "winston";
import { Logger as WinstonLogger } from "winston";
import { AsyncLocalStorage } from "async_hooks";

/**
 * Minimal subset of the New Relic agent API that we use in this project.
 * We intentionally avoid importing `newrelic` at module scope because it has
 * side-effects on import (and causes noisy async logs in Jest).
 */
interface NewRelicLike {
  recordLogEvent: (event: Record<string, unknown>) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNewRelicLike(value: unknown): value is NewRelicLike {
  if (!isRecord(value)) return false;
  return (
    "recordLogEvent" in value &&
    typeof value["recordLogEvent"] === "function"
  );
}

/**
 * Lazily loads New Relic only in production.
 * - Prevents side-effects during unit tests.
 * - Keeps New Relic optional in local/dev environments.
 */
function loadNewRelic(): NewRelicLike | null {
  if (process.env.NODE_ENV !== "production") return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: unknown = require("newrelic");

    // CommonJS default export shape
    if (isNewRelicLike(mod)) return mod;

    // ESM interop shape (rare but safe)
    if (isRecord(mod) && isNewRelicLike(mod["default"])) {
      return mod["default"];
    }
  } catch {
    // New Relic is optional; ignore load failures.
  }

  return null;
}

interface LogContext {
  correlationId?: string;
  requestId?: string;
  operation?: string;
  userId?: string;
  accountId?: string;
  channelId?: string;
}

const logLevelMap: { [key: string]: string } = {
  WorkerService: "error",
  CacheService: "error",
};

export class Logger {
  private logger: WinstonLogger;
  private prefix: string;
  private static MAX_MESSAGE_LENGTH = 10000;
  private static contextStorage = new AsyncLocalStorage<LogContext>();

  constructor(prefix: string, debug = true) {
    this.prefix = prefix;

    // Create custom format for consistent logging
    const customFormat = winston.format.printf(
      ({ level, message, timestamp, stack, ...metadata }) => {
        const context = Logger.contextStorage.getStore() || {};
        const logObject = {
          ts: timestamp,
          lvl: level,
          svc: this.prefix,
          msg: message,
          uid: context.userId,
          account_id: context.accountId,
          ...context,
          ...(stack ? { stack } : {}),
          ...metadata,
        };
        return JSON.stringify(logObject);
      },
    );

    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        winston.format.errors({ stack: true }),
        customFormat,
      ),
      handleExceptions: true,
      handleRejections: true,
    });

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        customFormat,
      ),
      defaultMeta: {
        svc: this.prefix,
        env: process.env.NODE_ENV || "development",
      },
      transports: [consoleTransport],
      exitOnError: false, // Don't exit on handled exceptions
    });

    // Add production-specific transports
    if (process.env.NODE_ENV === "production") {
      // Add error file transport for production
      this.logger.add(
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true,
        }),
      );
    }
  }

  static setContext(context: Partial<LogContext>) {
    const currentContext = this.contextStorage.getStore() || {};
    this.contextStorage.enterWith({ ...currentContext, ...context });
  }

  static getContext(): LogContext {
    return this.contextStorage.getStore() || {};
  }

  /**
   * Formats arbitrary log args into a single string message.
   */
  private formatMessage(args: ReadonlyArray<unknown>): string {
    let message = args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return "[Object]";
        }
      })
      .join(" ");

    if (message.length > Logger.MAX_MESSAGE_LENGTH) {
      message = `${message.substring(0, Logger.MAX_MESSAGE_LENGTH)}... [truncated]`;
    }

    return message;
  }

  private logToWinstonAndNewRelic(level: string, args: ReadonlyArray<unknown>) {
    const message = this.formatMessage(args);
    const context = Logger.contextStorage.getStore() || {};

    // Skip logging based on logLevelMap in development
    if (
      process.env.NODE_ENV === "development" &&
      logLevelMap[this.prefix] &&
      logLevelMap[this.prefix] !== level
    ) {
      return;
    }

    // Prepare metadata
    const metadata = {
      ...context,
      ts: new Date().toISOString(),
    };

    // Log to Winston
    this.logger.log(level, message, metadata);

    // Log to New Relic in production
    if (process.env.NODE_ENV === "production") {
      try {
        const nr = loadNewRelic();
        if (nr) {
          nr.recordLogEvent({
            message: `[${this.prefix}] ${message}`,
            level,
            timestamp: Date.now(),
            ...context,
          });
        }
      } catch (error) {
        // Don't let NewRelic errors crash the application
        // eslint-disable-next-line no-console
        console.error("Error sending to NewRelic:", error);
      }
    }
  }

  debug(...args: unknown[]) {
    this.logToWinstonAndNewRelic("debug", args);
  }

  info(...args: unknown[]) {
    this.logToWinstonAndNewRelic("info", args);
  }

  warn(...args: unknown[]) {
    this.logToWinstonAndNewRelic("warn", args);
  }

  error(...args: unknown[]) {
    const formattedArgs: unknown[] = args.map((arg) => {
      if (!(arg instanceof Error)) return arg;

      const maybeCode = isRecord(arg) ? arg["code"] : undefined;
      const code =
        typeof maybeCode === "string" || typeof maybeCode === "number"
          ? maybeCode
          : undefined;

      return {
        msg: arg.message,
        stack: arg.stack,
        name: arg.name,
        code,
      };
    });
    this.logToWinstonAndNewRelic("error", formattedArgs);
  }

  log(...args: unknown[]) {
    this.logToWinstonAndNewRelic("info", args);
  }

  verbose(...args: unknown[]) {
    this.logToWinstonAndNewRelic("verbose", args);
  }
}
