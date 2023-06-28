import { Request, Response } from 'express'
import { AppointmentType } from '../appointmentJourney'

export default class UploadByCSV {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query

    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      res.render('pages/appointments/create-and-edit/bulk-appointments/create-bulk-appointment-by-csv', {
        preserveHistory,
      })
    } else {
      res.render('pages/appointments/create-and-edit/upload-prisoners-by-csv', { preserveHistory })
    }
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query

    if (req.session.appointmentJourney.type === AppointmentType.BULK) {
      res.redirect(`upload-bulk-appointment${preserveHistory ? '?preserveHistory=true' : ''}`)
    } else {
      res.redirect(`upload-prisoner-list${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
  }
}
