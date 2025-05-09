/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const appInsightsClient = buildAppInsightsClient(applicationInfo)

import ManageUsersApiClient from './manageUsersApiClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
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

const tokenStore = new TokenStore(createRedisClient())

export default function dataAccess() {
  return {
    applicationInfo,
    manageUsersApiClient: new ManageUsersApiClient(),
    caseNotesApiClient: new CaseNotesApiClient(),
    prisonApiClient: new PrisonApiClient(),
    prisonerSearchApiClient: new PrisonerSearchApiClient(),
    prisonRegisterApiClient: new PrisonRegisterApiClient(),
    incentivesApiClient: new IncentivesApiClient(),
    activitiesApiClient: new ActivitiesApiClient(),
    bookAVideoLinkApiClient: new BookAVideoLinkApiClient(),
    applicationInsightsClient: appInsightsClient,
    nonAssociationsApiClient: new NonAssociationsApiClient(),
    alertsApiClient: new AlertsApiClient(),
    locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(),
    nomisMappingClient: new NomisMappingClient(),
    bankHolidaysClient: new BankHolidaysClient(),
    tokenStore,
  }
}

export type DataAccess = ReturnType<typeof dataAccess>
