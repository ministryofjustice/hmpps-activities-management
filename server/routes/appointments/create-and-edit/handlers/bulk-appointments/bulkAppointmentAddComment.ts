import { MaxLength } from 'class-validator'
import { Request, Response } from 'express'

export class BulkAppointmentComment {
  @MaxLength(4000, { message: 'You must enter a comment which has no more than 4,000 characters' })
  comment: string
}

export default class BulkAppointmentAddCommentRoutes {
  GET = async (req: Request, res: Response) => {
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    // Prisoner not found, redirect back
    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (!appointment) return res.redirect('../bulk-appointment-comments')

    const { prisoner, extraInformation } = appointment

    return res.render('pages/appointments/create-and-edit/bulk-appointments/add-comment', {
      prisoner,
      extraInformation,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { comment } = req.body
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (appointment) appointment.extraInformation = comment

    if (req.query?.preserveHistory) res.redirect(`../check-answers`)
    else res.redirect('../bulk-appointment-comments')
  }
}
