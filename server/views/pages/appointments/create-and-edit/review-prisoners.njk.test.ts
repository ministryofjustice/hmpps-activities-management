import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../../../routes/appointments/create-and-edit/editAppointmentJourney'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/review-prisoners.njk')

describe('Views - Appointments Management - Review Prisoners', () => {
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
      editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    },
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.INDIVIDUAL,
        } as AppointmentJourney,
        editAppointmentJourney: {} as EditAppointmentJourney,
      },
    }
  })

  it('should display both select individual, select using csv and continue buttons', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#add-prisoner-individual').text().trim()).toEqual('Add another person individually')
    expect($('#add-prisoner-individual').attr('href')).toEqual('select-prisoner')

    expect($('#add-prisoners-csv').text().trim()).toEqual('Add people using a CSV file')
    expect($('#add-prisoners-csv').attr('href')).toEqual('upload-prisoner-list')

    expect($('#continue-button').text().trim()).toEqual('Continue')
  })
})
