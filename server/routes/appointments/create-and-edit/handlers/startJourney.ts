import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { formatDate, parseDate } from '../../../../utils/utils'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { YesNo } from '../../../../@types/activities'
import { AppointmentRepeatPeriod, EditApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'

export default class StartJourneyRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  INDIVIDUAL = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.INDIVIDUAL,
    }
    res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.GROUP,
      prisoners: [],
    }
    res.redirect('how-to-add-prisoners')
  }

  BULK = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.BULK,
    }
    req.session.bulkAppointmentJourney = {
      appointments: [],
    }
    res.redirect('upload-by-csv')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req
    const { property } = req.params

    if (!property) return res.redirect('back')

    this.populateEditSession(req)

    return res.redirect(
      `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/${property}`,
    )
  }

  REMOVE_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req
    const { prisonNumber } = req.params

    const prisoner = appointmentOccurrence.prisoners.filter(_ => _.prisonerNumber === prisonNumber)[0]

    if (!prisoner) return res.redirect('back')

    this.populateEditSession(req)

    req.session.editAppointmentJourney.removePrisoner = prisoner

    if (this.editAppointmentService.isApplyToQuestionRequired(req)) {
      return res.redirect(
        `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/${prisonNumber}/remove/apply-to`,
      )
    }

    req.session.editAppointmentJourney.applyTo = EditApplyTo.THIS_OCCURRENCE

    return res.redirect(
      `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/${prisonNumber}/remove/confirm`,
    )
  }

  ADD_PRISONERS = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    this.populateEditSession(req)
    req.session.editAppointmentJourney.addPrisoners = []

    return res.redirect(
      `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/prisoners/add/how-to-add-prisoners`,
    )
  }

  CANCEL = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    this.populateEditSession(req)

    return res.redirect(
      `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/cancel/reason`,
    )
  }

  private populateEditSession(req: Request) {
    const { appointment, appointmentOccurrence } = req

    const startDate = parseDate(appointmentOccurrence.startDate)
    const startTime = parseDate(
      `${appointmentOccurrence.startDate}T${appointmentOccurrence.startTime}`,
      "yyyy-MM-dd'T'HH:mm",
    )
    const endTime = parseDate(
      `${appointmentOccurrence.startDate}T${appointmentOccurrence.endTime}`,
      "yyyy-MM-dd'T'HH:mm",
    )

    req.session.appointmentJourney = {
      mode: AppointmentJourneyMode.EDIT,
      type: AppointmentType[appointmentOccurrence.appointmentType],
      prisoners: appointmentOccurrence.prisoners.map(p => ({
        number: p.prisonerNumber,
        name: `${p.firstName} ${p.lastName}`,
        cellLocation: p.cellLocation,
      })),
      category: appointmentOccurrence.category,
      location: appointmentOccurrence.internalLocation,
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
      repeat: appointmentOccurrence.repeat ? YesNo.YES : YesNo.NO,
      repeatPeriod: appointmentOccurrence.repeat?.period as AppointmentRepeatPeriod,
      repeatCount: appointmentOccurrence.repeat?.count,
      comment: appointmentOccurrence.comment,
    }

    if (isValid(endTime)) {
      req.session.appointmentJourney.endTime = {
        date: endTime,
        hour: +formatDate(endTime, 'HH'),
        minute: +formatDate(endTime, 'mm'),
      }
    }

    req.session.editAppointmentJourney = {
      repeatCount: appointmentOccurrence.repeat?.count ?? 1,
      occurrencesRemaining: appointment.occurrences.length,
      sequenceNumber: appointmentOccurrence.sequenceNumber,
    }
  }
}
