import { Request, Response } from 'express'

import { when } from 'jest-when'
import { format, subDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Activity, Allocation } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ViewAllocationRoutes from './viewAllocation'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'
import { CaseNote } from '../../../../@types/caseNotesApi/types'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/caseNotesService')
jest.mock('../../../../services/userService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const caseNotesService = new CaseNotesService(null) as jest.Mocked<CaseNotesService>
const userService = new UserService(null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new ViewAllocationRoutes(activitiesService, prisonService, caseNotesService, userService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoad: {
      caseLoadId: 'MDI',
    },
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      const prisonerInfo = {
        prisonerNumber: 'G4793VF',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G4793VF', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          endDate: '2022-12-31',
          inCell: false,
          outsideWork: false,
          pay: [
            { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
            {
              incentiveLevel: 'Standard',
              prisonPayBand: { id: 1, alias: 'Low' },
              rate: 97,
              startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
            },
          ],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: '2022-01-01',
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 0 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        } as unknown as Activity)

      when(caseNotesService.getCaseNote)
        .calledWith(atLeast('G4793VF', 10001))
        .mockResolvedValue({ text: 'test case note' } as CaseNote)
    })

    it('should render the correct view when allocated by user not found', async () => {
      when(userService.getUserMap)
        .calledWith(atLeast(['joebloggs']))
        .mockResolvedValue(
          new Map([['joebloggs', { username: 'joebloggs', name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        )

      when(userService.getUserMap)
        .calledWith(atLeast(['MIGRATION']))
        .mockImplementation(() => {
          throw new Error('Account for username MIGRATION not found')
        })

      when(activitiesService.getAllocation)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
          plannedSuspension: { plannedBy: 'joebloggs', caseNoteId: 10001 },
          allocatedBy: 'MIGRATION',
          allocatedTime: '2024-05-03T13:22:00',
        } as Allocation)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation: {
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
          plannedSuspension: {
            plannedBy: 'joebloggs',
            caseNoteId: 10001,
          },
          allocatedBy: 'MIGRATION',
          allocatedTime: '2024-05-03T13:22:00',
        },
        isOnlyPay: true,
        isStarted: true,
        pay: {
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1, alias: 'Low' },
          rate: 97,
          startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
        },
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: [],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
          ],
        },
        userMap: new Map([['joebloggs', { username: 'joebloggs', name: 'Joe Bloggs' }]]),
        suspensionCaseNote: {
          text: 'test case note',
        },
      })
    })

    it('should render the correct view', async () => {
      when(userService.getUserMap)
        .calledWith(atLeast(['joebloggs']))
        .mockResolvedValue(
          new Map([['joebloggs', { username: 'joebloggs', name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        )

      when(userService.getUserMap)
        .calledWith(atLeast(['GEOFFT']))
        .mockResolvedValue(
          new Map([['GEOFFT', { username: 'GEOFFT', name: 'Geoff Toms' }]]) as Map<string, UserDetails>,
        )

      when(activitiesService.getAllocation)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
          plannedSuspension: { plannedBy: 'joebloggs', caseNoteId: 10001 },
          allocatedBy: 'GEOFFT',
          allocatedTime: '2024-05-03T13:22:00',
        } as Allocation)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation: {
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
          plannedSuspension: {
            plannedBy: 'joebloggs',
            caseNoteId: 10001,
          },
          allocatedBy: 'GEOFFT',
          allocatedTime: '2024-05-03T13:22:00',
        },
        isOnlyPay: true,
        isStarted: true,
        pay: {
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1, alias: 'Low' },
          rate: 97,
          startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
        },
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: [],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
          ],
        },
        userMap: new Map([
          ['joebloggs', { username: 'joebloggs', name: 'Joe Bloggs' }],
          ['GEOFFT', { username: 'GEOFFT', name: 'Geoff Toms' }],
        ]),
        suspensionCaseNote: {
          text: 'test case note',
        },
      })
    })
  })
})
