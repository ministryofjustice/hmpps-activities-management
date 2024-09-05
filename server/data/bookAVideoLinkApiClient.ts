import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import {
  VideoLinkBooking,
  Location,
  VideoBookingSearchRequest,
  Court,
  ReferenceCode,
  CreateVideoBookingRequest,
  AmendVideoBookingRequest,
} from '../@types/bookAVideoLinkApi/types'

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

  public getAllCourts(user: ServiceUser): Promise<Court[]> {
    return this.get({ path: '/courts', query: { enabledOnly: false } }, user)
  }

  public getReferenceCodesForGroup(groupCode: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({ path: `/reference-codes/group/${groupCode}` }, user)
  }

  public createVideoLinkBooking(request: CreateVideoBookingRequest, user: ServiceUser): Promise<number> {
    return this.post({ path: '/video-link-booking', data: request }, user)
  }

  public amendVideoLinkBooking(
    videoBookingId: number,
    request: AmendVideoBookingRequest,
    user: ServiceUser,
  ): Promise<number> {
    return this.put({ path: `/video-link-booking/id/${videoBookingId}`, data: request }, user)
  }

  public cancelVideoLinkBooking(videoBookingId: number, user: ServiceUser): Promise<number> {
    return this.delete({ path: `/video-link-booking/id/${videoBookingId}` }, user)
  }
}
