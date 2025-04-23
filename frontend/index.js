import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ActivitiesFrontend from './all'
import * as dprFrontend from '@ministryofjustice/hmpps-digital-prison-reporting-frontend'
import './components/table-sort-fixed-rows/fixed-rows'
import './application-insights-setup'
import '@ministryofjustice/hmpps-digital-prison-reporting-frontend'

// Make GOVUKFrontend And MOJFrontend globally accessible
window.GOVUKFrontend = govukFrontend
window.MOJFrontend = mojFrontend

govukFrontend.initAll()
mojFrontend.initAll()
dprFrontend.default()
ActivitiesFrontend.initAll()

export default {
  ...ActivitiesFrontend,
}
