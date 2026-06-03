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

const DEFAULT_BACK_PATH = '/activities/allocations'
const PRISONER_SUSPENSIONS_REFERER_PATH = /\/activities\/suspensions\/prisoner\/[^/?#]+(?:\?.*)?$/

// Default the back link allocations unless the user arrives by clicking 'add another' on the prisoner suspensions page.
// This avoids users falling into a back-link loop.
const getBackLinkFromReferrer = (req: Request): string => {
  const referrer = req.get('Referrer') || ''
  const cameFromPrisonerSuspensionsPage = PRISONER_SUSPENSIONS_REFERER_PATH.test(referrer)

  if (!cameFromPrisonerSuspensionsPage) {
    req.session.prisonerSearchBackLinkHref = null
    return DEFAULT_BACK_PATH
  }

  return req.session.prisonerSearchBackLinkHref ?? DEFAULT_BACK_PATH
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { query } = req.query

    if (query && typeof query === 'string') {
      const prisoners = (await this.prisonService.searchPrisonInmates(query, user)).content || []
      return res.render('pages/activities/suspensions/select-prisoner', {
        prisoners,
        query,
        backLinkHref: DEFAULT_BACK_PATH,
      })
    }

    return res.render('pages/activities/suspensions/select-prisoner', {
      backLinkHref: getBackLinkFromReferrer(req),
    })
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
