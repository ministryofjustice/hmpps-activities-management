/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'

initialiseAppInsights()
const appInsightsClient = buildAppInsightsClient()

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

export default function dataAccess() {
  return {
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
  }
}

export type DataAccess = ReturnType<typeof dataAccess>
