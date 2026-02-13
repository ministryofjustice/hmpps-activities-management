import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
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

  async getVideoLinkBookingById(id: number): Promise<VideoLinkBooking> {
    return this.get({ path: `/video-link-booking/id/${id}` }, asSystem())
  }

  async matchAppointmentToVideoLinkBooking(requestBody: VideoBookingSearchRequest): Promise<VideoLinkBooking> {
    return this.post({ path: `/video-link-booking/search`, data: requestBody }, asSystem())
  }

  async getAppointmentLocations(prisonCode: string): Promise<Location[]> {
    return this.get({ path: `/prisons/${prisonCode}/locations`, query: { videoLinkOnly: false } }, asSystem())
  }

  async getAllCourts(): Promise<Court[]> {
    return this.get({ path: '/courts', query: { enabledOnly: false } }, asSystem())
  }

  async getAllProbationTeams(): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams', query: { enabledOnly: false } }, asSystem())
  }

  async getReferenceCodesForGroup(groupCode: string): Promise<ReferenceCode[]> {
    return this.get({ path: `/reference-codes/group/${groupCode}` }, asSystem())
  }

  async createVideoLinkBooking(request: CreateVideoBookingRequest): Promise<number> {
    return this.post({ path: '/video-link-booking', data: request }, asSystem())
  }

  async amendVideoLinkBooking(videoBookingId: number, request: AmendVideoBookingRequest): Promise<number> {
    return this.put({ path: `/video-link-booking/id/${videoBookingId}`, data: request }, asSystem())
  }

  async cancelVideoLinkBooking(videoBookingId: number): Promise<number> {
    return this.delete({ path: `/video-link-booking/id/${videoBookingId}` }, asSystem())
  }
}
