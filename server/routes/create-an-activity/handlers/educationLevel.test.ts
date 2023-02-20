import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../services/prisonService'
import { associateErrorsWithProperty } from '../../../utils/utils'
import { ReferenceCode } from '../../../@types/prisonApiImport/types'
import EducationLevelRoutes, { EducationLevel } from './educationLevel'
import educationLevels from '../../../services/fixtures/education_levels_1.json'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Education Level', () => {
  const handler = new EducationLevelRoutes(prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          incentiveLevels: ['Basic', 'Standard'],
        },
      },
    } as unknown as Request

    when(prisonService.getReferenceCodes).mockResolvedValue([
      { code: '1', description: 'Reading Measure 1.0' },
      { code: '1.1', description: 'Reading Measure 1.1' },
    ] as ReferenceCode[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(prisonService.getReferenceCodes).mockResolvedValue(educationLevels)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/education-level', {
        referenceCodes: [
          {
            domain: 'EDU_LEVEL',
            code: '1',
            description: 'Reading Measure 1.0',
            parentCode: 'STL',
            activeFlag: 'Y',
            listSeq: 6,
            systemDataFlag: 'N',
            subCodes: [],
          },
          {
            domain: 'EDU_LEVEL',
            code: '1.1',
            description: 'Reading Measure 1.1',
            parentCode: 'STL',
            activeFlag: 'Y',
            listSeq: 6,
            systemDataFlag: 'N',
            subCodes: [],
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save selected education level in session and redirect to check education levels page', async () => {
      req.body = {
        referenceCode: '1',
      }

      when(prisonService.getReferenceCodes).mockResolvedValue(educationLevels)

      await handler.POST(req, res)

      expect(req.session.createJourney.educationLevels).toEqual([
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-education-level')
    })
  })

  describe('education level validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(EducationLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'referenceCode', error: 'Select an education level' }]),
      )
    })
  })
})
