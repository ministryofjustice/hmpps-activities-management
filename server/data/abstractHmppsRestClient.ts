import { ApiConfig, RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'
import config from '../config'
import sanitiseError from '../sanitisedError'
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
  private tokenStore: TokenStore

  private restClient: RestClient

  private hmppsAuthClient: RestClient

  protected constructor(
    private readonly name: string,
    private readonly apiConfig: ApiConfig,
  ) {
    this.tokenStore = new TokenStore(createRedisClient())
    this.restClient = new RestClient(name, apiConfig, logger, {
      getToken: this.getSystemToken.bind(this),
    })
    this.hmppsAuthClient = new RestClient('HMPPS Auth', config.apis.hmppsAuth as ApiConfig, logger)
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

    const response = await this.hmppsAuthClient.makeRestClientCall('', ({ superagent, agent }) =>
      superagent
        .post(`${config.apis.hmppsAuth.url}/oauth/token`)
        .agent(agent)
        .set('Authorization', clientToken)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(authRequest),
    )

    // Set the TTL slightly less than expiry of token
    await this.tokenStore.setToken(key, response.body.access_token, response.body.expires_in - 60)
    return response.body.access_token
  }

  private async makeRequest<T>(
    method: 'GET' | 'DELETE',
    { path = null, query = {}, headers = {}, responseType = '', authToken = null }: Request,
    user: Express.User,
  ): Promise<T> {
    logger.info(
      `${method} using ${authToken ? 'service' : 'admin'} client credentials: calling ${
        this.name
      }: ${path}?${new URLSearchParams(query as Record<string, string>).toString()}`,
    )

    const auth = authToken || asSystem(user?.username)

    const requestConfig = {
      path,
      query,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      responseType,
      errorHandler: (_path: string, _verb: string, error: unknown) => {
        throw sanitiseError(error as never)
      },
    }

    if (method === 'GET') {
      return this.restClient.get<T>(requestConfig, auth)
    }

    return this.restClient.delete<T>(requestConfig, auth)
  }

  protected async get<T>(request: Request, user?: ServiceUser): Promise<T> {
    return this.makeRequest('GET', request, user)
  }

  protected async post<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.restClient.post<T>(
      {
        path: request.path,
        query: request.query,
        headers: {
          ...request.headers,
          'Content-Type': 'application/json',
        },
        responseType: request.responseType,
        data: request.data,
        errorHandler: (_path: string, _verb: string, error: unknown) => {
          throw sanitiseError(error as never)
        },
      },
      request.authToken || asSystem(user?.username),
    )
  }

  protected async put<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.restClient.put<T>(
      {
        path: request.path,
        query: request.query,
        headers: {
          ...request.headers,
          'Content-Type': 'application/json',
        },
        responseType: request.responseType,
        data: request.data,
        errorHandler: (_path: string, _verb: string, error: unknown) => {
          throw sanitiseError(error as never)
        },
      },
      request.authToken || asSystem(user?.username),
    )
  }

  protected async patch<T>(request: SendDataRequest, user?: ServiceUser): Promise<T> {
    return this.restClient.patch<T>(
      {
        path: request.path,
        query: request.query,
        headers: {
          ...request.headers,
          'Content-Type': 'application/json',
        },
        responseType: request.responseType,
        data: request.data,
        errorHandler: (_path: string, _verb: string, error: unknown) => {
          throw sanitiseError(error as never)
        },
      },
      request.authToken || asSystem(user?.username),
    )
  }

  protected async delete<T>(request: Request, user?: ServiceUser): Promise<T> {
    return this.makeRequest('DELETE', request, user)
  }

  protected async stream(request: Request, user?: ServiceUser): Promise<unknown> {
    return this.restClient.stream(
      {
        path: request.path,
        headers: {
          ...request.headers,
          'Content-Type': 'application/json',
        },
      },
      request.authToken || asSystem(user?.username),
    )
  }
}
