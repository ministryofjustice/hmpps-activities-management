import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'
import config from '../config'
import { UserDetails } from '../@types/manageUsersApiImport/types'

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users API', config.apis.manageUsersApi, logger)
  }

  getUserByUsername(username: string, user: Express.User): Promise<UserDetails> {
    return this.get({ path: `/users/${username}` }, asUser(user.token))
  }
}
