import { RequestHandler } from 'express'

export default (): RequestHandler => {
  return async (req, res, next) => {
    const { user } = res.locals
    const { activeCaseLoad } = user
    if (req.baseUrl === '/activity-list-am' && !activeCaseLoad.isRolledOut) {
      return res.redirect('/activity-list/select-activity-location')
    }
    if (req.baseUrl === '/activity-list' && activeCaseLoad.isRolledOut) {
      return res.redirect('/activity-list-am/select-activity-location')
    }
    return next()
  }
}
