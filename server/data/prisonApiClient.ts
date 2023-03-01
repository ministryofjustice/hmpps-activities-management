import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import {
  CourtEvent,
  InmateDetail,
  PrisonApiUserDetail,
  TransferEvent,
  CaseLoad,
  InmateBasicDetails,
  ReferenceCode,
  Education,
} from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import {
  AlertLenient,
  AssessmentLenient,
  LocationLenient,
  PrisonerScheduleLenient,
  OffenderSentenceDetailLenient,
} from '../@types/prisonApiImportCustom'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getInmateDetail(nomsId: string, user: ServiceUser): Promise<InmateDetail> {
    return this.get({ path: `/api/offenders/${nomsId}` }, user)
  }

  async getUser(user: ServiceUser): Promise<PrisonApiUserDetail> {
    return this.get({ path: '/api/users/me', authToken: user.token })
  }

  async getUserByUsername(username: string, user: ServiceUser): Promise<PrisonApiUserDetail> {
    return this.get({ path: `/api/users/${username}`, authToken: user.token })
  }

  async getUserCaseLoads(user: ServiceUser): Promise<CaseLoad[]> {
    return this.get({ path: '/api/users/me/caseLoads', authToken: user.token })
  }

  async setActiveCaseLoad(caseLoadId: string, user: ServiceUser): Promise<void> {
    const data = {
      caseLoadId,
    }

    return this.put({ path: '/api/users/me/activeCaseLoad', data, authToken: user.token })
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocations`,
      authToken: user.token,
    })
  }

  async getLocationsForEventType(prisonCode: string, eventType: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/locations`,
      query: { eventType },
      authToken: user.token,
    })
  }

  async searchActivityLocations(
    prisonCode: string,
    date: string,
    period: string,
    user: ServiceUser,
  ): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocationsBooked`,
      query: { bookedOnDay: date, timeSlot: period },
      authToken: user.token,
    })
  }

  async getActivitiesAtLocation(
    locationId: string,
    date: string,
    period: string,
    includeSuspended: boolean,
    user: ServiceUser,
  ): Promise<PrisonerScheduleLenient[]> {
    return this.get({
      path: `/api/schedules/locations/${locationId}/activities`,
      query: { date, timeSlot: period, includeSuspended: includeSuspended ? 'true' : 'false' },
      authToken: user.token,
    })
  }

  async getActivityList(
    prisonId: string,
    locationId: string,
    date: string,
    period: string,
    usage: string,
    user: ServiceUser,
  ): Promise<PrisonerScheduleLenient[]> {
    return this.get({
      path: `/api/schedules/${prisonId}/locations/${locationId}/usage/${usage}`,
      query: { date, timeSlot: period },
      authToken: user.token,
    })
  }

  async getVisits(
    prisonId: string,
    date: string,
    period: string,
    offenderNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduleLenient[]> {
    return this.post({
      path: `/api/schedules/${prisonId}/visits`,
      query: { date, timeSlot: period },
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getAppointments(
    prisonId: string,
    date: string,
    period: string,
    offenderNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduleLenient[]> {
    return this.post({
      path: `/api/schedules/${prisonId}/appointments`,
      query: { date, timeSlot: period },
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getActivities(
    prisonId: string,
    date: string,
    period: string,
    offenderNumbers: string[],
    user: ServiceUser,
  ): Promise<PrisonerScheduleLenient[]> {
    return this.post({
      path: `/api/schedules/${prisonId}/activities`,
      query: { date, timeSlot: period },
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getSentenceData(offenderNumbers: string[], user: ServiceUser): Promise<OffenderSentenceDetailLenient[]> {
    return this.post({
      path: '/api/offender-sentences',
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getCourtEvents(
    prisonId: string,
    date: string,
    offenderNumbers: string[],
    user: ServiceUser,
  ): Promise<CourtEvent[]> {
    return this.post({
      path: `/api/schedules/${prisonId}/courtEvents`,
      query: { date },
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getExternalTransfers(
    prisonId: string,
    date: string,
    offenderNumbers: string[],
    user: ServiceUser,
  ): Promise<TransferEvent[]> {
    return this.post({
      path: `/api/schedules/${prisonId}/externalTransfers`,
      query: { date },
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getAlerts(prisonId: string, offenderNumbers: string[], user: ServiceUser): Promise<AlertLenient[]> {
    return this.post({
      path: `/api/bookings/offenderNo/${prisonId}/alerts`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getAssessments(code: string, offenderNumbers: string[], user: ServiceUser): Promise<AssessmentLenient[]> {
    return this.post({
      path: `/api/offender-assessments/${code}`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getInmateDetails(offenderNumbers: string[], user: ServiceUser): Promise<InmateBasicDetails[]> {
    return this.post({
      path: `/api/bookings/offenders`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({
      path: `/api/reference-domains/domains/${domain}/codes`,
      authToken: user.token,
    })
  }

  async getEducations(prisonerNumbers: string[], user: ServiceUser): Promise<Education[]> {
    return this.post({
      path: `/api/education/prisoners`,
      data: prisonerNumbers,
      authToken: user.token,
    })
  }
}
