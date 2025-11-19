import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../utils/utils'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/appointment/movement-slip.njk')

describe('Views - Appointments Management - Appointment Movement Slip', () => {
  let compiledTemplate: Template
  const viewContext = {
    user: {
      activeCaseLoad: {
        description: 'Moorland (HMP & YOI)'
      },
    },
    appointment: {} as AppointmentDetails,
    now: new Date(),
  }
  const tomorrow = addDays(new Date(), 1)

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    viewContext.appointment = {
      id: 10,
      appointmentSeries: { id: 5 },
      appointmentType: AppointmentType.INDIVIDUAL,
      sequenceNumber: 2,
      prisonCode: 'MDI',
      appointmentName: 'Doctors appointment (Medical - Other)',
      attendees: [
        {
          prisoner: {
            firstName: 'TEST',
            lastName: 'PRISONER',
            prisonerNumber: 'A1234BC',
            prisonCode: 'MDI',
            cellLocation: '1-2-3',
          },
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
      extraInformation: 'Appointment level extra information',
      isEdited: false,
      isCancelled: false,
      createdTime: '2023-02-17T10:22:04',
      createdBy: 'JSMITH',
      updatedTime: null,
      updatedBy: null,
    } as AppointmentDetails

    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display individual appointment details when internal location', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.movement-slip-header').text().trim()).toEqual('Moorland (HMP & YOI) Movement authorisation slip')
    expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('Test Prisoner, A1234BC')
    expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
    expect($('[data-qa=appointment]').text().trim()).toEqual('Doctors appointment (Medical - Other)')
    expect($('[data-qa=time]').text().trim()).toEqual(`13:00 to 13:15${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`)
    expect($('[data-qa=location]').text().trim()).toEqual('HB1 Doctors')
    expect($('[data-qa=extra-information]').text().trim()).toEqual('Appointment level extra information')
  })

  it('should display individual appointment details when in cell', () => {
    viewContext.appointment.internalLocation = null
    viewContext.appointment.inCell = true

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.movement-slip-header').text().trim()).toEqual('Moorland (HMP & YOI) Movement authorisation slip')
    expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('Test Prisoner, A1234BC')
    expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
    expect($('[data-qa=appointment]').text().trim()).toEqual('Doctors appointment (Medical - Other)')
    expect($('[data-qa=time]').text().trim()).toEqual(`13:00 to 13:15${formatDate(tomorrow, 'EEEE, d MMMM yyyy')}`)
    expect($('[data-qa=location]').text().trim()).toEqual('In cell')
    expect($('[data-qa=extra-information]').text().trim()).toEqual('Appointment level extra information')
  })

  it('should not display extra information when there is no extra information', () => {
    viewContext.appointment.extraInformation = ''

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').length).toBe(0)
  })

  it('should display extra information for appointment category VLB - Video Link Court Hearing', () => {
    viewContext.appointment.extraInformation = 'This should be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLB', description: 'Video Link - Court Hearing' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('This should be shown on the movement slip')
  })

  it('should display extra information for appointment category VLPM - Video Link Probation Meeting', () => {
    viewContext.appointment.extraInformation = 'This should be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLPM', description: 'Video Link - Probation Meeting' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('This should be shown on the movement slip')
  })

  it('should not display extra information for appointment category VLPA - Video Link Parole Hearing', () => {
    viewContext.appointment.extraInformation = 'This should not be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLPA', description: 'Video Link - Parole Hearing' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('')
  })

  it('should not display extra information for appointment category VLAP - Video Link Another Prison', () => {
    viewContext.appointment.extraInformation = 'This should not be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLAP', description: 'Video Link - Another Prison' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('')
  })

  it('should not display extra information for appointment category VLOO - Video Link Official Other', () => {
    viewContext.appointment.extraInformation = 'This should not be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLOO', description: 'Video Link - Official Other' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('')
  })

  it('should not display extra information for appointment category VLLA - Video Link Legal Appointment', () => {
    viewContext.appointment.extraInformation = 'This should be shown on the movement slip'
    viewContext.appointment.category = { code: 'VLLA', description: 'Video Link - Legal Appointment' }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=extra-information]').text().trim()).toEqual('')
  })
})
