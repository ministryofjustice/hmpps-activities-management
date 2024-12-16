import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'

export default class ViewSuspensionsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly caseNotesService: CaseNotesService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals
    const { allocationId } = req.query

    const allocations = await this.activitiesService
      .getActivePrisonPrisonerAllocations([prisonerNumber], user)
      .then(r => r.flatMap(a => a.allocations))
      .then(r => r.filter(a => allocationId === undefined || a.id === +allocationId))
      .then(r => r.filter(a => a.plannedSuspension))

    if (allocations.length === 0) {
      return next(createHttpError.NotFound())
    }

    const plannedByUsernames = allocations.map(a => a.plannedSuspension.plannedBy)
    const userMap = await this.userService.getUserMap(plannedByUsernames, user)

    const caseNoteIds = allocations.map(a => a.plannedSuspension.caseNoteId)
    const caseNotesMap = await this.caseNotesService.getCaseNoteMap(prisonerNumber, caseNoteIds, user)

    const groupedAllocations = Object.values(
      _.chain(allocations).sortBy('plannedSuspension.plannedAt').groupBy('plannedSuspension.plannedAt').value(),
    )
    return res.render('pages/activities/suspensions/view-suspensions', { groupedAllocations, caseNotesMap, userMap })
  }
}
