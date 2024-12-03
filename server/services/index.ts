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
import LocationMappingService from './locationMappingService'

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
    locationsInsidePrisonApiClient,
    nomisMappingClient,
  } = dataAccess()

  const alertsFilterService = new AlertsFilterService()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient)

  return {
    userService: new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient),
    prisonService,
    activitiesService: new ActivitiesService(activitiesApiClient),
    bookAVideoLinkService: new BookAVideoLinkService(bookAVideoLinkApiClient),
    caseNotesService: new CaseNotesService(caseNotesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    alertsFilterService,
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient, alertsFilterService),
    metricsService: new MetricsService(applicationInsightsClient),
    nonAssociationsService: new NonAssociationsService(nonAssociationsApiClient, prisonService),
    locationMappingService: new LocationMappingService(locationsInsidePrisonApiClient, nomisMappingClient),
  }
}

export type Services = ReturnType<typeof services>
