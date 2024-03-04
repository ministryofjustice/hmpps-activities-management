import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { UserDetails } from '../@types/manageUsersApiImport/types'

export default class ManageUsersApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Manage Users API', config.apis.manageUsersApi as ApiConfig)
  }

  getUser(user: Express.User): Promise<UserDetails> {
    return this.get({ path: `/users/${user.username}` })
  }
}
