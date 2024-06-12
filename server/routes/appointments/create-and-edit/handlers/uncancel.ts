import { Request, Response } from 'express'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourney } from '../appointmentJourney'
import { toDate } from '../../../../utils/utils'

export default class UncancelRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    req.session.editAppointmentJourney.uncancel = true

    res.render('pages/appointments/create-and-edit/confirm-edit', {
      appointmentId,
      startDate: parseIsoDate(req.session.appointmentJourney.startDate),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney, editAppointmentJourney } = req.session

    if (
      isApplyToQuestionRequired(editAppointmentJourney) &&
      this.isApplyToRequiredForUncancel(appointmentJourney, editAppointmentJourney)
    ) {
      return res.redirect('apply-to')
    }
    return this.editAppointmentService.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
  }

  isApplyToRequiredForUncancel = (
    appointmentJourney: AppointmentJourney,
    editAppointmentJourney: EditAppointmentJourney,
  ) => {
    const startDate = toDate(appointmentJourney.startDate)
    const anyAfter = editAppointmentJourney.appointments.some(i => toDate(i.startDate) > startDate)
    const anyAfterScheduled = editAppointmentJourney.appointments.some(
      i => toDate(i.startDate) > startDate && i.cancelled === false,
    )
    return anyAfter && !anyAfterScheduled
  }
}
