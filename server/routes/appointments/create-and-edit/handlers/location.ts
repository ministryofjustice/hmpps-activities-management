import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'

export class Location {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  locationId: number
}

export default class LocationRoutes {
  private readonly editAppointmentService: EditAppointmentService

  constructor(private readonly activitiesService: ActivitiesService) {
    this.editAppointmentService = new EditAppointmentService(activitiesService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    res.render('pages/appointments/create-and-edit/location', {
      backLinkHref: this.editAppointmentService.getBackLinkHref(req, 'category'),
      locations,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !this.editAppointmentService.isApplyToQuestionRequired(req),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    const location = await this.getLocation(req, res)
    if (!location) return

    appointmentJourney.location = {
      id: location.id,
      description: location.description,
    }

    res.redirectOrReturn(`date-and-time`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const location = await this.getLocation(req, res)
    if (!location) return

    req.session.editAppointmentJourney.location = {
      id: location.id,
      description: location.description,
    }

    await this.editAppointmentService.redirectOrEdit(req, res, 'location')
  }

  private getLocation = async (req: Request, res: Response) => {
    const { locationId } = req.body
    const { user } = res.locals

    const location = await this.activitiesService
      .getAppointmentLocations(user.activeCaseLoadId, user)
      .then(locations => locations.find(l => l.id === locationId))

    if (!location) {
      res.validationFailed('locationId', `Selected location not found`)
      return false
    }

    return location
  }
}
