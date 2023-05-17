import { Request, Response } from 'express'
import { AppointmentType } from '../appointmentJourney'

export default class UploadByCSV {
  GET = async (req: Request, res: Response): Promise<void> => {
    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      res.render('pages/appointments/create-and-edit/bulk-appointments/create-bulk-appointment-by-csv')
    } else {
      res.render('pages/appointments/create-and-edit/upload-prisoners-by-csv')
    }
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      res.redirect('upload-bulk-appointment')
    } else {
      res.redirect('upload-prisoner-list')
    }
  }
}
