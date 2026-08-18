import getActivity from '../../../../../integration_tests/fixtures/activitiesApi/getActivity.json'

export const mathsActivity = structuredClone(getActivity)

mathsActivity.id = 1
mathsActivity.activityName = 'Maths level 1'
mathsActivity.summary = 'Maths level 1'
mathsActivity.schedules[0].id = 2
mathsActivity.schedules[0].startDate = '2025-06-23'

type WaitlistApplicationStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ALLOCATED' | 'REMOVED' | 'WITHDRAWN'

type WaitlistApplication = {
  id: number
  activityId: number
  scheduleId: number
  allocationId: number | null
  prisonerNumber: string
  status: WaitlistApplicationStatus
  requestedDate: string
  requestedBy: string
  earliestReleaseDate: {
    releaseDate: string
  }
  isIndeterminateSentence: boolean
  statusUpdatedTime?: string
  comments?: string | null
  activity: typeof mathsActivity
}

export const buildWaitlistApplication = (overrides: Partial<WaitlistApplication> = {}): WaitlistApplication => ({
  id: 1,
  activityId: 1,
  scheduleId: 2,
  allocationId: null,
  prisonerNumber: 'A1350DZ',
  status: 'PENDING',
  requestedDate: '2025-06-20',
  requestedBy: 'PRISONER',
  earliestReleaseDate: {
    releaseDate: '2023-12-25',
  },
  isIndeterminateSentence: true,
  activity: structuredClone(mathsActivity),
  ...overrides,
})
