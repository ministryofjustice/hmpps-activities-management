import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { VideoLinkBooking, Location, VideoBookingSearchRequest } from '../@types/bookAVideoLinkApi/types'

export default class BookAVideoLinkApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi as ApiConfig)
  }

  public getVideoLinkBookingById(id: number, user: ServiceUser): Promise<VideoLinkBooking> {
    return this.get({ path: `/video-link-booking/id/${id}` }, user)
  }

  public matchAppointmentToVideoLinkBooking(
    requestBody: VideoBookingSearchRequest,
    user: ServiceUser,
  ): Promise<VideoLinkBooking> {
    return this.post({ path: `/video-link-booking/search`, data: requestBody }, user)
  }

  public getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<Location[]> {
    return this.get({ path: `/prisons/${prisonCode}/locations` }, user)
  }
}
