import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CaseNoteQuestionRoutes, { CaseNoteQuestion } from './caseNoteQuestion'

describe('Route Handlers - Suspensions - Case note question', () => {
  const handler = new CaseNoteQuestionRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      query: {},
      session: { suspendJourney: {} },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/case-note-question')
    })
  })

  describe('POST', () => {
    it('should redirect to case note page if choice is yes', async () => {
      req.body = {
        choice: 'yes',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('case-note')
    })

    it('should redirect to check answers if choice is no', async () => {
      req.session.suspendJourney.caseNote = {
        type: 'GEN',
        text: 'test',
      }

      req.body = {
        datePresetOption: 'no',
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.caseNote).toEqual(null)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('Validation', () => {
    it('choice cannot be left blank', async () => {
      const body = {}

      const requestObject = plainToInstance(CaseNoteQuestion, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'choice', error: 'Select either yes or no' }]))
    })

    it('choice cannot be an unknown value', async () => {
      const body = {
        choice: 'unknown',
      }

      const requestObject = plainToInstance(CaseNoteQuestion, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'choice', error: 'Select either yes or no' }]))
    })

    it('passes', async () => {
      const body = {
        choice: 'yes',
      }

      const requestObject = plainToInstance(CaseNoteQuestion, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
