import EventEmitter from 'node:events'
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
    logger.info(`Setting Redis value for ${this.prefix}${key}`)
    await this.client.set(`${this.prefix}${key}`, token, { EX: durationSeconds })
    logger.info(`Finished setting Redis value for ${this.prefix}${key}`)
  }

  public async setTokenAndEmit(key: string, token: string, durationSeconds: number, bus: EventEmitter): Promise<void> {
    try {
      await this.setToken(key, token, durationSeconds)
    } finally {
      bus.emit(key)
    }
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
}
