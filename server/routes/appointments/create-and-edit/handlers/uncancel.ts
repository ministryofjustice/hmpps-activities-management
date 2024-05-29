import { Request, Response } from 'express'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import EditAppointmentService from '../../../../services/editAppointmentService'

export default class UncancelRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    req.session.editAppointmentJourney.uncancel = true
    // FIXME: should editMessage this be set here
    res.render('pages/appointments/create-and-edit/confirm-edit', {
      appointmentId,
      startDate: parseIsoDate(req.session.appointmentJourney.startDate),
      editMessage: 'uncancel',
    })
  }

  // FIXME
  // eslint-disable-next-line consistent-return
  POST = async (req: Request, res: Response): Promise<void> => {
    if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
      return res.redirect('apply-to')
    }
    await this.editAppointmentService.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
  }
}
