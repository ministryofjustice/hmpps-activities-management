import $ from 'jquery'
import * as GOVUKFrontend from 'govuk-frontend'
import * as MOJFrontend from '@ministryofjustice/frontend'
import * as ActivitiesFrontend from './all'
import './components/table-sort-fixed-rows/fixed-rows'

// JQuery required by MoJ frontend.
// https://design-patterns.service.justice.gov.uk/get-started/setting-up-javascript/
window.$ = $

// Make GOVUKFrontend And MOJFrontend globally accessible
window.GOVUKFrontend = GOVUKFrontend
window.MOJFrontend = MOJFrontend

GOVUKFrontend.initAll()
MOJFrontend.initAll()
ActivitiesFrontend.initAll()

export default {
  ...ActivitiesFrontend,
}
