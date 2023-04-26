import $ from 'jquery'
import { initAll as GovUkInitAll } from 'govuk-frontend'
import { initAll as ActivitiesFrontendInitAll } from './all'
import { initAll as MoJFrontendInitAll } from '@ministryofjustice/frontend'

// JQuery required by MoJ frontend.
// https://design-patterns.service.justice.gov.uk/get-started/setting-up-javascript/
window.$ = $

GovUkInitAll()
MoJFrontendInitAll()
ActivitiesFrontendInitAll()
