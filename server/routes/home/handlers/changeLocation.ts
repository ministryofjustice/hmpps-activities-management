import { Request, Response } from 'express'
import _ from 'lodash'
import { CaseLoad } from '../../../@types/prisonApiImport/types'
import UserService from '../../../services/userService'

export default class ChangeLocationRoutes {
  constructor(private readonly userService: UserService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    if (user.allCaseLoads.length < 2) {
      return res.redirect('back')
    }

    const viewContext = {
      options: user.allCaseLoads.map((c: CaseLoad) => ({
        value: c.caseLoadId,
        text: c.description,
      })),
    }

    // Set the callback to the referer only if the referer was not the page itself
    if (!req.get('Referer')?.endsWith(req.originalUrl)) {
      req.session.returnTo = req.get('Referer')
    }

    return res.render('pages/change-location', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { caseLoadId } = req.body
    const { user } = res.locals

    await this.userService.setActiveCaseLoad(caseLoadId, user)

    // Invalidate user details so new user is fetched for the session
    _.unset(req.session, 'user')
    return res.redirect(req.session.returnTo)
  }
}
