export default interface TokenStoreInterface {
  setToken(key: string, token: string, durationSeconds: number): Promise<void>
  getToken(key: string): Promise<string | null>
  delToken(key: string): Promise<void>
}
