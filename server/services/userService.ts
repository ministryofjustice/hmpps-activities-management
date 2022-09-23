import { convertToTitleCase } from '../utils/utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'

interface UserDetails {
  name: string
  displayName: string
}

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(user: ServiceUser): Promise<UserDetails> {
    const updatedUser = await this.hmppsAuthClient.getUser(user)
    return { ...updatedUser, displayName: convertToTitleCase(updatedUser.name) }
  }
}
