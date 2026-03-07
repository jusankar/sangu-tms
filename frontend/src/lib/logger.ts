type LogMetadata = Record<string, unknown> | undefined

const PREFIX = "[Sangu-TMS]"

function write(level: "info" | "warn" | "error", message: string, metadata?: LogMetadata) {
  const payload = metadata ? [PREFIX, message, metadata] : [PREFIX, message]
  if (level === "info") {
    console.info(...payload)
    return
  }
  if (level === "warn") {
    console.warn(...payload)
    return
  }
  console.error(...payload)
}

export const logger = {
  info: (message: string, metadata?: LogMetadata) => write("info", message, metadata),
  warn: (message: string, metadata?: LogMetadata) => write("warn", message, metadata),
  error: (message: string, metadata?: LogMetadata) => write("error", message, metadata),
}
