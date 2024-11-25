import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonPayBandCreateRequest } from '../../../../@types/activitiesAPI/types'

export class AddPrisonPayBand {
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

export default class AddPrisonPayBandRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/administration/add-prison-pay-band')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { description, nomisPayBand, displaySequence, alias } = req.body

    const request: PrisonPayBandCreateRequest = {
      description,
      nomisPayBand: +nomisPayBand,
      displaySequence: +displaySequence,
      alias,
    }
    const prisonPayBand = await this.activitiesService.postPrisonPayBand(user.activeCaseLoadId, request, user)

    return res.redirectWithSuccess(
      '/activities/admin/prison-pay-bands',
      'Created',
      `Prison pay band '${prisonPayBand.description}' created`,
    )
  }
}
