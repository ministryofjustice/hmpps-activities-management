// eslint-disable-next-line max-classes-per-file
import nock from 'nock'

import TokenStore from './tokenStore'
import * as clientCredentials from '../authentication/clientCredentials'
import * as sanitiseError from '../sanitisedError'

import config, { ApiConfig } from '../config'
import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'

jest.mock('./tokenStore')

const tokenStoreSpy = {
  getToken: jest.spyOn(TokenStore.prototype, 'getToken'),
  setToken: jest.spyOn(TokenStore.prototype, 'setToken'),
}

const user = { token: 'token-1', username: 'user-name' } as ServiceUser

class ClientUsingTokenForAuth extends AbstractHmppsRestClient {
  constructor() {
    super('ClientUsingTokenForAuth', { url: 'http://localhost:8080' } as ApiConfig)
  }

  testRequest = (u: ServiceUser) => this.get({ path: '/route', authToken: user.token }, u)
}

class ClientUsingUsernameForAuth extends AbstractHmppsRestClient {
  constructor() {
    super('ClientUsingUsernameForAuth', { url: 'http://localhost:8080' } as ApiConfig)
  }

  testRequest = (u: ServiceUser) => this.get({ path: '/route' }, u)
}

class ClientUsingWithAnonymousAuth extends AbstractHmppsRestClient {
  constructor() {
    super('ClientUsingWithAnonymousAuth', { url: 'http://localhost:8080' } as ApiConfig)
  }

  testRequest = () => this.get({ path: '/route' })
}

describe('abstractHmppsRestClient', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    fakeApi = nock('http://localhost:8080')
    jest.spyOn(clientCredentials, 'default').mockReturnValue('clientToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('Request using supplied token for authentication', () => {
    const client = new ClientUsingTokenForAuth()

    it('should use the supplied token for authentication', async () => {
      fakeApi.get('/route').matchHeader('Authorization', `Bearer ${user.token}`).reply(200)

      await client.testRequest(user)

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('Request using supplied username for authentication', () => {
    it('should use the token stored in tokenStore', async () => {
      tokenStoreSpy.getToken.mockResolvedValue('token_from_store')
      const client = new ClientUsingUsernameForAuth()

      fakeApi.get('/route').matchHeader('Authorization', `Bearer token_from_store`).reply(200)

      await client.testRequest(user)

      expect(nock.isDone()).toBe(true)
      expect(tokenStoreSpy.getToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.getToken).toBeCalledWith('user-name')
    })

    it('should generate a token using the username', async () => {
      tokenStoreSpy.getToken.mockResolvedValue(undefined)
      const client = new ClientUsingUsernameForAuth()

      nock(config.apis.hmppsAuth.url)
        .post('/oauth/token')
        .matchHeader('Authorization', 'clientToken')
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, { access_token: 'accessToken', expires_in: 3000 })
      fakeApi.get('/route').matchHeader('Authorization', `Bearer accessToken`).reply(200)

      await client.testRequest(user)

      expect(nock.isDone()).toBe(true)
      expect(tokenStoreSpy.getToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.getToken).toBeCalledWith('user-name')
      expect(tokenStoreSpy.setToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.setToken).toBeCalledWith('user-name', 'accessToken', 2940)
    })
  })

  describe('Request using anonymous token', () => {
    it('should use the token stored in tokenStore', async () => {
      tokenStoreSpy.getToken.mockResolvedValue('token_from_store')
      const client = new ClientUsingWithAnonymousAuth()

      fakeApi.get('/route').matchHeader('Authorization', `Bearer token_from_store`).reply(200)

      await client.testRequest()

      expect(nock.isDone()).toBe(true)
      expect(tokenStoreSpy.getToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.getToken).toBeCalledWith('%ANONYMOUS%')
    })

    it('should generate a token using the username', async () => {
      tokenStoreSpy.getToken.mockResolvedValue(undefined)
      const client = new ClientUsingWithAnonymousAuth()

      nock(config.apis.hmppsAuth.url)
        .post('/oauth/token')
        .matchHeader('Authorization', 'clientToken')
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, { access_token: 'accessToken', expires_in: 3000 })
      fakeApi.get('/route').matchHeader('Authorization', `Bearer accessToken`).reply(200)

      await client.testRequest()

      expect(nock.isDone()).toBe(true)
      expect(tokenStoreSpy.getToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.getToken).toBeCalledWith('%ANONYMOUS%')
      expect(tokenStoreSpy.setToken).toBeCalledTimes(1)
      expect(tokenStoreSpy.setToken).toBeCalledWith('%ANONYMOUS%', 'accessToken', 2940)
    })
  })

  describe('Error handling', () => {
    const client = new ClientUsingTokenForAuth()

    beforeEach(() => {
      jest.spyOn(sanitiseError, 'default').mockReturnValue({ message: 'sanitised message', stack: '' })
    })

    it('should sanitise error on failure', async () => {
      fakeApi.get('/route').replyWithError({
        status: 400,
        response: { data: { detail: { error_reason: 'unsanitised message' } } },
      })

      let error
      try {
        await client.testRequest(user)
      } catch (e) {
        error = e
      }

      expect(error.message).toBe('sanitised message')
    })
  })
})
