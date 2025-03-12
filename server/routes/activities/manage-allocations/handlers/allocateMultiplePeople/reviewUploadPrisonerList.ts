import { Request, Response } from 'express'
import PrisonService from '../../../../../services/prisonService'

export default class ReviewUploadPrisonerListRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    // const { allocateJourney } = req.session
    // console.log(allocateJourney.inmates?.[0].prisonerNumber)

    // FIXME get current allocations

    // FIXME remove where incentive level does not match for the pay rate, add to a list

    // FIXME remove currently allocated from main list, add to already allocated list

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList')
  }

  // POST = async (req: Request, res: Response): Promise<void> => {
  //   const { user } = res.locals
  // }
}
