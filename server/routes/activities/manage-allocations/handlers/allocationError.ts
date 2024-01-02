import { Request, Response } from 'express'

export default class AllocationErrorRoutes {
  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/manage-allocations/allocation-error')
  }
}
