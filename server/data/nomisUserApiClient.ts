import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { UserRoleDetail } from '../@types/nomisUserApiImport/types'

export default class NomisUserApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Nomis user roles API', config.apis.nomisUserApi as ApiConfig)
  }

  async getUserRoles(user: ServiceUser): Promise<UserRoleDetail> {
    return this.get(
      {
        path: `/users/${user.username}/roles`,
        query: { 'include-nomis-roles': 'true' },
      },
      user,
    )
  }
}
