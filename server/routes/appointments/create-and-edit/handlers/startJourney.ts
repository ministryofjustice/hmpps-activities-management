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
    const { journeyId } = req.params

    req.session.appointmentSessionDataMap[journeyId] = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.INDIVIDUAL,
      },
    }

    req.session.returnTo = null
    const { prisonNumber } = req.query
    if (prisonNumber && typeof prisonNumber === 'string') {
      const { user } = res.locals

      const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonNumber, user).catch(_ => null)

      if (!prisoner) return res.redirect(`select-prisoner?query=${prisonNumber}`)
      const prisonerData = {
        number: prisoner.prisonerNumber,
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        cellLocation: prisoner.cellLocation,
      }
      req.session.appointmentJourney.prisoners = [prisonerData]
      req.session.appointmentJourney.fromPrisonNumberProfile = prisonNumber
      return res.redirect(`category`)
    }
    return res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params

    req.session.appointmentSessionDataMap[journeyId] = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [],
      },
    }
    req.session.returnTo = null
    res.redirect('how-to-add-prisoners')
  }

  BULK = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params

    req.session.appointmentSessionDataMap[journeyId] = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.BULK,
      },
      bulkAppointmentJourney: {
        appointments: [],
      },
    }
    req.session.returnTo = null
    res.redirect('upload-by-csv')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { property } = req.params

    if (!property) return res.redirect('back')

    this.populateEditSession(req)

    return res.redirect(`../${property}`)
  }

  REMOVE_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req
    const { prisonNumber } = req.params

    const prisoner = appointmentOccurrence.prisoners.filter(_ => _.prisonerNumber === prisonNumber)[0]

    if (!prisoner) return res.redirect('back')

    this.populateEditSession(req)

    req.session.editAppointmentJourney.removePrisoner = prisoner

    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect('../remove/apply-to')
    }

    req.session.editAppointmentJourney.applyTo = AppointmentApplyTo.THIS_OCCURRENCE

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
    const { journeyId } = req.params
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

    req.session.appointmentSessionDataMap[journeyId] = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.EDIT,
        type: AppointmentType[appointmentOccurrence.appointmentType],
        appointmentName: appointment.appointmentName,
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
      },
      editAppointmentJourney: {
        repeatCount: appointmentOccurrence.repeat?.count ?? 1,
        sequenceNumbers: appointment.occurrences.map(occurrence => occurrence.sequenceNumber),
        sequenceNumber: appointmentOccurrence.sequenceNumber,
      },
    }

    if (isValid(endTime)) {
      req.session.appointmentSessionDataMap[journeyId].appointmentJourney.endTime = {
        date: endTime,
        hour: +formatDate(endTime, 'HH'),
        minute: +formatDate(endTime, 'mm'),
      }
    }

    req.session.returnTo = null
  }
}
