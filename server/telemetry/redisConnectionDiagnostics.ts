import logger from '../../logger'
import config from '../config'

export default function logRedisConnectionError(
  error: NodeJS.ErrnoException,
  client: { isOpen: boolean; isReady: boolean },
): void {
  logger.error(
    // enriched error context
    {
      event: 'redis_connection_error',
      err: error,
      errorCode: error.code,
      syscall: error.syscall,
      host: config.redis.host,
      port: config.redis.port,
      tls: config.redis.tls_enabled === 'true',
      isOpen: client.isOpen,
      isReady: client.isReady,
    },
    // the existing error below
    'Redis client error',
  )
}
