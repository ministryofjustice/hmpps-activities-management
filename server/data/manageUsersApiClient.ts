import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { UserDetails } from '../@types/manageUsersApiImport/types'

export default class ManageUsersApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Manage Users API', config.apis.manageUsersApi as ApiConfig)
  }

  // TODO: This should use /users/me when it is ready (Ticket HAAR-2352)
  getUser(user: Express.User): Promise<UserDetails> {
    return this.get({ path: `/users/${user.username}` })
  }

  getUserByUsername(username: string, user: Express.User): Promise<UserDetails> {
    return this.get({ path: `/users/${username}`, authToken: user.token })
  }
}
