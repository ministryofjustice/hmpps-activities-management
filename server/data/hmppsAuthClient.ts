import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { HmppsAuthUser } from '../@types/hmppsAuth'

export default class HmppsAuthClient extends AbstractHmppsRestClient {
  constructor() {
    super('HMPPS Auth Client', config.apis.hmppsAuth as ApiConfig)
  }

  getUser(user: Express.User): Promise<HmppsAuthUser> {
    return this.get({ path: '/api/user/me', authToken: user.token })
  }
}
