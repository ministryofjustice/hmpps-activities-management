import { RedisClient } from './redisClient'
import TokenStore from './tokenStore'

const redisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

describe('tokenStore', () => {
  let tokenStore: TokenStore

  beforeEach(() => {
    redisClient.set.mockResolvedValue(undefined)
    redisClient.del.mockResolvedValue(undefined)
    ;(redisClient as unknown as Record<string, boolean>).isOpen = true

    tokenStore = new TokenStore(redisClient as unknown as RedisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('async functions', () => {
    describe('get token', () => {
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

    describe('set token', () => {
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

    describe('del token', () => {
      it('Can delete token', async () => {
        await tokenStore.delToken('user-1')

        expect(redisClient.del).toHaveBeenCalledWith('systemToken:user-1')
      })

      it('Connects when no connection calling delete token', async () => {
        ;(redisClient as unknown as Record<string, boolean>).isOpen = false

        await tokenStore.delToken('user-1')

        expect(redisClient.connect).toHaveBeenCalledWith()
      })
    })
  })

  describe('sync functions', () => {
    describe('set token', () => {
      it('Can set token', async () => {
        const f = new TokenStore(redisClient as unknown as RedisClient)

        await f.setTokenSync('user-1', 'token-1', 10)

        expect(redisClient.set).toHaveBeenCalledWith('systemToken:user-1', 'token-1', { EX: 10 })
      })

      it('Connects when no connection calling set token sync', async () => {
        ;(redisClient as unknown as Record<string, boolean>).isOpen = false

        await tokenStore.setTokenSync('user-1', 'token-1', 10)

        expect(redisClient.connect).toHaveBeenCalledWith()
      })
    })

    describe('del token', () => {
      it('Can delete token', async () => {
        await tokenStore.delTokenSync('user-1')

        expect(redisClient.del).toHaveBeenCalledWith('systemToken:user-1')
      })

      it('Connects when no connection calling delete token', async () => {
        ;(redisClient as unknown as Record<string, boolean>).isOpen = false

        await tokenStore.delTokenSync('user-1')

        expect(redisClient.connect).toHaveBeenCalledWith()
      })
    })
  })
})
