import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import UnlockListService from './unlockListService'
import AppInsightsService from './AppInsightsService'

export default function services() {
  const { hmppsAuthClient, prisonApiClient, prisonerSearchApiClient, incentivesApiClient, activitiesApiClient } =
    dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, prisonApiClient, activitiesApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient),
    activitiesService: new ActivitiesService(activitiesApiClient, prisonerSearchApiClient),
    ukBankHolidayService: new BankHolidayService(),
    unlockListService: new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient),
    appInsightsClient: new AppInsightsService(),
  }
}

export type Services = ReturnType<typeof services>
