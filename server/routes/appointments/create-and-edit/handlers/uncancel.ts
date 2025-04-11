import { Request, Response } from 'express'
import { isApplyToQuestionRequired, isApplyToRequiredForUncancel } from '../../../../utils/editAppointmentUtils'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'

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
      isApplyToRequiredForUncancel(appointmentJourney, editAppointmentJourney)
    ) {
      return res.redirect('apply-to')
    }
    return this.editAppointmentService.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
  }
}
