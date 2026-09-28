import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import config from '../../../../../config'
import { PrisonAppointment } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

const view = fs.readFileSync('server/views/pages/appointments/video-link-booking/court/movement-slip.njk')

let $: CheerioAPI

describe('Views - Court booking - Movement Slip with toggle on/off', () => {
  let compiledTemplate: Template
  const viewContext = {
    user: {
      activeCaseLoad: {
        description: 'Moorland (HMP & YOI)',
      },
    },
    preAppointment: {} as PrisonAppointment,
    mainAppointment: {} as PrisonAppointment,
    postAppointment: {} as PrisonAppointment,
    prisoner: {
      prisonerNumber: 'A1234BC',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      prisonId: 'MDI',
      cellLocation: '1-2-3',
    } as Prisoner,
  }

  beforeEach(() => {
    viewContext.preAppointment = {
      prisonAppointmentId: 1,
      prisonCode: 'MDI',
      prisonerNumber: 'A1234BC',
      appointmentType: 'VLB_COURT_PRE',
      appointmentDate: '2023-10-01',
      startTime: '10:00',
      endTime: '10:30',
      dpsLocationId: 'LOCATION_ID_1',
      prisonLocKey: '',
      timeSlot: 'AM',
      locationDescription: 'Room 1',
    } as PrisonAppointment

    viewContext.mainAppointment = {
      prisonAppointmentId: 2,
      prisonCode: 'MDI',
      prisonerNumber: 'A1234BC',
      appointmentType: 'VLB_COURT_MAIN',
      appointmentDate: '2023-10-01',
      startTime: '10:30',
      endTime: '11:00',
      dpsLocationId: 'LOCATION_ID_2',
      prisonLocKey: '',
      timeSlot: 'AM',
      locationDescription: 'Room 2',
      hearingTypeDescription: 'Civil',
      notesForStaff: 'notes for staff',
      notesForPrisoners: 'notes for prisoner',
    } as PrisonAppointment

    viewContext.postAppointment = {
      prisonAppointmentId: 3,
      prisonCode: 'MDI',
      prisonerNumber: 'A1234BC',
      appointmentType: 'VLB_COURT_POST',
      appointmentDate: '2023-10-01',
      startTime: '11:00',
      endTime: '11:30',
      dpsLocationId: 'LOCATION_ID_3',
      prisonLocKey: '',
      timeSlot: 'AM',
      locationDescription: 'Room 3',
    } as PrisonAppointment
  })

  it.each([{ enabled: true }, { enabled: false }])(
    'should display individual pre, main and post court hearing details',
    async ({ enabled }) => {
      setupNunjucks(enabled)

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=date]').text().trim()).toEqual('Sunday, 1 October 2023')
      expect($('[data-qa=movement-slip-heading]').text().trim()).toEqual('Movement authorisation slip')
      expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('John Doe, A1234BC')
      expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
      expect($('[data-qa=pre-court-hearing]').text().trim()).toEqual('10:00 to 10:30Room 1')
      expect($('[data-qa=court-hearing---civil]').text().trim()).toEqual(`10:30 to 11:00Room 2`)
      expect($('[data-qa=post-court-hearing]').text().trim()).toEqual('11:00 to 11:30Room 3')
      checkNotesVisibility(enabled)
    },
  )

  it.each([{ enabled: true }, { enabled: false }])(
    'should display individual pre and main court hearing details only',
    async ({ enabled }) => {
      setupNunjucks(enabled)

      viewContext.postAppointment = undefined

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=date]').text().trim()).toEqual('Sunday, 1 October 2023')
      expect($('[data-qa=movement-slip-heading]').text().trim()).toEqual('Movement authorisation slip')
      expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('John Doe, A1234BC')
      expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
      expect($('[data-qa=pre-court-hearing]').text().trim()).toEqual('10:00 to 10:30Room 1')
      expect($('[data-qa=court-hearing---civil]').text().trim()).toEqual(`10:30 to 11:00Room 2`)
      expect($('[data-qa=post-court-hearing]')).toHaveLength(0)
      checkNotesVisibility(enabled)
    },
  )

  it.each([{ enabled: true }, { enabled: false }])(
    'should display individual main and post court hearing details only',
    async ({ enabled }) => {
      setupNunjucks(enabled)

      viewContext.preAppointment = undefined

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('[data-qa=date]').text().trim()).toEqual('Sunday, 1 October 2023')
      expect($('[data-qa=movement-slip-heading]').text().trim()).toEqual('Movement authorisation slip')
      expect($('[data-qa=prisoner-name-and-number]').text().trim()).toEqual('John Doe, A1234BC')
      expect($('[data-qa=cell-location]').text().trim()).toEqual('MDI-1-2-3')
      expect($('[data-qa=pre-court-hearing]')).toHaveLength(0)
      expect($('[data-qa=court-hearing---civil]').text().trim()).toEqual(`10:30 to 11:00Room 2`)
      expect($('[data-qa=post-court-hearing]').text().trim()).toEqual('11:00 to 11:30Room 3')
      checkNotesVisibility(enabled)
    },
  )

  function setupNunjucks(enabled: boolean) {
    config.prisonerExtraInformationEnabled = enabled
    const njkEnv = registerNunjucks()
    compiledTemplate = compile(view.toString(), njkEnv)
  }

  const checkNotesVisibility = (enabled: boolean) => {
    expect($('[data-qa=notes]').text().trim()).toEqual(enabled ? 'notes for prisoner' : 'notes for staff')
  }
})
