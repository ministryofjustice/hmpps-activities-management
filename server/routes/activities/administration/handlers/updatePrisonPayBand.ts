import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonPayBand, PrisonPayBandUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class UpdatePrisonPayBand {
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'Display sequence must be a number' })
  @IsInt({ message: 'Display sequence must be a number' })
  @Min(1, { message: 'Display sequence must be a positive number' })
  displaySequence: number

  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'Nomis pay band must be a number' })
  @IsInt({ message: 'Nomis pay band must be a number' })
  @Min(1, { message: 'Nomis pay band must be a positive number' })
  nomisPayBand: number

  @Expose()
  @IsNotEmpty({ message: 'Add a description' })
  description: string

  @Expose()
  @IsNotEmpty({ message: 'Add an alias' })
  alias: string
}

export default class UpdatePrisonPayBandRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonPayBandId } = req.params

    const prisonPayBands: PrisonPayBand[] = await this.activitiesService.getPayBandsForPrison(user)
    const prisonPayBand: PrisonPayBand = prisonPayBands.find(pay => pay.id === +prisonPayBandId)

    res.render('pages/activities/administration/update-prison-pay-band', {
      prisonPayBand,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonPayBandId } = req.params
    const { description, alias, nomisPayBand, displaySequence } = req.body

    const request: PrisonPayBandUpdateRequest = {
      description,
      nomisPayBand: +nomisPayBand,
      displaySequence: +displaySequence,
      alias,
    }

    const updatedPrisonPayBand = await this.activitiesService.patchPrisonPayBand(
      user.activeCaseLoadId,
      request,
      +prisonPayBandId,
      user,
    )

    return res.redirectWithSuccess(
      '/activities/admin/prison-pay-bands',
      'Updated',
      `Prison pay band '${updatedPrisonPayBand.description}' updated`,
    )
  }
}
