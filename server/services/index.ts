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
import AlertsService from './alertsService'
import LocationsService from './locationsService'
import CourtBookingService from './courtBookingService'
import ProbationBookingService from './probationBookingService'

export default function services() {
  const {
    applicationInfo,
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
    alertsApiClient,
    locationsInsidePrisonApiClient,
    nomisMappingClient,
  } = dataAccess()

  const alertsFilterService = new AlertsFilterService()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient)
  const alertsService = new AlertsService(alertsApiClient)

  return {
    applicationInfo,
    userService: new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient),
    prisonService,
    activitiesService: new ActivitiesService(activitiesApiClient),
    bookAVideoLinkService: new BookAVideoLinkService(bookAVideoLinkApiClient),
    courtBookingService: new CourtBookingService(bookAVideoLinkApiClient),
    probationBookingService: new ProbationBookingService(bookAVideoLinkApiClient),
    caseNotesService: new CaseNotesService(caseNotesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    alertsFilterService,
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient, alertsFilterService),
    metricsService: new MetricsService(applicationInsightsClient),
    nonAssociationsService: new NonAssociationsService(nonAssociationsApiClient, prisonService),
    alertsService,
    locationMappingService: new LocationMappingService(locationsInsidePrisonApiClient, nomisMappingClient),
    locationsService: new LocationsService(locationsInsidePrisonApiClient),
  }
}

export type Services = ReturnType<typeof services>
