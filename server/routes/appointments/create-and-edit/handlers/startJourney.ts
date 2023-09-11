import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { formatDate, parseDate } from '../../../../utils/utils'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { YesNo } from '../../../../@types/activities'
import { AppointmentRepeatPeriod, AppointmentApplyTo } from '../../../../@types/appointments'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import PrisonService from '../../../../services/prisonService'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  INDIVIDUAL = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.INDIVIDUAL,
      createJourneyComplete: false,
    }
    return res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.GROUP,
      createJourneyComplete: false,
      prisoners: [],
    }
    res.redirect('how-to-add-prisoners')
  }

  BULK = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.BULK,
      createJourneyComplete: false,
    }
    req.session.bulkAppointmentJourney = {
      appointments: [],
    }
    res.redirect('upload-bulk-appointment')
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
    const { property } = req.params

    if (!property) return res.redirect('back')

    this.populateEditSession(req)

    return res.redirect(`../${property}`)
  }

  REMOVE_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { prisonNumber } = req.params

    const prisoner = appointment.prisoners.filter(_ => _.prisonerNumber === prisonNumber)[0]

    if (!prisoner) return res.redirect('back')

    this.populateEditSession(req)

    req.session.editAppointmentJourney.removePrisoner = prisoner

    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect('../remove/apply-to')
    }

    req.session.editAppointmentJourney.applyTo = AppointmentApplyTo.THIS_APPOINTMENT

    return res.redirect('../remove/confirm')
  }

  ADD_PRISONERS = async (req: Request, res: Response): Promise<void> => {
    this.populateEditSession(req)
    req.session.editAppointmentJourney.addPrisoners = []

    return res.redirect('../../prisoners/add/how-to-add-prisoners')
  }

  CANCEL = async (req: Request, res: Response): Promise<void> => {
    this.populateEditSession(req)

    return res.redirect('../cancel/reason')
  }

  private populateEditSession(req: Request) {
    const { appointmentSeries, appointment } = req

    const startDate = parseDate(appointment.startDate)
    const startTime = parseDate(`${appointment.startDate}T${appointment.startTime}`, "yyyy-MM-dd'T'HH:mm")
    const endTime = parseDate(`${appointment.startDate}T${appointment.endTime}`, "yyyy-MM-dd'T'HH:mm")

    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.EDIT,
      type: AppointmentType[appointment.appointmentType],
      appointmentName: appointmentSeries.appointmentName,
      prisoners: appointment.prisoners.map(p => ({
        number: p.prisonerNumber,
        name: p.lastName !== 'UNKNOWN' ? `${p.firstName} ${p.lastName}` : null,
        cellLocation: p.cellLocation,
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
      repeat: appointment.repeat ? YesNo.YES : YesNo.NO,
      repeatPeriod: appointment.repeat?.period as AppointmentRepeatPeriod,
      repeatCount: appointment.repeat?.count,
      comment: appointment.comment,
    }

    if (isValid(endTime)) {
      req.session.appointmentJourney.endTime = {
        date: endTime,
        hour: +formatDate(endTime, 'HH'),
        minute: +formatDate(endTime, 'mm'),
      }
    }

    req.session.editAppointmentJourney = {
      repeatCount: appointment.repeat?.count ?? 1,
      occurrences: appointmentSeries.occurrences.map(occurrence => ({
        sequenceNumber: occurrence.sequenceNumber,
        startDate: occurrence.startDate,
      })),
      sequenceNumber: appointment.sequenceNumber,
      bulkAppointment: appointment.bulkAppointment,
    }
  }
}
