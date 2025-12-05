import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import {
  AppointmentType,
  AppointmentJourney,
} from '../../../../../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentSetJourney } from '../../../../../routes/appointments/create-and-edit/appointmentSetJourney'
import config from '../../../../../config'

let $: CheerioAPI
const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/appointment-set/extra-information.njk')

const getPrisonerExtraInformationRow = (prisonerNumber: string) =>
  $(`[data-qa="extra-information-table"] tr td[data-qa="prisoner-info-cell"]:contains("${prisonerNumber}")`).parent()

const getPrisonerExtraInformationTableCell = (prisonerNumber: string, cell: string) =>
  getPrisonerExtraInformationRow(prisonerNumber).find(`td[data-qa="${cell}"]`)

const getPrisonerExtraInformationTag = (prisonerNumber: string, cell: string) =>
  getPrisonerExtraInformationRow(prisonerNumber).find(`td strong[data-qa="${cell}"]`)

describe('Views - Create Appointment Set - Add Extra Information - feature toggle off', () => {
  config.prisonerExtraInformationEnabled = false

  let compiledTemplate: Template
  let viewContext: Record<string, unknown> = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
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

    expect($('h1').text()).toContain('Add extra information to movement slips (optional)')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add any important information for who’s attending about how to prepare for their appointment, like something they need to bring, or do beforehand.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'For confidentiality, the information you enter is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
    )

    expect($('[data-qa="extra-information-table"] tr').length).toEqual(4)

    expect(getPrisonerExtraInformationTableCell('A1234AA', 'extra-information-cell').text().trim()).toEqual(
      'Appointment extra information',
    )
    expect(getPrisonerExtraInformationTableCell('A1234AA', 'actions-cell').text()).toEqual('Edit extra information')

    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'extra-information-cell').text().trim()).toEqual('')
    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'actions-cell').text()).toEqual('Add extra information')

    expect(getPrisonerExtraInformationTableCell('B2222BB', 'extra-information-cell').text().trim()).toEqual('')
    expect(getPrisonerExtraInformationTableCell('B2222BB', 'actions-cell').text().trim()).toEqual(
      'Add extra information',
    )
  })
})

describe('Views - Create Appointment Set - Add Extra Information - feature toggle on', () => {
  config.prisonerExtraInformationEnabled = true

  let compiledTemplate: Template
  let viewContext: Record<string, unknown> = {}

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
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
        extraInformation: 'Extra information',
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
        prisonerExtraInformation: 'Prisoner extra information',
      },
    ]

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information to movement slips (optional)')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add details about who will be attending, or other relevant appointment information which will not be shared with the attendees. Or add information the attendees need to know about their appointment, like something then need to bring or do beforehand.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'For confidentiality, the information you enter is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
    )

    expect($('[data-qa="extra-information-table"] tr').length).toEqual(4)

    expect(getPrisonerExtraInformationTag('A1234AA', 'extra-information-tag').text().trim()).toEqual(
      'Extra information',
    )
    expect(getPrisonerExtraInformationTableCell('A1234AA', 'actions-cell').text()).toEqual('Edit extra information')

    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'extra-information-cell').text().trim()).toEqual('')
    expect(getPrisonerExtraInformationTableCell('Z4321YX', 'actions-cell').text().trim()).toEqual(
      'Add extra information',
    )

    expect(getPrisonerExtraInformationTag('B2222BB', 'extra-information-tag').text().trim()).toEqual(
      'Extra information',
    )
    expect(getPrisonerExtraInformationTableCell('B2222BB', 'actions-cell').text().trim()).toEqual(
      'Edit extra information',
    )
  })
})
