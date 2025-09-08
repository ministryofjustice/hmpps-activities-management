export default interface TokenStoreInterface {
  setToken(key: string, token: string, durationSeconds: number): Promise<void>
  setTokenSync(key: string, token: string, durationSeconds: number)
  getToken(key: string): Promise<string | null>
  delToken(key: string): Promise<void>
  delTokenSync(key: string)
}
