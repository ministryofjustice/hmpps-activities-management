import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'

export default function services() {
  const { hmppsAuthClient, prisonRegisterApiClient, prisonApiClient, prisonerSearchApiClient } = dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, prisonApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, prisonRegisterApiClient),
  }
}

export type Services = ReturnType<typeof services>
