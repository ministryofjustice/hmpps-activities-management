import logger from '../../logger'
import config from '../config'
import logRedisConnectionError from './redisConnectionDiagnostics'

jest.mock('../../logger', () => ({ error: jest.fn() }))
jest.mock('../config', () => ({
  redis: {
    host: 'redis.example.test',
    port: 6380,
    tls_enabled: 'true',
  },
}))

describe('Redis connection diagnostics', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    { tlsSetting: 'true', tls: true, isOpen: true, isReady: false },
    { tlsSetting: 'false', tls: false, isOpen: false, isReady: true },
  ])('logs the structured error with TLS=$tls and readiness=$isReady', ({ tlsSetting, tls, isOpen, isReady }) => {
    config.redis.tls_enabled = tlsSetting
    const error: NodeJS.ErrnoException = Object.assign(new Error('Connection reset'), {
      code: 'ECONNRESET',
      syscall: 'read',
    })

    logRedisConnectionError(error, { isOpen, isReady })

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      {
        event: 'redis_connection_error',
        err: error,
        errorCode: 'ECONNRESET',
        syscall: 'read',
        host: 'redis.example.test',
        port: 6380,
        tls,
        isOpen,
        isReady,
      },
      'Redis client error',
    )
    expect(jest.mocked(logger.error).mock.calls[0][0].err).toBe(error)
  })
})
