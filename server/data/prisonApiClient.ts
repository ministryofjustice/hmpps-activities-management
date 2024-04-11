import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ReferenceCode, AgencyPrisonerPayProfile, Alert } from '../@types/prisonApiImport/types'
import { ServiceUser } from '../@types/express'
import { LocationLenient } from '../@types/prisonApiImportCustom'

export default class PrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi as ApiConfig)
  }

  async getEventLocations(prisonCode: string, user: ServiceUser): Promise<LocationLenient[]> {
    return this.get({
      path: `/api/agencies/${prisonCode}/eventLocations`,
      authToken: user.token,
    })
  }

  async getReferenceCodes(domain: string, user: ServiceUser): Promise<ReferenceCode[]> {
    return this.get({
      path: `/api/reference-domains/domains/${domain}/codes`,
      authToken: user.token,
    })
  }

  async getPayProfile(prisonCode: string): Promise<AgencyPrisonerPayProfile> {
    return this.get({
      path: `/api/agencies/${prisonCode}/pay-profile`,
    })
  }

  // TODO: Move to prisonSearchApiClient once alerts endpoint is available
  async getPrisonersAlerts(offenderNumbers: string[], prisonCode: string, user: ServiceUser): Promise<Alert[]> {
    return this.post({
      path: `/api/bookings/offenderNo/${prisonCode}/alerts`,
      data: offenderNumbers,
      authToken: user.token,
    })
  }

  // court hearings
  /*
    suspend fun getScheduledCourtHearingsAsync(
    bookingId: Long,
    dateRange: LocalDateRange,
  ): CourtHearings? {
    if (dateRange.isEmpty()) return null
    return prisonApiWebClient.get()
      .uri { uriBuilder: UriBuilder ->
        uriBuilder
          .path("/api/bookings/{bookingId}/court-hearings")
          .queryParam("fromDate", dateRange.start)
          .queryParam("toDate", dateRange.endInclusive)
          .build(bookingId)
      }
      .retrieve()
      .awaitBody()
    }
  */
  // visits
  /*
   suspend fun getScheduledVisitsAsync(
    bookingId: Long,
    dateRange: LocalDateRange,
  ): List<PrisonApiScheduledEvent> =
    prisonApiWebClient.get()
      .uri { uriBuilder: UriBuilder ->
        uriBuilder
          .path("/api/bookings/{bookingId}/visits")
          .queryParam("fromDate", dateRange.start)
          .queryParam("toDate", dateRange.endInclusive)
          .build(bookingId)
      }
      .retrieve()
      .awaitBody()
  */
  // transfers - not other logic around this...mainly to avoid calling
  /*
   suspend fun getExternalTransfersOnDateAsync(
    agencyId: String,
    prisonerNumbers: Set<String>,
    date: LocalDate,
  ): List<PrisonerSchedule> {
    if (prisonerNumbers.isEmpty()) return emptyList()
    return prisonApiWebClient.post()
      .uri { uriBuilder: UriBuilder ->
        uriBuilder
          .path("/api/schedules/{agencyId}/externalTransfers")
          .queryParam("date", date)
          .build(agencyId)
      }
      .bodyValue(prisonerNumbers)
      .retrieve()
      .awaitBody()
  }
  */
  // adjudication hearings
  /*
   suspend fun getOffenderAdjudications(
    agencyId: String,
    dateRange: LocalDateRange,
    prisonerNumbers: Set<String>,
    timeSlot: TimeSlot? = null,
  ): List<OffenderAdjudicationHearing> {
    if (prisonerNumbers.isEmpty()) return emptyList()
    return prisonApiWebClient.post()
      .uri { uriBuilder: UriBuilder ->
        uriBuilder
          .path("/api/offenders/adjudication-hearings")
          .queryParam("agencyId", agencyId)
          .queryParam("fromDate", dateRange.start)
          .queryParam("toDate", dateRange.endInclusive)
          .maybeQueryParam("timeSlot", timeSlot)
          .build()
      }
      .bodyValue(prisonerNumbers)
      .retrieve()
      .awaitBody()
  }

  */
}
