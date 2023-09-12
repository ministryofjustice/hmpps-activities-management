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
const view = fs.readFileSync(
  'server/views/pages/appointments/create-and-edit/bulk-appointments/bulk-appointment-comments.njk',
)

const getPrisonerCommentRow = (prisonerNumber: string) =>
  $(`[data-qa="comments-table"] tr td[data-qa="prisoner-info-cell"]:contains("${prisonerNumber}")`).parent()

const getPrisonerCommentsTableCell = (prisonerNumber: string, cell: string) =>
  getPrisonerCommentRow(prisonerNumber).find(`td[data-qa="${cell}"]`)

describe('Views - Create Bulk Appointment - Add Comment', () => {
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

  it('should display appointments and existing comments', () => {
    viewContext.appointments = [
      {
        prisoner: {
          number: 'A1234AA',
          name: 'John Smith',
        },
        comment: 'appointment comment',
      },
      {
        prisoner: {
          number: 'Z4321YX',
          name: 'Joe Bloggs',
          comment: '',
        },
      },
      {
        prisoner: {
          number: 'B2222BB',
          name: 'Lee Jacobson',
        },
      },
    ]

    $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa="comments-table"] tr').length).toEqual(4)

    expect(getPrisonerCommentsTableCell('A1234AA', 'comment-cell').text()).toEqual('appointment comment')
    expect(getPrisonerCommentsTableCell('A1234AA', 'actions-cell').text()).toEqual('Edit extra information')

    expect(getPrisonerCommentsTableCell('Z4321YX', 'comment-cell').text()).toEqual('')
    expect(getPrisonerCommentsTableCell('Z4321YX', 'actions-cell').text()).toEqual('Add extra information')

    expect(getPrisonerCommentsTableCell('B2222BB', 'comment-cell').text()).toEqual('')
    expect(getPrisonerCommentsTableCell('B2222BB', 'actions-cell').text()).toEqual('Add extra information')
  })
})
