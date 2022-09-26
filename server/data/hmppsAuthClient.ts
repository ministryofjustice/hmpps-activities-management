import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { HmppsAuthUser, UserRole } from '../@types/hmppsAuth'
import { ServiceUser } from '../@types/express'

export default class HmppsAuthClient extends AbstractHmppsRestClient {
  constructor() {
    super('HMPPS Auth Client', config.apis.hmppsAuth as ApiConfig)
  }

  getUser(user: ServiceUser): Promise<HmppsAuthUser> {
    return this.get({ path: '/api/user/me', authToken: user.token }, user)
  }

  getUserRoles(user: ServiceUser): Promise<string[]> {
    return this.get<UserRole[]>({ path: '/api/user/me/roles', authToken: user.token }, user).then(roles =>
      roles.map(role => role.roleCode),
    )
  }
}
