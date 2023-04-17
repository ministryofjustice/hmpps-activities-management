import { Request, Response } from 'express'
import { formatDate, parseDate } from '../../../../utils/utils'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'

export default class StartJourneyRoutes {
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

  EDIT_OCCURRENCE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req
    const { property } = req.params

    if (!property) return res.redirect('back')

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
      endTime: {
        date: endTime,
        hour: +formatDate(endTime, 'HH'),
        minute: +formatDate(endTime, 'mm'),
      },
    }

    return res.redirect(
      `/appointments/${appointmentOccurrence.appointmentId}/occurrence/${appointmentOccurrence.id}/edit/${property}`,
    )
  }
}
