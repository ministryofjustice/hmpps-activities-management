import { Request, Response } from 'express'
import _ from 'lodash'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import PrisonService from '../../../../services/prisonService'

export class Location {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  locationId: number
}

export default class LocationRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.prisonService.getEventLocations(user.activeCaseLoad.caseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'locationId')

    res.render('pages/appointments/create-single/location', {
      locations: uniqueLocations.filter(l => l.locationType !== 'BOX'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const location = await this.prisonService
      .getEventLocations(user.activeCaseLoad.caseLoadId, user)
      .then(locations => locations.find(l => l.locationId === req.body.locationId))

    if (!location) {
      req.flash('validationErrors', JSON.stringify([{ field: 'locationId', message: `Select a location` }]))
      return res.redirect('back')
    }

    req.session.createSingleAppointmentJourney.location = {
      id: location.locationId,
      description: location.userDescription,
    }

    return res.redirectOrReturn(`date-and-time`)
  }
}
