import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import UnlockListService from './unlockListService'
import MetricsService from './metricsService'
import CaseNotesService from './caseNotesService'

export default function services() {
  const {
    manageUsersApiClient,
    prisonApiClient,
    prisonRegisterApiClient,
    prisonerSearchApiClient,
    incentivesApiClient,
    activitiesApiClient,
    applicationInsightsClient,
    caseNotesApiClient,
  } = dataAccess()

  return {
    userService: new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient),
    activitiesService: new ActivitiesService(activitiesApiClient),
    caseNotesService: new CaseNotesService(caseNotesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient),
    metricsService: new MetricsService(applicationInsightsClient),
  }
}

export type Services = ReturnType<typeof services>
