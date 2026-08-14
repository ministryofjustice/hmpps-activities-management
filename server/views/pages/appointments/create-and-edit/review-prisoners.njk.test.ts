import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
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
    },
    editAppointmentJourney: {} as unknown as EditAppointmentJourney,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.INDIVIDUAL,
        } as AppointmentJourney,
      },
      editAppointmentJourney: {} as EditAppointmentJourney,
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

  it('should display prisoner numbers that could not be used', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        prisoners: [
          {
            number: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
          },
        ],
        notFoundPrisoners: ['NOTFOUND1', 'NOTFOUND2'],
        user: {
          activeCaseLoadId: 'TPR',
        },
      }),
    )

    expect($('h2').text()).toContain('Some prison numbers in your CSV file could not be used')
    expect($('.govuk-list--bullet').text()).toContain('NOTFOUND1')
    expect($('.govuk-list--bullet').text()).toContain('NOTFOUND2')
  })

  it('should display a message when no prisoner numbers could be used', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        ...viewContext,
        prisoners: [],
        notFoundPrisoners: ['NOTFOUND1', 'NOTFOUND2'],
        user: {
          activeCaseLoadId: 'TPR',
        },
      }),
    )

    expect($('h2').text()).toContain('No prison numbers in your CSV file could be used')
  })
})
