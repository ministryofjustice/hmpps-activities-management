import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import LocationType from '../../../../enum/locationType'
import LocationsService from '../../../../services/locationsService'

export class Location {
  @Expose()
  @IsEnum(LocationType, { message: 'Select whether location is in-cell or out of cell' })
  @Transform(({ value }) => LocationType[value])
  locationType: LocationType

  @Expose()
  @ValidateIf(l => l.locationType === LocationType.OUT_OF_CELL)
  @IsNotEmpty({ message: 'Select a location' })
  location: string
}

export default class LocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly locationsService: LocationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.locationsService.fetchActivityLocations(user.activeCaseLoadId, user)

    res.render('pages/activities/create-an-activity/location', {
      locations,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { location, locationType } = req.body

    if (locationType === LocationType.OUT_OF_CELL) {
      const locationResult = await this.locationsService
        .fetchActivityLocations(user.activeCaseLoadId, user)
        .then(locations => locations.find(l => l.id === location))

      req.session.createJourney.location = {
        id: locationResult.id,
        name: locationResult.description,
      }
    } else {
      req.session.createJourney.location = null
    }
    req.session.createJourney.inCell = locationType === LocationType.IN_CELL
    req.session.createJourney.onWing = locationType === LocationType.ON_WING
    req.session.createJourney.offWing = locationType === LocationType.OFF_WING

    if (req.routeContext.mode === 'edit') {
      const { activityId } = req.session.createJourney
      const activity = {
        inCell: req.session.createJourney.inCell,
        onWing: req.session.createJourney.onWing,
        offWing: req.session.createJourney.offWing,
        dpsLocationId: req.session.createJourney.location?.id,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the location for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn(`capacity`)
  }
}
