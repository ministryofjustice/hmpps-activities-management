import { Request, Response } from 'express'
import _ from 'lodash'
import { Expose, Transform, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsNumber, ValidateIf } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export enum LocationType {
  IN_CELL = 'IN_CELL',
  OUT_OF_CELL = 'OUT_OF_CELL',
  ON_WING = 'ON_WING',
}

export class Location {
  @Expose()
  @IsEnum(LocationType, { message: 'Select whether location is in-cell or out of cell' })
  @Transform(({ value }) => LocationType[value])
  locationType: LocationType

  @Expose()
  @ValidateIf(l => l.locationType === LocationType.OUT_OF_CELL)
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  location: number
}

export default class LocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.prisonService.getEventLocations(user.activeCaseLoad.caseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'locationId')

    res.render('pages/activities/create-an-activity/location', {
      locations: uniqueLocations.filter(l => l.locationType !== 'BOX'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { location, locationType } = req.body

    if (locationType === LocationType.OUT_OF_CELL) {
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
    req.session.createJourney.inCell = locationType === LocationType.IN_CELL
    req.session.createJourney.onWing = locationType === LocationType.ON_WING

    if (req.query && req.query.fromEditActivity) {
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        inCell: req.session.createJourney.inCell,
        onWing: req.session.createJourney.onWing,
        locationId: req.session.createJourney.location?.id,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the location for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn(`capacity`)
  }
}
