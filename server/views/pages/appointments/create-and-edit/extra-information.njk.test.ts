import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays, format } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../../../routes/appointments/create-and-edit/editAppointmentJourney'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/extra-information.njk')

describe('Views - Appointments Management - Extra Information', () => {
  const weekTomorrow = addDays(new Date(), 8)
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
      editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    },
    backLinkHref: '',
    isCtaAcceptAndSave: false,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
          startDate: formatIsoDate(weekTomorrow),
        },
        editAppointmentJourney: {
          numberOfAppointments: 3,
          appointments: [
            {
              sequenceNumber: 1,
              startDate: format(weekTomorrow, 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 2,
              startDate: format(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 3,
              startDate: format(addDays(weekTomorrow, 2), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
      },
      backLinkHref: 'repeat',
      isCtaAcceptAndSave: false,
    }
  })

  it('create content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add any important information for who’s attending about how to prepare for their appointment. It will be printed on their movement slip.',
    )
  })

  it('create content - VLB (video link court hearing)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLB',
      description: 'Video Link - Court Hearing',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for Video Link - Court Hearing and Video Link - Probation Meeting appointments.',
    )
  })

  it('create content - VLPM (video link probation meeting)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLPM',
      description: 'Video Link - Probation Meeting',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for Video Link - Court Hearing and Video Link - Probation Meeting appointments.',
    )
  })

  it('edit content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add or edit any important information for who’s attending about how to prepare for their appointment. Note that changes will not appear on any movement slips that have already been printed.',
    )
  })

  it('edit content - VLB (video link court hearing)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
    viewContext.session.appointmentJourney.category = {
      code: 'VLB',
      description: 'Video Link - Court Hearing',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for Video Link - Court Hearing and Video Link - Probation Meeting appointments.',
    )
  })

  it('edit content - VLPM (video link probation meeting)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
    viewContext.session.appointmentJourney.category = {
      code: 'VLPM',
      description: 'Video Link - Probation Meeting',
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for Video Link - Court Hearing and Video Link - Probation Meeting appointments.',
    )
  })

  it('call to action is continue when creating', () => {
    viewContext.isCtaAcceptAndSave = false

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('button').text().trim()).toEqual('Continue')
  })

  it('call to action is confirm and save when editing', () => {
    viewContext.isCtaAcceptAndSave = true

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('button').text().trim()).toEqual('Update extra information')
  })
})
