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

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/extra-information.njk')

describe('Views - Appointments Management - Comment', () => {
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
          startDate: {
            day: weekTomorrow.getDate(),
            month: weekTomorrow.getMonth() + 1,
            year: weekTomorrow.getFullYear(),
            date: weekTomorrow,
          },
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

  it('back link href contains default view context back link href', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('a.govuk-back-link').attr('href')).toEqual('repeat')
  })

  it('back link href contains view context back link href', () => {
    viewContext.backLinkHref = '/appointments/2'

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('a.govuk-back-link').attr('href')).toEqual('/appointments/2')
  })

  it('create content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add any important information about how to prepare for the appointment. It will be printed on the movement slip.',
    )
  })

  it('edit content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'You can change the information about how to prepare for the appointment. Note that changes will not appear on any movement slips that have already been printed.',
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
