import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'
import config from '../../../../config'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'

export enum PaidType {
  YES = 'YES',
  NO_UNPAID = 'NO_UNPAID',
  NO = 'NO',
}

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

    const allocationsWithPaidType = this.getPayTypeForAllocations(allocations)

    const plannedByUsernames = allocationsWithPaidType.map(a => a.plannedSuspension.plannedBy)
    const userMap = await this.userService.getUserMap(plannedByUsernames, user)

    const caseNoteIds = allocationsWithPaidType.map(a => a.plannedSuspension.caseNoteId)
    const caseNotesMap = await this.caseNotesService.getCaseNoteMap(prisonerNumber, caseNoteIds, user)

    const groupedAllocations = Object.values(
      _.chain(allocationsWithPaidType)
        .sortBy('plannedSuspension.plannedAt')
        .groupBy('plannedSuspension.plannedAt')
        .value(),
    )

    return res.render('pages/activities/suspensions/view-suspensions', {
      groupedAllocations,
      caseNotesMap,
      userMap,
    })
  }

  private getPayTypeForAllocations = allocations => {
    if (config.suspendPrisonerWithPayToggleEnabled) {
      return allocations.map(allocation => {
        if (allocation.status === PrisonerSuspensionStatus.SUSPENDED_WITH_PAY || allocation.plannedSuspension.paid)
          return { ...allocation, paidWhileSuspended: PaidType.YES }
        if (allocation.prisonPayBand == null) return { ...allocation, paidWhileSuspended: PaidType.NO_UNPAID }
        return { ...allocation, paidWhileSuspended: PaidType.NO }
      })
    }
    return allocations
  }
}
