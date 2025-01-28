import { Request, Response } from 'express'

export default class DeallocationCheckAndConfirmRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('deallocation-confirmation')
  }
}
