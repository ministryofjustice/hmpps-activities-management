import { Request, Response } from 'express'
import _ from 'lodash'
import { Expose, Transform, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsNumber, ValidateIf } from 'class-validator'
import PrisonService from '../../../services/prisonService'

export enum InCell {
  IN_CELL = 'IN_CELL',
  OUT_OF_CELL = 'OUT_OF_CELL',
}

export class Location {
  @Expose()
  @IsEnum(InCell, { message: 'Select whether location is in-cell or out of cell' })
  @Transform(({ value }) => InCell[value])
  inCell: InCell

  @Expose()
  @ValidateIf(l => l.inCell === InCell.OUT_OF_CELL)
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  location: number
}

export default class LocationRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.prisonService.getEventLocations(user.activeCaseLoad.caseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'locationId')

    res.render('pages/create-an-activity/location', {
      locations: uniqueLocations.filter(l => l.locationType !== 'BOX'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { location, inCell } = req.body

    if (inCell === InCell.OUT_OF_CELL) {
      const locationResult = await this.prisonService
        .getEventLocations(user.activeCaseLoad.caseLoadId, user)
        .then(locations => locations.find(l => l.locationId === location))

      req.session.createJourney.location = {
        id: locationResult.locationId,
        name: locationResult.userDescription,
      }
    } else {
      req.session.createJourney.location = null
    }
    req.session.createJourney.inCell = inCell === InCell.IN_CELL

    res.redirectOrReturn(`capacity`)
  }
}
