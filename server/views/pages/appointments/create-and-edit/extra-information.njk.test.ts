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
    },
    editAppointmentJourney: {} as unknown as EditAppointmentJourney,
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

  it('create content - VLPA (Video Link - Parole Hearing)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLPA',
      description: 'Video Link - Parole Hearing',
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

  it('create content - VLAP (Video Link - Another Prison)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLAP',
      description: 'Video Link - Another Prison',
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

  it('create content - VLLA (Video Link - Legal Appointment)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLLA',
      description: 'Video Link - Legal Appointment',
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

  it('create content - VLOO (Video Link - Official Other)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
    viewContext.session.appointmentJourney.category = {
      code: 'VLOO',
      description: 'Video Link - Official Other',
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

  it('edit content - VLPA (Video Link - Parole Hearing)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code: 'VLPA',
      description: 'Video Link - Parole Hearing',
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

  it('edit content - VLAP (Video Link - Another Prison)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code: 'VLAP',
      description: 'Video Link - Another Prison',
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

  it('edit content - VLLA (Video Link - Legal Appointment)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code: 'VLLA',
      description: 'Video Link - Legal Appointment',
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

  it('edit content - VLOO (Video Link - Official Other)', () => {
    viewContext.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

    viewContext.session.appointmentJourney.category = {
      code: 'VLOO',
      description: 'Video Link - Official Other',
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
