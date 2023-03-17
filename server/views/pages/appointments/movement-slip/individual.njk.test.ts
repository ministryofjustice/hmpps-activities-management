import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails, AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { MovementSlip } from '../../../../@types/appointments'
import { formatDate } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/movement-slip/individual.njk')

describe('Views - Appointments Management - Individual Movement Slip', () => {
  let compiledTemplate: Template
  const viewContext = {
    movementSlip: {} as MovementSlip,
  }
  const tomorrow = addDays(new Date(), 1)

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('should display appointment details', () => {
    viewContext.movementSlip = {
      id: 10,
      category: {
        id: 40,
        code: 'MEOT',
        description: 'Medical - Other',
      },
      prisonCode: 'MDI',
      internalLocation: {
        id: 26963,
        prisonCode: 'MDI',
        description: 'HB1 Doctors',
      },
      inCell: false,
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      startTime: '13:00',
      endTime: '13:15',
      comment: 'Appointment level comment',
      created: '2023-02-17T10:22:04',
      createdBy: {
        firstName: 'John',
        lastName: 'Smith',
      },
      updated: null,
      updatedBy: null,
      occurrences: [{ id: 10 }],
      prisoners: [
        {
          firstName: 'TEST',
          lastName: 'PRISONER',
          prisonerNumber: 'A1234BC',
          prisonCode: 'MDI',
          cellLocation: '1-2-3',
        },
      ],
    } as AppointmentDetails as MovementSlip

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=name]').text().trim()).toEqual('Test Prisoner')
    expect($('[data-qa=prison-number]').text().trim()).toEqual('A1234BC')
    expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
    expect($('[data-qa=date-and-time]').text().trim()).toEqual(
      `${formatDate(tomorrow, 'EEEE d MMMM yyyy')} - 13:00 to 13:15`,
    )
    expect($('[data-qa=moving-to]').text().trim()).toEqual('HB1 Doctors')
    expect($('[data-qa=reason]').text().trim()).toEqual('Medical - Other')
    expect($('[data-qa=comments]').text().trim()).toEqual('Appointment level comment')
    expect($('[data-qa=created-by]').text().trim()).toEqual('J. Smith')
  })

  it('should display occurrence details', () => {
    viewContext.movementSlip = {
      id: 10,
      appointmentId: 5,
      sequenceNumber: 2,
      category: {
        id: 40,
        code: 'MEOT',
        description: 'Medical - Other',
      },
      prisonCode: 'MDI',
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
      prisoners: [
        {
          firstName: 'TEST',
          lastName: 'PRISONER',
          prisonerNumber: 'A1234BC',
          prisonCode: 'MDI',
          cellLocation: '1-2-3',
        },
      ],
    } as AppointmentOccurrenceDetails as MovementSlip

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=name]').text().trim()).toEqual('Test Prisoner')
    expect($('[data-qa=prison-number]').text().trim()).toEqual('A1234BC')
    expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
    expect($('[data-qa=date-and-time]').text().trim()).toEqual(
      `${formatDate(tomorrow, 'EEEE d MMMM yyyy')} - 13:00 to 13:15`,
    )
    expect($('[data-qa=moving-to]').text().trim()).toEqual('HB1 Doctors')
    expect($('[data-qa=reason]').text().trim()).toEqual('Medical - Other')
    expect($('[data-qa=comments]').text().trim()).toEqual('Appointment occurrence level comment')
    expect($('[data-qa=created-by]').text().trim()).toEqual('J. Smith')
  })
})
