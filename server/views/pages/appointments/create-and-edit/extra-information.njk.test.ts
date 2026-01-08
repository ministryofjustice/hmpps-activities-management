import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
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
import config from '../../../../config'
import { AppointmentPrisonerDetails } from '../../../../routes/appointments/create-and-edit/appointmentPrisonerDetails'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/extra-information.njk')

// TODO test can be removed when feature toggle is removed
describe('Views - Appointments Management - Extra Information, with toggle off', () => {
  config.prisonerExtraInformationEnabled = false

  const weekTomorrow = addDays(new Date(), 8)
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
    },
    editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    backLinkHref: '',
    isCtaAcceptAndSave: false,
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
          startDate: formatIsoDate(weekTomorrow),
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
      backLinkHref: 'repeat',
      isCtaAcceptAndSave: false,
    }
  })

  it('create content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information to movement slips (optional)')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add any information that will help attendees prepare for their appointment, like something they need to bring, or do beforehand.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner. For example, contact details of someone else at the appointment.',
    )
    expect($('[data-qa=third-paragraph]').text().trim()).toEqual(
      'For confidentiality, the information you enter is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
    )
  })

  it('edit content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information on movement slips (optional)')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'Add or edit information that will help attendees prepare for the appointment, like something they need to bring, or do beforehand.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner. For example, contact details of someone else at the appointment.',
    )
    expect($('[data-qa=third-paragraph]').text().trim()).toEqual(
      'Changes will not appear on movement slips that have already been printed. For confidentiality, the information you enter is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
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

  it.each([
    { code: 'VLPA', description: 'Video Link - Parole Hearing' },
    { code: 'VLAP', description: 'Video Link - Another Prison' },
    { code: 'VLLA', description: 'Video Link - Legal Appointment' },
    { code: 'VLOO', description: 'Video Link - Official Other' },
  ])('create content - $code - $description', ({ code, description }) => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code,
      description,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Add extra information (optional)')
    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for some video link appointments.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'For confidentiality, the information itself is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
    )
  })

  it.each([
    { code: 'VLPA', description: 'Video Link - Parole Hearing' },
    { code: 'VLAP', description: 'Video Link - Another Prison' },
    { code: 'VLLA', description: 'Video Link - Legal Appointment' },
    { code: 'VLOO', description: 'Video Link - Official Other' },
  ])('edit content - $code - $description', ({ code, description }) => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code,
      description,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text()).toContain('Change the extra information (optional)')

    expect($('[data-qa=first-paragraph]').text().trim()).toEqual(
      'This information will not appear on movement slips for some video link appointments.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'For confidentiality, the information itself is not shown on the printed unlock list. The list will say ‘Extra information’. Staff can check appointment details in this service to read it in full.',
    )
  })
})

describe('Views - Appointments Management - Extra Information, with toggle on', () => {
  config.prisonerExtraInformationEnabled = true

  const weekTomorrow = addDays(new Date(), 8)
  let compiledTemplate: Template
  let viewContext = {
    session: {
      appointmentJourney: {} as unknown as AppointmentJourney,
    },
    editAppointmentJourney: {} as unknown as EditAppointmentJourney,
    backLinkHref: '',
    isCtaAcceptAndSave: false,
    prisoners: [] as AppointmentPrisonerDetails[],
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
          startDate: formatIsoDate(weekTomorrow),
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
      backLinkHref: 'repeat',
      isCtaAcceptAndSave: false,
      prisoners: [
        {
          name: 'Fred',
          number: '123456',
          prisonCode: 'MDI',
          status: 'ACTIVE',
          cellLocation: '',
        },
      ] as AppointmentPrisonerDetails[],
    }
  })

  it('create content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toContain(`Add extra information to Fred's appointment (optional)`)

    expect($('[data-qa=first-paragraph]').text().trim()).toContain(
      'Add information the prisoner needs to know about their appointment, like something they need to bring, or do beforehand. This will appear on movement slips and will be seen by the prisoner.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner.',
    )
  })

  it('edit content', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toContain(`Change the extra information`)

    expect($('[data-qa=first-paragraph]').text().trim()).toContain(
      'Add or edit information the prisoner needs to know about their appointment, like something they need to bring, or do beforehand. This will appear on movement slips and will be seen by the prisoner.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner.',
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

  // TODO test can be removed when feature toggle is removed
  it.each([
    { code: 'VLPA', description: 'Video Link - Parole Hearing' },
    { code: 'VLAP', description: 'Video Link - Another Prison' },
    { code: 'VLLA', description: 'Video Link - Legal Appointment' },
    { code: 'VLOO', description: 'Video Link - Official Other' },
  ])('create content - $code - $description', ({ code, description }) => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code,
      description,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toContain(`Add extra information to Fred's appointment (optional)`)

    expect($('[data-qa=first-paragraph]').text().trim()).toContain(
      'Add information the prisoner needs to know about their appointment, like something they need to bring, or do beforehand. This will appear on movement slips and will be seen by the prisoner.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner.',
    )
  })

  // TODO test can be removed when feature toggle is removed
  it.each([
    { code: 'VLPA', description: 'Video Link - Parole Hearing' },
    { code: 'VLAP', description: 'Video Link - Another Prison' },
    { code: 'VLLA', description: 'Video Link - Legal Appointment' },
    { code: 'VLOO', description: 'Video Link - Official Other' },
  ])('edit content - $code - $description', ({ code, description }) => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code,
      description,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toContain(`Change the extra information`)

    expect($('[data-qa=first-paragraph]').text().trim()).toContain(
      'Add or edit information the prisoner needs to know about their appointment, like something they need to bring, or do beforehand. This will appear on movement slips and will be seen by the prisoner. Changes will not appear on movement slips that have already been printed.',
    )
    expect($('[data-qa=second-paragraph]').text().trim()).toEqual(
      'Do not add anything that should not be seen by or shared with a prisoner.',
    )
  })
})
