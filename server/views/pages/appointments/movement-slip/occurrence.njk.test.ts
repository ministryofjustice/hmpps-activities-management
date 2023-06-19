import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/movement-slip/occurrence.njk')

describe('Views - Appointments Management - Occurrence Movement Slip', () => {
  let compiledTemplate: Template
  const viewContext = {
    user: {
      activeCaseLoad: {
        description: 'Moorland (HMP & YOI)',
      },
    },
    appointmentOccurrence: {} as AppointmentOccurrenceDetails,
    now: new Date(),
  }
  const tomorrow = addDays(new Date(), 1)

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    viewContext.appointmentOccurrence = {
      id: 10,
      appointmentId: 5,
      appointmentType: AppointmentType.INDIVIDUAL,
      sequenceNumber: 2,
      prisonCode: 'MDI',
      prisoners: [
        {
          firstName: 'TEST',
          lastName: 'PRISONER',
          prisonerNumber: 'A1234BC',
          prisonCode: 'MDI',
          cellLocation: '1-2-3',
        },
      ],
      category: {
        code: 'MEOT',
        description: 'Medical - Other',
      },
      internalLocation: {
        id: 26963,
        prisonCode: 'MDI',
        description: 'HB1 Doctors',
      },
      inCell: false,
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      startTime: '13:00',
      endTime: '13:15',
      comment: 'Appointment occurrence level comment',
      isEdited: false,
      isCancelled: false,
      created: '2023-02-17T10:22:04',
      createdBy: {
        firstName: 'John',
        lastName: 'Smith',
      },
      updated: null,
      updatedBy: null,
    } as AppointmentOccurrenceDetails

    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('should display individual occurrence details', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.movement-slip-header').text().trim()).toEqual('Moorland (HMP & YOI) Movement authorisation slip')
    expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('Test Prisoner, A1234BC')
    expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
    expect($('[data-qa=appointment]').text().trim()).toEqual('Medical - Other')
    expect($('[data-qa=time]').text().trim()).toEqual(`13:00 to 13:15${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`)
    expect($('[data-qa=location]').text().trim()).toEqual('HB1 Doctors')
    expect($('[data-qa=extra-information]').text().trim()).toEqual('Appointment occurrence level comment')
  })

  it('should display appointment description', () => {
    viewContext.appointmentOccurrence.appointmentDescription = 'Choir'

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=appointment]').text().trim()).toEqual('Medical - OtherChoir')
  })

  it('should not display comment when there are no comments', () => {
    viewContext.appointmentOccurrence.comment = ''

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=comment]').length).toBe(0)
  })
})
