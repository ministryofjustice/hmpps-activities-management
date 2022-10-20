import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'

export default function services() {
  const {
    hmppsAuthClient,
    prisonRegisterApiClient,
    prisonApiClient,
    prisonerSearchApiClient,
    whereaboutsApiClient,
    activitiesApiClient,
  } = dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, prisonApiClient),
    prisonService: new PrisonService(
      prisonApiClient,
      prisonerSearchApiClient,
      prisonRegisterApiClient,
      whereaboutsApiClient,
    ),
    activitiesService: new ActivitiesService(activitiesApiClient, prisonerSearchApiClient),
    ukBankHolidayService: new BankHolidayService(),
  }
}

export type Services = ReturnType<typeof services>
