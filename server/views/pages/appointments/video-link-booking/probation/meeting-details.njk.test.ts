import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { ReferenceCode } from '../../../../../@types/prisonApiImport/types'

const view = fs.readFileSync('server/views/pages/appointments/video-link-booking/probation/meeting-details.njk')

describe('Video link booking - Probation - meeting details page', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  const viewContext = {
    vlb: {
      videoLinkBookingId: 1,
      statusCode: 'ACTIVE',
      bookingType: 'PROBATION',
      probationTeamCode: 'Team1',
      probationMeetingType: 'OTHER',
      prisonAppointments: [
        {
          prisonAppointmentId: 2,
          prisonCode: 'PRISON1',
          prisonerNumber: 'A1234BC',
          appointmentType: 'VLB_PROBATION',
          appointmentDate: '2025-04-22',
          startTime: '10:30',
          endTime: '11:00',
        },
      ],
      createdBy: 'user1',
      amendedBy: 'user2',
      createdAt: '2025-04-22T10:00:00Z',
    } as VideoLinkBooking,
    prisoner: {
      prisonerNumber: 'A1234BC',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      prisonId: 'PRISON1',
    } as Prisoner,
  }

  it('should render RADIO when less than 4 probation meeting types', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        meetingTypes: [
          { code: 'PSR', description: '1' },
          { code: 'RR', description: '2' },
          { code: 'OTHER', description: '3' },
        ] as ReferenceCode[],
      }),
    )

    const meetingTypeCodes = $(`[name=meetingTypeCode]`)
      .map((_, option) => $(option).attr('value'))
      .get()
      .filter(s => s.length > 1)

    expect(meetingTypeCodes.length).toBe(3)
  })

  it('should render SELECT when more than 3 probation meeting types', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        meetingTypes: [
          { code: 'PSR', description: '1' },
          { code: 'RR', description: '2' },
          { code: 'OTHER', description: '3' },
          { code: 'UNKNOWN', description: '4' },
        ] as ReferenceCode[],
      }),
    )

    const meetingTypeCodes = $(`[name=meetingTypeCode]`)
      .find('option')
      .map((_, option) => $(option).attr('value'))
      .get()
      .filter(s => s.length > 1)

    expect(meetingTypeCodes.length).toBe(4)
  })
})
