import { WaitingListApplication, WaitingListApplicationHistory } from '../../@types/activitiesAPI/types'

export default class ActivitiesTestData {
  static DeclinedWaitlistApplication: WaitingListApplication = {
    id: 1,
    prisonCode: 'MDI',
    bookingId: 12345,
    createdBy: 'TEST_NAME',
    earliestReleaseDate: undefined,
    status: 'DECLINED',
    activityId: 1,
    scheduleId: 1,
    prisonerNumber: 'ABC123',
    creationTime: '2023-08-16',
    requestedDate: '2023-07-31',
    requestedBy: 'PRISONER',
    comments: 'test comment',
  }

  static WaitlistApplicationHistory: WaitingListApplicationHistory[] = [
    {
      id: 1,
      status: 'APPROVED',
      applicationDate: '2024-01-20',
      requestedBy: 'PRISONER',
      comments: 'Waiting for security',
      updatedBy: 'TEST_NAME',
      updatedDateTime: '2026-02-01T11:00:00',
    },
    {
      id: 1,
      status: 'PENDING',
      applicationDate: '2024-01-20',
      requestedBy: 'PRISONER',
      comments: 'Waiting for security',
      updatedBy: 'TEST_NAME',
      updatedDateTime: '2026-01-01T14:00:00',
    },
    {
      id: 1,
      status: 'PENDING',
      applicationDate: '2024-01-15',
      requestedBy: 'PRISONER',
      comments: 'Waiting for security',
      updatedBy: 'TEST_NAME',
      updatedDateTime: '2026-01-01T13:00:00',
    },
  ]
}
