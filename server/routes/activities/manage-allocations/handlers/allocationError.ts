import { Request, Response } from 'express'

export default class AllocationErrorRoutes {
  GET = async (req: Request, res: Response) => {
    const { errorType } = req.params

    res.render('pages/activities/manage-allocations/allocation-error', { errorType })
  }
}
