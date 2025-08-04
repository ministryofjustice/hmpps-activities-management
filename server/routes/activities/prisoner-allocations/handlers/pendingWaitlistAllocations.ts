import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import config from '../../../../config'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { YesNo } from '../../../../@types/activities'
import { NameFormatStyle } from '../../../../utils/helpers/nameFormatStyle'
import { formatName } from '../../../../utils/utils'

export class allocateOption {
  @Expose()
  @IsEnum(YesNo, {
    message: ({ object }) => {
      const { prisonerName } = object as { prisonerName: string }
      return `Select if you want to approve this application and allocate ${prisonerName} or not`
    },
  })
  options: YesNo
}
export default class PendingWaitlistHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }

    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    return res.render('pages/activities/prisoner-allocations/pending-application', {
      prisonerName: formatName(
        prisoner.firstName,
        prisoner.middleNames,
        prisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      ),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber } = req.params
    const { options } = req.body
    const { applicationId, scheduleId } = req.journeyData.prisonerAllocationsJourney

    if (options === YesNo.YES) {
      await this.activitiesService.patchWaitlistApplication(+applicationId, { status: 'APPROVED' }, user)

      return res.redirect(`/activities/allocations/create/prisoner/${prisonerNumber}?scheduleId=${scheduleId}`)
    }
    return res.redirect(`/activities/prisoner-allocations/${prisonerNumber}`)
  }
}
