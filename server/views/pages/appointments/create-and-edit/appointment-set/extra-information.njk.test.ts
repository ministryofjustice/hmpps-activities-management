import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import {
  AppointmentType,
  AppointmentJourney,
} from '../../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentSetJourney } from '../../../../../routes/appointments/create-and-edit/appointmentSetJourney'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/appointment-set/extra-information.njk')

const getPrisonerExtraInformationRow = (prisonerNumber: string) =>
  $(`[data-qa="extra-information-table"] tr td[data-qa="prisoner-info-cell"]:contains("${prisonerNumber}")`).parent()

const getPrisonerExtraInformationTableCell = (prisonerNumber: string, cell: string) =>
  getPrisonerExtraInformationRow(prisonerNumber).find(`td[data-qa="${cell}"]`)

describe('Views - Create Appointment Set - Add Extra Information', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown> = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          type: AppointmentType.SET,
        } as AppointmentJourney,
        appointmentSetJourney: {} as AppointmentSetJourney,
      },
    }
  })

  it('should display appointments and existing extra information', () => {
    viewContext.appointments = [
      {
        prisoner: {
          number: 'A1234AA',
          name: 'John Smith',
        },
        extraInformation: 'Appointment extra information',
      },
      {
        prisoner: {
          number: 'Z4321YX',
          name: 'Joe Bloggs',
        },
        extraInformation: '',
      },
      {
        prisoner: {
          number: 'B2222BB',
          name: 'Lee Jacobson',
        },
      },
    ]

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa="extra-information-table"] tr').length).toEqual(4)

    expect(getPrisonerExtraInformationTableCell('A1234AA', 'extra-information-cell').text()).toEqual('Appointment extra information')
    expect(getPrisonerExtraInformationTableCell('A1234AA', 'actions-cell').text()).toEqual('Edit extra information')

    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'extra-information-cell').text()).toEqual('')
    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'actions-cell').text()).toEqual('Add extra information')

    expect(getPrisonerExtraInformationTableCell('B2222BB', 'extra-information-cell').text()).toEqual('')
    expect(getPrisonerExtraInformationTableCell('B2222BB', 'actions-cell').text()).toEqual('Add extra information')
  })
})
