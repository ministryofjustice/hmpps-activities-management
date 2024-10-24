import { Request, Response } from 'express'
import { when } from 'jest-when'
import { ServiceUser } from '../../../../@types/express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import NonAssociationsRoutes from './nonAssociations'
import { Activity, ActivitySchedule, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import nonAssociations from '../../../../services/fixtures/non_associations.json'
// import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Non-associations page controller', () => {
  const user = {
    username: 'JSMITH1',
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  const controller = new NonAssociationsRoutes(prisonService, activitiesService)
  let req: Request
  let res: Response

  const prisoner = {
    prisonerNumber: 'ABC1234',
  } as Prisoner

  const activitySchedule1 = {
    id: 1,
    description: '',
    internalLocation: {
      id: 1,
      code: 'EDU-ROOM-1',
      description: 'Education - R1',
    },
    capacity: 10,
    activity: {
      id: 858,
      prisonCode: 'MDI',
      attendanceRequired: true,
      inCell: false,
      onWing: false,
      offWing: false,
    },
  } as unknown as ActivitySchedule
  const activitySchedule2 = {
    id: 1,
    description: '',
    internalLocation: {
      id: 1,
      code: 'EDU-ROOM-1',
      description: 'Education - R1',
    },
    capacity: 10,
    activity: {
      id: 58,
      prisonCode: 'MDI',
      attendanceRequired: true,
      inCell: false,
      onWing: false,
      offWing: false,
    },
  } as unknown as ActivitySchedule

  const mockActivity = {
    schedules: [{ id: 10 }],
    id: 1,
  } as unknown as Activity

  const mockActivity2 = {
    schedules: [activitySchedule1],
    id: 858,
  } as unknown as Activity

  const mockActivity3 = {
    schedules: [activitySchedule2],
    id: 58,
  } as unknown as Activity

  const naAllocations = [
    {
      prisonerNumber: 'G6512VC',
      allocations: [
        {
          activitySummary: 'Barbering A',
          activityId: 858,
          scheduleId: 837,
        },
      ],
    },
    {
      prisonerNumber: 'G6815UH',
      allocations: [
        {
          activitySummary: 'Box making',
          activityId: 58,
          scheduleId: 58,
        },
      ],
    },
  ] as unknown as PrisonerAllocations[]

  beforeEach(() => {
    res = {
      locals: { user },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      body: {},
      params: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls the relevant endpoints and render the njk with the correct data', async () => {
    req = {
      params: {
        prisonerNumber: 'ABC1234',
        activityId: '1',
      },
    } as unknown as Request

    when(activitiesService.getActivity).calledWith(1, user).mockResolvedValue(mockActivity)
    when(activitiesService.getActivity).calledWith(858, user).mockResolvedValue(mockActivity2)
    when(activitiesService.getActivity).calledWith(58, user).mockResolvedValue(mockActivity3)
    when(prisonService.getInmateByPrisonerNumber).calledWith('ABC1234', user).mockResolvedValue(prisoner)
    when(activitiesService.getNonAssociations).calledWith(10, 'ABC1234', user).mockResolvedValue(nonAssociations)
    when(activitiesService.getActivePrisonPrisonerAllocations).mockResolvedValue(naAllocations)

    await controller.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/non-associations/nonAssociations', {
      activity: mockActivity,
      prisoner,
      allocatedNonAssociations: [
        {
          allocated: true,
          reasonCode: 'BULLYING',
          reasonDescription: 'Bullying',
          roleCode: 'PERPETRATOR',
          roleDescription: 'Perpetrator',
          restrictionType: 'LANDING',
          restrictionTypeDescription: 'Cell and landing',
          otherPrisonerDetails: {
            prisonerNumber: 'G6512VC',
            firstName: 'IZRMONNTAS',
            lastName: 'ADALIE',
            cellLocation: 'A-N-2-24S',
          },
          whenUpdated: '2024-10-15T14:26:58',
          comments: 'Keep apart',
          allocations: [
            {
              activitySummary: 'Barbering A',
              activityId: 858,
              scheduleId: 837,
              schedule: {
                id: 1,
                description: '',
                internalLocation: {
                  id: 1,
                  code: 'EDU-ROOM-1',
                  description: 'Education - R1',
                },
                capacity: 10,
                activity: {
                  id: 858,
                  prisonCode: 'MDI',
                  attendanceRequired: true,
                  inCell: false,
                  onWing: false,
                  offWing: false,
                },
              },
            },
          ],
        },
      ],
      unallocatedNonAssociations: [
        {
          allocated: false,
          reasonCode: 'GANG_RELATED',
          reasonDescription: 'Gang related',
          roleCode: 'PERPETRATOR',
          roleDescription: 'Perpetrator',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Cell, landing and wing',
          otherPrisonerDetails: {
            prisonerNumber: 'G6815UH',
            firstName: 'UZFANAYE',
            lastName: 'ALANOINE',
            cellLocation: 'E-1-14S',
          },
          whenUpdated: '2024-08-08T12:37:16',
          comments:
            'Explain why these prisoners should be kept apart. Include any relevant IR numbers, if you have them.By saving these details, you confirm that, to the best of your knowledge, the information you have provided is correct. Plus 17 characters.!',
          allocations: [
            {
              activitySummary: 'Box making',
              activityId: 58,
              scheduleId: 58,
              schedule: {
                id: 1,
                description: '',
                internalLocation: {
                  id: 1,
                  code: 'EDU-ROOM-1',
                  description: 'Education - R1',
                },
                capacity: 10,
                activity: {
                  id: 58,
                  prisonCode: 'MDI',
                  attendanceRequired: true,
                  inCell: false,
                  onWing: false,
                  offWing: false,
                },
              },
            },
          ],
        },
      ],
    })
  })
  it('calls the relevant endpoints and render the njk with the correct data - NAs have no allocations', async () => {
    req = {
      params: {
        prisonerNumber: 'ABC1234',
        activityId: '1',
      },
    } as unknown as Request

    when(activitiesService.getActivity).calledWith(1, user).mockResolvedValue(mockActivity)
    when(prisonService.getInmateByPrisonerNumber).calledWith('ABC1234', user).mockResolvedValue(prisoner)
    when(activitiesService.getNonAssociations).calledWith(10, 'ABC1234', user).mockResolvedValue(nonAssociations)
    when(activitiesService.getActivePrisonPrisonerAllocations).mockResolvedValue([])

    await controller.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/non-associations/nonAssociations', {
      activity: mockActivity,
      prisoner,
      allocatedNonAssociations: [
        {
          allocated: true,
          reasonCode: 'BULLYING',
          reasonDescription: 'Bullying',
          roleCode: 'PERPETRATOR',
          roleDescription: 'Perpetrator',
          restrictionType: 'LANDING',
          restrictionTypeDescription: 'Cell and landing',
          otherPrisonerDetails: {
            prisonerNumber: 'G6512VC',
            firstName: 'IZRMONNTAS',
            lastName: 'ADALIE',
            cellLocation: 'A-N-2-24S',
          },
          whenUpdated: '2024-10-15T14:26:58',
          comments: 'Keep apart',
          allocations: [],
        },
      ],
      unallocatedNonAssociations: [
        {
          allocated: false,
          reasonCode: 'GANG_RELATED',
          reasonDescription: 'Gang related',
          roleCode: 'PERPETRATOR',
          roleDescription: 'Perpetrator',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Cell, landing and wing',
          otherPrisonerDetails: {
            prisonerNumber: 'G6815UH',
            firstName: 'UZFANAYE',
            lastName: 'ALANOINE',
            cellLocation: 'E-1-14S',
          },
          whenUpdated: '2024-08-08T12:37:16',
          comments:
            'Explain why these prisoners should be kept apart. Include any relevant IR numbers, if you have them.By saving these details, you confirm that, to the best of your knowledge, the information you have provided is correct. Plus 17 characters.!',
          allocations: [],
        },
      ],
    })
  })
  it('renders the njk with correct data when no NAs are present', async () => {
    req = {
      params: {
        prisonerNumber: 'ABC1234',
        activityId: '1',
      },
    } as unknown as Request

    when(activitiesService.getActivity).calledWith(1, user).mockResolvedValue(mockActivity)
    when(prisonService.getInmateByPrisonerNumber).calledWith('ABC1234', user).mockResolvedValue(prisoner)
    when(activitiesService.getNonAssociations).calledWith(10, 'ABC1234', user).mockResolvedValue([])
    when(activitiesService.getActivePrisonPrisonerAllocations).mockResolvedValue([])

    await controller.GET(req, res)

    expect(res.render).toHaveBeenCalledWith('pages/activities/non-associations/nonAssociations', {
      activity: mockActivity,
      prisoner,
      allocatedNonAssociations: [],
      unallocatedNonAssociations: [],
    })
  })
})
