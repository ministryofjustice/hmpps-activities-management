import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { getAppointmentBackLinkHref, isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class Location {
  @Expose()
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
      backLinkHref: getAppointmentBackLinkHref(req, 'name'),
      locations,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
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

    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      res.redirectOrReturn(`bulk-appointment-date`)
    } else {
      res.redirectOrReturn(`date-and-time`)
    }
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
      res.validationFailed('locationId', `Start typing the appointment location and select it from the list`)
      return false
    }

    return location
  }
}
