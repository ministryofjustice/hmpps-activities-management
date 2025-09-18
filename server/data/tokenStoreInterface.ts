import EventEmitter from 'node:events'

export default interface TokenStoreInterface {
  setToken(key: string, token: string, durationSeconds: number): Promise<void>
  setTokenAndEmit(key: string, token: string, durationSeconds: number, bus?: EventEmitter): Promise<void>
  getToken(key: string): Promise<string | null>
  delToken(key: string): Promise<void>
}
