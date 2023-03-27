import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'

export default class UploadPrisonerListRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create/upload-prisoner-list`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { file } = req
    const { user } = res.locals
  }
}
