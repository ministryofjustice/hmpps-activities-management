import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ActivitiesFrontend from './all'
import './components/table-sort-fixed-rows/fixed-rows'
import './application-insights-setup'

// Make GOVUKFrontend And MOJFrontend globally accessible
window.GOVUKFrontend = govukFrontend
window.MOJFrontend = mojFrontend

govukFrontend.initAll()
mojFrontend.initAll()
ActivitiesFrontend.initAll()

export default {
  ...ActivitiesFrontend,
}
