import { MaxLength } from 'class-validator'
import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import config from '../../../../../config'

export class AppointmentSetAppointmentExtraInformation {
  @MaxLength(4000, { message: 'You must enter extra information which has no more than 4,000 characters' })
  extraInformation: string
}

export class AppointmentSetStaffPrisonerExtraInformation {
  @MaxLength(4000, { message: 'You must enter notes for staff which has no more than 4,000 characters' })
  extraInformation: string

  @Expose()
  @MaxLength(800, { message: 'You must enter notes for prisoner which has no more than 800 characters' })
  prisonerExtraInformation: string
}

export default class AppointmentSetAddExtraInformationRoutes {
  GET = async (req: Request, res: Response) => {
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    // Prisoner not found, redirect back
    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (!appointment) return res.redirect('../appointment-set-extra-information')

    const { prisoner, extraInformation, prisonerExtraInformation } = appointment

    return res.render('pages/appointments/create-and-edit/appointment-set/add-extra-information', {
      prisoner,
      extraInformation,
      prisonerExtraInformation,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { extraInformation, prisonerExtraInformation } = req.body
    const { appointments } = req.session.appointmentSetJourney
    const { prisonerNumber } = req.params

    const appointment = appointments.find(a => a?.prisoner.number === prisonerNumber)
    if (appointment) {
      appointment.extraInformation = extraInformation

      if (config.prisonerExtraInformationEnabled) appointment.prisonerExtraInformation = prisonerExtraInformation
    }

    if (req.query?.preserveHistory) res.redirect(`../check-answers`)
    else res.redirect('../appointment-set-extra-information')
  }
}
