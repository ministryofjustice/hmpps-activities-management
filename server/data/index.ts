/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'

initialiseAppInsights()
buildAppInsightsClient()

import HmppsAuthClient from './hmppsAuthClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import WhereaboutsApiClient from './whereaboutsApiClient'
import ActivitiesApiClient from './activitiesApiClient'
import NomisUserApiClient from './nomisUserApiClient'
import IncentivesApiClient from './incentivesApiClient'

export default function dataAccess() {
  return {
    hmppsAuthClient: new HmppsAuthClient(),
    nomisUserApiClient: new NomisUserApiClient(),
    prisonApiClient: new PrisonApiClient(),
    prisonerSearchApiClient: new PrisonerSearchApiClient(),
    prisonRegisterApiClient: new PrisonRegisterApiClient(),
    whereaboutsApiClient: new WhereaboutsApiClient(),
    incentivesApiClient: new IncentivesApiClient(),
    activitiesApiClient: new ActivitiesApiClient(),
  }
}
