import { MaxLength } from 'class-validator'
import { Request, Response } from 'express'

export class AppointmentSetAppointmentExtraInformation {
  @MaxLength(4000, { message: 'You must enter extra information which has no more than 4,000 characters' })
  extraInformation: string
}

export default class AppointmentSetAddExtraInformationRoutes {
  GET = async (req: Request, res: Response) => {
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    // Prisoner not found, redirect back
    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (!appointment) return res.redirect('../appointment-set-extra-information')

    const { prisoner, extraInformation } = appointment

    return res.render('pages/appointments/create-and-edit/appointment-set/add-extra-information', {
      prisoner,
      extraInformation,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { extraInformation } = req.body
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (appointment) appointment.extraInformation = extraInformation

    if (req.query?.preserveHistory) res.redirect(`../check-answers`)
    else res.redirect('../appointment-set-extra-information')
  }
}
