import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import CapacitiesService from './capacitiesService'
import UnlockListService from './unlockListService'

export default function services() {
  const {
    hmppsAuthClient,
    nomisUserApiClient,
    prisonApiClient,
    prisonerSearchApiClient,
    whereaboutsApiClient,
    incentivesApiClient,
    activitiesApiClient,
  } = dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, nomisUserApiClient, prisonApiClient),
    prisonService: new PrisonService(
      prisonApiClient,
      prisonerSearchApiClient,
      whereaboutsApiClient,
      incentivesApiClient,
    ),
    activitiesService: new ActivitiesService(activitiesApiClient, prisonerSearchApiClient),
    capacitiesService: new CapacitiesService(activitiesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    unlockListService: new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient),
  }
}

export type Services = ReturnType<typeof services>
