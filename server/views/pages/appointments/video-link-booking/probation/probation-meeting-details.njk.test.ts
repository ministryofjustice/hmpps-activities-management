import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync(
  'server/views/pages/appointments/video-link-booking/probation/probation-meeting-details.njk',
)

describe('Video link booking - Probation - Meeting details page', () => {
  let compiledTemplate: Template

  const meetingTypes = [
    { code: 'PSR', description: 'Pre-sentence report' },
    { code: 'RR', description: 'Recall report' },
    { code: 'OTHER', description: 'Other' },
  ]

  const renderView = (types = meetingTypes, formResponses = {}) => {
    const context = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
      },
      probationTeams: [{ code: 'TEAM_1', description: 'Barking' }],
      meetingTypes: types,
      formResponses,
      session: {
        req: { routeContext: { mode: 'create' } },
        bookAProbationMeetingJourney: {
          probationTeamRequired: false,
          probationOfficerDetailsKnown: false,
          officer: {},
        },
      },
    }

    return cheerio.load(compiledTemplate.render(context))
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), registerNunjucks())
  })

  it('renders three meeting types as radios', () => {
    const $ = renderView()

    expect($('input[name="meetingTypeCode"][type="radio"]')).toHaveLength(3)
    expect($('select[name="meetingTypeCode"]')).toHaveLength(0)
  })

  it('renders four or more meeting types as a select and retains the selected value', () => {
    const $ = renderView([...meetingTypes, { code: 'INITIAL', description: 'Initial appointment' }], {
      meetingTypeCode: 'OTHER',
    })

    expect($('input[name="meetingTypeCode"][type="radio"]')).toHaveLength(0)
    expect($('select[name="meetingTypeCode"]')).toHaveLength(1)
    expect($('select[name="meetingTypeCode"] option:selected').attr('value')).toEqual('OTHER')
  })
})
