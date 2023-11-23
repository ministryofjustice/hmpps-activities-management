import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  selectedPrisoner: string
}

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'You must enter a name or prison number in the format A1234CD' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { query } = req.query

    if (query && typeof query === 'string') {
      const prisoners = (await this.prisonService.searchPrisonInmates(query, user)).content || []
      return res.render('pages/activities/exclusions/select-prisoner', { prisoners, query })
    }

    return res.render('pages/activities/exclusions/select-prisoner')
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}`)
  }

  SELECT_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { selectedPrisoner } = req.body
    return res.redirect(`prisoner/${selectedPrisoner}`)
  }
}
