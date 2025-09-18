import EventEmitter from 'node:events'
import { RedisClient } from './redisClient'
import TokenStore from './tokenStore'

const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

describe('tokenStore', () => {
  let tokenStore: TokenStore

  beforeEach(() => {
    tokenStore = new TokenStore(redisClient as unknown as RedisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getToken', () => {
    it('Can retrieve token', async () => {
      redisClient.get.mockResolvedValue('token-1')

      await expect(tokenStore.getToken('user-1')).resolves.toBe('token-1')

      expect(redisClient.get).toHaveBeenCalledWith('systemToken:user-1')
    })

    it('Connects when no connection calling getToken', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await tokenStore.getToken('user-1')

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })

  describe('setToken', () => {
    it('Can set token', async () => {
      await tokenStore.setToken('user-1', 'token-1', 10)

      expect(redisClient.set).toHaveBeenCalledWith('systemToken:user-1', 'token-1', { EX: 10 })
    })

    it('Connects when no connection calling set token', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await tokenStore.setToken('user-1', 'token-1', 10)

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })

  describe('setTokenAndEmit', () => {
    const redisBus = new EventEmitter()
    redisBus.emit = jest.fn()

    it('Can set token and emit event', async () => {
      await tokenStore.setTokenAndEmit('key123', 'token456', 10, redisBus)

      expect(redisClient.set).toHaveBeenCalledWith('systemToken:key123', 'token456', { EX: 10 })
      expect(redisBus.emit).toHaveBeenCalledWith('key123')
    })

    it('Connects when no connection calling set token', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await tokenStore.setTokenAndEmit('key123', 'token456', 10, redisBus)

      expect(redisClient.set).toHaveBeenCalledWith('systemToken:key123', 'token456', { EX: 10 })
      expect(redisBus.emit).toHaveBeenCalledWith('key123')
    })
  })

  describe('delToken', () => {
    it('Can delete token', async () => {
      await tokenStore.setToken('user-1', 'token-1', 10)

      expect(redisClient.set).toHaveBeenCalledWith('systemToken:user-1', 'token-1', { EX: 10 })
    })

    it('Connects when no connection calling set token', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await tokenStore.setToken('user-1', 'token-1', 10)

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })
})
