import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import {
  VideoLinkBooking,
  Location,
  VideoBookingSearchRequest,
  Court,
  ReferenceCode,
  CreateVideoBookingRequest,
  AmendVideoBookingRequest,
  ProbationTeam,
} from '../@types/bookAVideoLinkApi/types'
import logger from '../../logger'

export default class BookAVideoLinkApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi, logger, authenticationClient)
  }

  async getVideoLinkBookingById(id: number, user: ServiceUser): Promise<VideoLinkBooking> {
    return this.get({ path: `/video-link-booking/id/${id}` }, asSystem(user.username))
  }

  async matchAppointmentToVideoLinkBooking(
    requestBody: VideoBookingSearchRequest,
    user: ServiceUser,
  ): Promise<VideoLinkBooking> {
    return this.post({ path: `/video-link-booking/search`, data: requestBody }, asSystem(user.username))
  }

  async getAppointmentLocations(prisonCode: string, user: ServiceUser): Promise<Location[]> {
    return this.get(
      { path: `/prisons/${prisonCode}/locations`, query: { videoLinkOnly: false } },
      asSystem(user.username),
    )
  }

  async getAllCourts(user: ServiceUser): Promise<Court[]> {
    return this.get({ path: '/courts', query: { enabledOnly: false } }, asSystem(user.username))
  }

  async getAllProbationTeams(user: ServiceUser): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams', query: { enabledOnly: false } }, asSystem(user.username))
  }

  async getReferenceCodesForGroup(groupCode: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({ path: `/reference-codes/group/${groupCode}` }, asSystem(user.username))
  }

  async createVideoLinkBooking(request: CreateVideoBookingRequest, user: ServiceUser): Promise<number> {
    return this.post({ path: '/video-link-booking', data: request }, asSystem(user.username))
  }

  async amendVideoLinkBooking(
    videoBookingId: number,
    request: AmendVideoBookingRequest,
    user: ServiceUser,
  ): Promise<number> {
    return this.put({ path: `/video-link-booking/id/${videoBookingId}`, data: request }, asSystem(user.username))
  }

  async cancelVideoLinkBooking(videoBookingId: number, user: ServiceUser): Promise<number> {
    return this.delete({ path: `/video-link-booking/id/${videoBookingId}` }, asSystem(user.username))
  }
}
