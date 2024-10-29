import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import UnlockListService from './unlockListService'
import MetricsService from './metricsService'
import CaseNotesService from './caseNotesService'
import AlertsFilterService from './alertsFilterService'
import BookAVideoLinkService from './bookAVideoLinkService'
import NonAssociationsService from './nonAssociationsService'

export default function services() {
  const {
    manageUsersApiClient,
    prisonApiClient,
    prisonRegisterApiClient,
    prisonerSearchApiClient,
    incentivesApiClient,
    activitiesApiClient,
    bookAVideoLinkApiClient,
    applicationInsightsClient,
    caseNotesApiClient,
    nonAssociationsApiClient,
  } = dataAccess()

  const alertsFilterService = new AlertsFilterService()

  return {
    userService: new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient),
    activitiesService: new ActivitiesService(activitiesApiClient),
    bookAVideoLinkService: new BookAVideoLinkService(bookAVideoLinkApiClient),
    caseNotesService: new CaseNotesService(caseNotesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    alertsFilterService,
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient, alertsFilterService),
    metricsService: new MetricsService(applicationInsightsClient),
    nonAssociationsService: new NonAssociationsService(nonAssociationsApiClient),
  }
}

export type Services = ReturnType<typeof services>
