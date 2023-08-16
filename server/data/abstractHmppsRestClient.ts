import superagent, { SuperAgentRequest } from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'

import logger from '../../logger'
import sanitiseError from '../sanitisedError'
import config, { ApiConfig } from '../config'
import TokenStore from './tokenStore'
import { createRedisClient } from './redisClient'
import generateOauthClientToken from '../authentication/clientCredentials'
import { ServiceUser } from '../@types/express'

interface Request {
  path: string
  query?: string[][] | Record<string, unknown> | string | URLSearchParams
  headers?: Record<string, string>
  responseType?: string
  authToken?: string
}

interface SendDataRequest extends Request {
  data: Record<string, unknown> | number[] | string[] | Record<string, unknown>[]
}

export default abstract class AbstractHmppsRestClient {
  private agent: Agent

  private tokenStore: TokenStore

  protected constructor(private readonly name: string, private readonly apiConfig: ApiConfig) {
    this.agent = apiConfig.url.startsWith('https') ? new HttpsAgent(apiConfig.agent) : new Agent(apiConfig.agent)
    this.tokenStore = new TokenStore(createRedisClient())
  }

  private async getSystemToken(username: string): Promise<string> {
    const key = username || '%ANONYMOUS%'
    const token = await this.tokenStore.getToken(key)
    if (token) {
      return token
    }

    const clientToken = generateOauthClientToken(
      config.apis.hmppsAuth.systemClientId,
      config.apis.hmppsAuth.systemClientSecret,
    )

    const authRequest = username
      ? new URLSearchParams({ grant_type: 'client_credentials', username }).toString()
      : new URLSearchParams({ grant_type: 'client_credentials' }).toString()

    logger.info(
      `HMPPS Auth request '${authRequest}' for client id '${config.apis.hmppsAuth.systemClientId}' and user '${key}'`,
    )

    const response = await superagent
      .post(`${config.apis.hmppsAuth.url}/oauth/token`)
      .set('Authorization', clientToken)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(authRequest)
      .timeout(config.apis.hmppsAuth.timeout)

    // Set the TTL slightly less than expiry of token
    await this.tokenStore.setToken(key, response.body.access_token, response.body.expires_in - 60)
    return response.body.access_token
  }

  private async makeRequest<T>(
    request: SuperAgentRequest,
    { path = null, query = {}, headers = {}, responseType = '', authToken = null }: Request,
    user: Express.User,
  ): Promise<T> {
    logger.info(
      `${request.method.toUpperCase()} using ${authToken ? 'service' : 'admin'} client credentials: calling ${
        this.name
      }: ${path}?${new URLSearchParams(query as Record<string, string>).toString()}`,
    )

    const token = authToken || (await this.getSystemToken(user?.username))

    return request
      .query(query)
      .agent(this.agent)
      .set('Content-Type', 'application/json')
      .auth(token, { type: 'bearer' })
      .set(headers)
      .responseType(responseType)
      .timeout(this.apiConfig.timeout)
      .then(response => {
        return response.body
      })
      .catch(error => {
        const sanitisedError = sanitiseError(error)
        logger.warn(
          { ...sanitisedError, query },
          `Error calling ${this.name}, path: '${path}', verb: '${request.method}'`,
        )
        throw sanitisedError
      }) as T
  }

  protected async get<T>(request: Request, user?: ServiceUser): Promise<T> {
    return this.makeRequest(superagent.get(`${this.apiConfig.url}${request.path}`), request, user)
  }

  protected async post<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.makeRequest(superagent.post(`${this.apiConfig.url}${request.path}`).send(request.data), request, user)
  }

  protected async put<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.makeRequest(superagent.put(`${this.apiConfig.url}${request.path}`).send(request.data), request, user)
  }

  protected async patch<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.makeRequest(superagent.patch(`${this.apiConfig.url}${request.path}`).send(request.data), request, user)
  }

  protected async delete<T>(request: Request, user?: ServiceUser): Promise<T> {
    return this.makeRequest(superagent.delete(`${this.apiConfig.url}${request.path}`), request, user)
  }
}
