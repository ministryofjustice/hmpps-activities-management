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

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/date-and-time.njk')

describe('Views - Appointments Management - Date and Time', () => {
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
      backLinkHref: 'name',
      isCtaAcceptAndSave: false,
    }
  })

  it('create content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('When is the appointment?')
  })

  it('edit content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Enter the new date and time')
  })
})
