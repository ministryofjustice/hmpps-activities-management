import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { formatDate, parseDate } from '../../../../utils/utils'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { YesNo } from '../../../../@types/activities'
import { AppointmentFrequency, AppointmentApplyTo } from '../../../../@types/appointments'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import PrisonService from '../../../../services/prisonService'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly metricsService: MetricsService) {}

  INDIVIDUAL = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.INDIVIDUAL,
      createJourneyComplete: false,
    }

    this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_JOURNEY_STARTED('startLink', req, res.locals.user))

    return res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.GROUP,
      createJourneyComplete: false,
      prisoners: [],
    }

    this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_JOURNEY_STARTED('startLink', req, res.locals.user))

    res.redirect('how-to-add-prisoners')
  }

  SET = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.SET,
      createJourneyComplete: false,
    }
    req.session.appointmentSetJourney = {
      appointments: [],
    }

    this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_SET_JOURNEY_STARTED(req, res.locals.user))

    res.redirect('upload-appointment-set')
  }

  PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params
    const { user } = res.locals

    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.GROUP,
      createJourneyComplete: false,
      prisoners: [],
    }

    this.metricsService.trackEvent(MetricsEvent.CREATE_APPOINTMENT_JOURNEY_STARTED('prisonerProfile', req, user))

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonNumber, user).catch(_ => null)
    if (!prisoner) return res.redirect(`select-prisoner?query=${prisonNumber}`)

    req.session.appointmentJourney.prisoners = [
      {
        number: prisoner.prisonerNumber,
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        cellLocation: prisoner.cellLocation,
      },
    ]
    req.session.appointmentJourney.fromPrisonNumberProfile = prisonNumber

    return res.redirect('../review-prisoners')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { property } = req.params

    if (!property) return res.redirect('back')

    this.populateEditSession(req, property)

    this.metricsService.trackEvent(MetricsEvent.EDIT_APPOINTMENT_JOURNEY_STARTED(appointment, req, res.locals.user))

    return res.redirect(`../${property}`)
  }

  REMOVE_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { prisonNumber } = req.params

    const attendee = appointment.attendees.filter(a => a.prisoner.prisonerNumber === prisonNumber)[0]

    if (!attendee?.prisoner) return res.redirect('back')

    this.populateEditSession(req, 'remove-prisoner')

    req.session.editAppointmentJourney.removePrisoner = attendee.prisoner

    this.metricsService.trackEvent(MetricsEvent.EDIT_APPOINTMENT_JOURNEY_STARTED(appointment, req, res.locals.user))

    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect('../remove/apply-to')
    }

    req.session.editAppointmentJourney.applyTo = AppointmentApplyTo.THIS_APPOINTMENT

    return res.redirect('../remove/confirm')
  }

  ADD_PRISONERS = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    this.populateEditSession(req, 'add-prisoners')
    req.session.editAppointmentJourney.addPrisoners = []

    this.metricsService.trackEvent(MetricsEvent.EDIT_APPOINTMENT_JOURNEY_STARTED(appointment, req, res.locals.user))

    return res.redirect('../../prisoners/add/how-to-add-prisoners')
  }

  CANCEL = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    this.populateEditSession(req)

    this.metricsService.trackEvent(MetricsEvent.CANCEL_APPOINTMENT_JOURNEY_STARTED(appointment, req, res.locals.user))

    return res.redirect('../cancel/reason')
  }

  private populateEditSession(req: Request, property?: string) {
    const { appointmentSeries, appointment } = req

    const startDate = parseDate(appointment.startDate)
    const startTime = parseDate(`${appointment.startDate}T${appointment.startTime}`, "yyyy-MM-dd'T'HH:mm")
    const endTime = parseDate(`${appointment.startDate}T${appointment.endTime}`, "yyyy-MM-dd'T'HH:mm")

    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.EDIT,
      type: AppointmentType[appointment.appointmentType],
      appointmentName: appointment.appointmentName,
      prisoners: appointment.attendees.map(attendee => ({
        number: attendee.prisoner.prisonerNumber,
        name:
          attendee.prisoner.lastName !== 'UNKNOWN'
            ? `${attendee.prisoner.firstName} ${attendee.prisoner.lastName}`
            : null,
        cellLocation: attendee.prisoner.cellLocation,
      })),
      category: appointment.category,
      location: appointment.internalLocation,
      startDate: {
        date: startDate,
        day: +formatDate(startDate, 'dd'),
        month: +formatDate(startDate, 'MM'),
        year: +formatDate(startDate, 'yyyy'),
      },
      startTime: {
        date: startTime,
        hour: +formatDate(startTime, 'HH'),
        minute: +formatDate(startTime, 'mm'),
      },
      endTime: null,
      repeat: appointment.appointmentSeries?.schedule ? YesNo.YES : YesNo.NO,
      frequency: appointment.appointmentSeries?.schedule?.frequency as AppointmentFrequency,
      numberOfAppointments: appointment.appointmentSeries?.schedule?.numberOfAppointments,
      extraInformation: appointment.extraInformation,
    }

    if (isValid(endTime)) {
      req.session.appointmentJourney.endTime = {
        date: endTime,
        hour: +formatDate(endTime, 'HH'),
        minute: +formatDate(endTime, 'mm'),
      }
    }

    req.session.editAppointmentJourney = {
      numberOfAppointments: appointment.appointmentSeries?.schedule?.numberOfAppointments ?? 1,
      appointments: appointmentSeries?.appointments.map(a => ({
        sequenceNumber: a.sequenceNumber,
        startDate: a.startDate,
      })) ?? [
        {
          sequenceNumber: appointment.sequenceNumber,
          startDate: appointment.startDate,
        },
      ],
      sequenceNumber: appointment.sequenceNumber,
      appointmentSeries: appointment.appointmentSeries,
      appointmentSet: appointment.appointmentSet,
      property,
    }
  }
}
