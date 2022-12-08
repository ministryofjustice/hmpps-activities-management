import { Response } from 'superagent'

import { stubFor } from './wiremock'

const stubUser = (firstName: string, lastName: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        accountStatus: 'ACTIVE',
        active: true,
        activeCaseLoadId: 'LEI',
        expiredFlag: false,
        firstName,
        lastName,
        lockedFlag: false,
        staffId: 231232,
        username: 'USER1',
      },
    },
  })

const stubCaseload = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me/caseLoads',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        { caseLoadId: 'MDI', description: 'Moorland (HMP & YOI)', currentlyActive: false },
        { caseLoadId: 'LEI', description: 'Leeds (HMP)', currentlyActive: true },
      ],
    },
  })

const stubUserRoles = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/users/.*/roles\\?include-nomis-roles=true',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { dpsRoles: [], nomisRoles: [{ caseload: { id: 'LEI' }, roles: [] }] },
    },
  })

const stubSetActiveCaseload = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/api/users/me/activeCaseLoad',
    },
    response: {
      status: 200,
    },
  })

const stubGetInmateDetails = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: `/api/bookings/offenders`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          bookingId: 1200982,
          bookingNo: '38453A',
          offenderNo: 'A5193DY',
          firstName: 'Alan',
          lastName: 'Key',
          agencyId: 'MDI',
          assignedLivingUnitId: 25620,
          assignedLivingUnitDesc: 'MDI-1-3-004',
          dateOfBirth: '2000-04-12',
        },
        {
          bookingId: 1203218,
          bookingNo: '40220A',
          offenderNo: 'A9477DY',
          firstName: 'Joe',
          lastName: 'Bloggs',
          agencyId: 'MDI',
          assignedLivingUnitId: 25578,
          assignedLivingUnitDesc: 'MDI-1-2-001',
          dateOfBirth: '1985-12-12',
        },
        {
          bookingId: 1200993,
          bookingNo: '38458A',
          offenderNo: 'G4793VF',
          firstName: 'Mr',
          lastName: 'Blobby',
          agencyId: 'MDI',
          assignedLivingUnitId: 25663,
          assignedLivingUnitDesc: 'MDI-2-1-007',
          dateOfBirth: '1986-06-27',
        },
      ],
    },
  })

export default {
  stubSetActiveCaseload,
  stubPrisonUser: (firstname = 'john', lastname = 'smith'): Promise<[Response, Response, Response]> =>
    Promise.all([stubUser(firstname, lastname), stubCaseload(), stubUserRoles()]),
  stubGetInmateDetails,
}
