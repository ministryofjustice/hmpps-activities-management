import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { asString } from '../../../../utils/utils'
import { parseIsoDate } from '../../../../utils/datePickerUtils'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly editAppointmentService: EditAppointmentService,
    private readonly metricsService: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney, appointmentSetJourney, editAppointmentJourney } = req.session
    const { preserveHistory } = req.query

    let prisonNumbers
    if (appointmentJourney.type === AppointmentType.SET) {
      prisonNumbers = appointmentSetJourney.appointments.map(a => a.prisoner.number)
    } else if (editAppointmentJourney?.addPrisoners) {
      prisonNumbers = editAppointmentJourney.addPrisoners.map(p => p.number)
    } else {
      prisonNumbers = appointmentJourney.prisoners.map(p => p.number)
    }

    const appointmentStartDate = editAppointmentJourney?.startDate ?? appointmentJourney.startDate

    const scheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(parseIsoDate(appointmentStartDate), prisonNumbers, user)
      .then(response => [
        ...response.activities,
        ...response.appointments.filter(e => e.appointmentId !== +appointmentId),
        ...response.courtHearings,
        ...response.visits,
        ...response.externalTransfers,
        ...response.adjudications,
      ])

    let prisonerSchedules
    if (appointmentJourney.type === AppointmentType.SET) {
      prisonerSchedules = appointmentSetJourney.appointments.map(appointment => ({
        prisoner: appointment.prisoner,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === appointment.prisoner.number),
      }))
    } else if (editAppointmentJourney?.addPrisoners) {
      prisonerSchedules = editAppointmentJourney?.addPrisoners.map(p => ({
        prisoner: p,
        scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === p.number),
      }))
    } else {
      prisonerSchedules = appointmentJourney.prisoners.map(prisoner => ({
        prisoner,
        scheduledEvents: scheduledEvents.filter(event => event.prisonerNumber === prisoner.number),
      }))
    }

    res.render('pages/appointments/create-and-edit/schedule', {
      preserveHistory,
      prisonerSchedules,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const nextRoute =
      req.session.appointmentJourney.type === AppointmentType.SET
        ? 'appointment-set-extra-information'
        : 'extra-information'
    if (req.session.appointmentJourney.createJourneyComplete) return res.redirectOrReturn(nextRoute)
    return res.redirect(nextRoute)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    let property = 'date-and-time'
    if (req.session.editAppointmentJourney.addPrisoners) {
      property = 'prisoners/add'
    }

    await this.editAppointmentService.redirectOrEdit(req, res, property)
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { prisonNumber } = req.params

    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      req.session.appointmentSetJourney.appointments = req.session.appointmentSetJourney.appointments.filter(
        appointment => appointment.prisoner.number !== prisonNumber,
      )
    } else if (
      req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
      req.session.editAppointmentJourney?.addPrisoners
    ) {
      req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.filter(
        p => p.number !== prisonNumber,
      )
    } else {
      req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
        prisoner => prisoner.number !== prisonNumber,
      )
    }

    const changeFromSchedule = MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
      appointmentJourney.mode,
      'remove-prisoner',
      user,
    )
    this.metricsService.trackEvent(changeFromSchedule)

    res.redirect(`../../schedule${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  CHANGE = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { property, preserveHistory } = req.query

    const changeFromSchedule = MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
      appointmentJourney.mode,
      asString(property),
      user,
    )
    this.metricsService.trackEvent(changeFromSchedule)

    res.redirect(`../${property}${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
