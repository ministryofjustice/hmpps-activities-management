import type { RedisClient } from './redisClient'

import logger from '../../logger'
import TokenStoreInterface from './tokenStoreInterface'

export default class TokenStore implements TokenStoreInterface {
  private readonly prefix = 'systemToken:'

  constructor(private readonly client: RedisClient) {
    client.on('error', error => {
      logger.error(error, `Redis error`)
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(`${this.prefix}${key}`, token, { EX: durationSeconds })
  }

  public setTokenSync(key: string, token: string, durationSeconds: number) {
    this.ensureConnected()
      .then(() => {
        this.client
          .set(`${this.prefix}${key}`, token, { EX: durationSeconds })
          .then(() => {})
          .catch(error => {
            logger.error(error, `Redis set error`)
          })
      })
      .catch(error => {
        logger.error(error, `Redis connection error`)
      })
  }

  public async getToken(key: string): Promise<string> {
    await this.ensureConnected()

    const token = await this.client.get(`${this.prefix}${key}`)
    return typeof token === 'string' ? token : token?.toString() || ''
  }

  public async delToken(key: string): Promise<void> {
    await this.ensureConnected()
    await this.client.del(`${this.prefix}${key}`)
  }

  public delTokenSync(key: string) {
    this.ensureConnected()
      .then(() => {
        this.client
          .del(`${this.prefix}${key}`)
          .then(() => {})
          .catch(error => {
            logger.error(error, `Redis del error`)
          })
      })
      .catch(error => {
        logger.error(error, `Redis connection error`)
      })
  }
}
