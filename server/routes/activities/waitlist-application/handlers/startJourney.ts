import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase } from '../../../../utils/utils'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    if (prisoner.prisonId !== user.activeCaseLoadId) {
      return next(createHttpError.NotFound())
    }

    req.session.waitListApplicationJourney = {
      prisoner: {
        prisonerNumber,
        name: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      },
    }

    return res.redirect(`../request-date`)
  }
}
