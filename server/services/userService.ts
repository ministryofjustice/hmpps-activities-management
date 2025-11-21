import _ from 'lodash'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { ServiceUser } from '../@types/express'
import { UserDetails } from '../@types/manageUsersApiImport/types'

export const SERVICE_AS_USERNAME = 'Activities Management Service'

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUserMap(usernames: string[], user: ServiceUser): Promise<Map<string, UserDetails>> {
    const users = await Promise.all(
      _.uniq(usernames)
        .filter(Boolean)
        .map(u => {
          if (u === SERVICE_AS_USERNAME) {
            return { username: SERVICE_AS_USERNAME, name: SERVICE_AS_USERNAME } as UserDetails
          }
          return this.manageUsersApiClient
            .getUserByUsername(u, user)
            .catch(e => {
              if (e.status === 404) return null
              throw e
            })
            .then(r => {
              if (r === null || r.authSource !== 'nomis') {
                return { username: u, name: 'External user' } as UserDetails
              }
              return r
            })
        }),
    )
    return new Map(users.map(u => [u.username, u]))
  }
}
