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
import FrontendComponentApiClient from './frontendComponentApiClient'
import CaseNotesApiClient from './caseNotesApiClient'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import NomisMappingClient from './nomisMappingClient'

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
    frontendComponentApiClient: new FrontendComponentApiClient(),
    bookAVideoLinkApiClient: new BookAVideoLinkApiClient(),
    applicationInsightsClient: appInsightsClient,
    nonAssociationsApiClient: new NonAssociationsApiClient(),
    locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(),
    nomisMappingClient: new NomisMappingClient(),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>
