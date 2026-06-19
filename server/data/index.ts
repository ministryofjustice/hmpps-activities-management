import { AuthenticationClient, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import applicationInfoSupplier from '../applicationInfo'
import ManageUsersApiClient from './manageUsersApiClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import ActivitiesApiClient from './activitiesApiClient'
import IncentivesApiClient from './incentivesApiClient'
import CaseNotesApiClient from './caseNotesApiClient'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import AlertsApiClient from './alertsApiClient'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import NomisMappingClient from './nomisMappingClient'
import BankHolidaysClient from './bankHolidaysClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import config from '../config'
import logger from '../../logger'

const applicationInfo = applicationInfoSupplier()

const tokenStore = new TokenStore(createRedisClient())

export default function dataAccess() {
  const hmppsAuthClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    new RedisTokenStore(createRedisClient()),
  )

  return {
    applicationInfo,
    manageUsersApiClient: new ManageUsersApiClient(),
    caseNotesApiClient: new CaseNotesApiClient(),
    prisonApiClient: new PrisonApiClient(hmppsAuthClient),
    prisonerSearchApiClient: new PrisonerSearchApiClient(),
    incentivesApiClient: new IncentivesApiClient(),
    activitiesApiClient: new ActivitiesApiClient(hmppsAuthClient),
    bookAVideoLinkApiClient: new BookAVideoLinkApiClient(hmppsAuthClient),
    nonAssociationsApiClient: new NonAssociationsApiClient(),
    alertsApiClient: new AlertsApiClient(hmppsAuthClient),
    locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(),
    nomisMappingClient: new NomisMappingClient(),
    bankHolidaysClient: new BankHolidaysClient(),
    tokenStore,
  }
}

export type DataAccess = ReturnType<typeof dataAccess>
