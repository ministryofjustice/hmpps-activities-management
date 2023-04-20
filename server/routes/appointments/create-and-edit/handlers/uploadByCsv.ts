import { Request, Response } from 'express'

export default class UploadByCSV {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/upload-by-csv')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('upload-prisoner-list')
  }
}
