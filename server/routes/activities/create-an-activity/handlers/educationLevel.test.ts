import { Request, Response } from 'express'

import { when } from 'jest-when'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import { ReferenceCode } from '../../../../@types/prisonApiImport/types'
import EducationLevelRoutes, { EducationLevel } from './educationLevel'
import atLeast from '../../../../../jest.setup'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const studyAreas: ReferenceCode[] = [
  {
    domain: 'STUDY_AREA',
    code: 'ENGLA',
    description: 'English Language',
    activeFlag: 'Y',
    listSeq: 99,
    systemDataFlag: 'N',
  },
  {
    domain: 'STUDY_AREA',
    code: 'ENGI',
    description: 'Engineering',
    activeFlag: 'Y',
    listSeq: 99,
    systemDataFlag: 'N',
  },
]

const educationLevels: ReferenceCode[] = [
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
]

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
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          incentiveLevels: ['Basic', 'Standard'],
          educationLevels: [
            {
              educationLevelCode: '1',
              educationLevelDescription: 'Reading Measure 1.0',
              studyAreaCode: 'ENGLA',
              studyAreaDescription: 'English Language',
            },
          ],
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
      when(prisonService.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(educationLevels)
      when(prisonService.getReferenceCodes).calledWith(atLeast('STUDY_AREA')).mockResolvedValue(studyAreas)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/education-level', {
        eduLevels: [
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
        studyAreas: [
          {
            domain: 'STUDY_AREA',
            code: 'ENGLA',
            description: 'English Language',
            activeFlag: 'Y',
            listSeq: 99,
            systemDataFlag: 'N',
          },
          {
            domain: 'STUDY_AREA',
            code: 'ENGI',
            description: 'Engineering',
            activeFlag: 'Y',
            listSeq: 99,
            systemDataFlag: 'N',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save selected education level in session and redirect to check education levels page', async () => {
      req.body = {
        eduLevelCode: '1.1',
        studyAreaCode: 'ENGLA',
      }

      when(prisonService.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(educationLevels)
      when(prisonService.getReferenceCodes).calledWith(atLeast('STUDY_AREA')).mockResolvedValue(studyAreas)

      await handler.POST(req, res)

      expect(req.session.createJourney.educationLevels).toEqual([
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
          studyAreaCode: 'ENGLA',
          studyAreaDescription: 'English Language',
        },
        {
          educationLevelCode: '1.1',
          educationLevelDescription: 'Reading Measure 1.1',
          studyAreaCode: 'ENGLA',
          studyAreaDescription: 'English Language',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-education-level')
    })

    it('should fail validation if invalid education level code provide', async () => {
      req.body = {
        eduLevelCode: 'INVALID',
        studyAreaCode: 'ENGLA',
      }

      when(prisonService.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(educationLevels)
      when(prisonService.getReferenceCodes).calledWith(atLeast('STUDY_AREA')).mockResolvedValue(studyAreas)

      await handler.POST(req, res)

      expect(req.session.createJourney.educationLevels).toEqual([
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
          studyAreaCode: 'ENGLA',
          studyAreaDescription: 'English Language',
        },
      ])
      expect(res.validationFailed).toHaveBeenCalledWith('eduLevelCode', 'Education not found')
    })

    it('should fail validation if invalid study area code provide', async () => {
      req.body = {
        eduLevelCode: '1.1',
        studyAreaCode: 'INVALID',
      }

      when(prisonService.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(educationLevels)
      when(prisonService.getReferenceCodes).calledWith(atLeast('STUDY_AREA')).mockResolvedValue(studyAreas)

      await handler.POST(req, res)

      expect(req.session.createJourney.educationLevels).toEqual([
        {
          educationLevelCode: '1',
          educationLevelDescription: 'Reading Measure 1.0',
          studyAreaCode: 'ENGLA',
          studyAreaDescription: 'English Language',
        },
      ])
      expect(res.validationFailed).toHaveBeenCalledWith('eduLevelCode', 'Education not found')
    })
  })

  describe('Validation', () => {
    it('validation fails when study area not provided', async () => {
      const body = {
        eduLevelCode: '1.1',
        createJourney: {},
      }

      const requestObject = plainToInstance(EducationLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select a subject or skill', property: 'studyAreaCode' }]),
      )
    })

    it('validation fails when education level not provided', async () => {
      const body = {
        studyAreaCode: 'ENGLA',
        createJourney: {},
      }

      const requestObject = plainToInstance(EducationLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an education level', property: 'eduLevelCode' }]))
    })

    it('validation fails when education already existing on activity', async () => {
      const body = {
        studyAreaCode: 'ENGLA',
        eduLevelCode: '1.1',
        createJourney: {
          educationLevels: [
            {
              studyAreaCode: 'ENGLA',
              studyAreaDescription: 'English Language',
              educationLevelCode: '1.1',
              educationLevelDescription: 'Reading Measure 1.1',
            },
          ],
        },
      }

      const requestObject = plainToInstance(EducationLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter a different education level or qualification. This one has already been added',
            property: 'eduLevelCode',
          },
        ]),
      )
    })
  })
})
