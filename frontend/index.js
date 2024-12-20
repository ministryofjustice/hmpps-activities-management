import $ from 'jquery'
import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ActivitiesFrontend from './all'
import './components/table-sort-fixed-rows/fixed-rows'
import './application-insights-setup'
import '@ministryofjustice/hmpps-digital-prison-reporting-frontend'

// JQuery required by MoJ frontend.
// https://design-patterns.service.justice.gov.uk/get-started/setting-up-javascript/
window.$ = $

// Make GOVUKFrontend And MOJFrontend globally accessible
window.GOVUKFrontend = govukFrontend
window.MOJFrontend = mojFrontend

govukFrontend.initAll()
mojFrontend.initAll()
ActivitiesFrontend.initAll()

export default {
  ...ActivitiesFrontend,
}
