import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsNumber, ValidateIf } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'
import { LocationType } from '../../../activities/create-an-activity/handlers/location'

export class Location {
  @Expose()
  @IsEnum(LocationType, { message: 'Select whether location is in-cell or out of cell' })
  @Transform(({ value }) => LocationType[value])
  locationType: LocationType

  @Expose()
  @ValidateIf(l => l.locationType === LocationType.OUT_OF_CELL)
  @Type(() => Number)
  @IsNotEmpty({ message: 'Start typing the appointment location and select it from the list' })
  @IsNumber({ allowNaN: false }, { message: 'Start typing the appointment location and select it from the list' })
  locationId: number
}

export default class LocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly editAppointmentService: EditAppointmentService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    res.render('pages/appointments/create-and-edit/location', {
      locations,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session
    const { locationType } = req.body

    if (locationType === LocationType.OUT_OF_CELL) {
      const location = await this.getLocation(req, res)
      if (!location) return

      appointmentJourney.location = {
        id: location.id,
        description: location.description,
      }
    } else {
      appointmentJourney.location = null
    }

    appointmentJourney.inCell = locationType === LocationType.IN_CELL

    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      res.redirectOrReturn(`appointment-set-date`)
    } else {
      res.redirectOrReturn(`date-and-time`)
    }
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { locationType } = req.body

    if (locationType === LocationType.OUT_OF_CELL) {
      const location = await this.getLocation(req, res)
      if (!location) return

      req.session.editAppointmentJourney.location = {
        id: location.id,
        description: location.description,
      }
    } else {
      req.session.editAppointmentJourney.location = null
    }

    req.session.editAppointmentJourney.inCell = locationType === LocationType.IN_CELL

    await this.editAppointmentService.redirectOrEdit(req, res, 'location')
  }

  private getLocation = async (req: Request, res: Response) => {
    const { locationId } = req.body
    const { user } = res.locals

    const location = await this.activitiesService
      .getAppointmentLocations(user.activeCaseLoadId, user)
      .then(locations => locations.find(l => l.id === locationId))

    if (!location) {
      res.validationFailed('locationId', `Start typing the appointment location and select it from the list`)
      return false
    }

    return location
  }
}
