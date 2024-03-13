import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CaseNoteRoutes, { CaseNote } from './caseNote'

describe('Route Handlers - Suspensions - Case note', () => {
  const handler = new CaseNoteRoutes()
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/case-note')
    })
  })

  describe('POST', () => {
    it('should populate the case note and redirect', async () => {
      req.body = {
        type: 'GEN',
        text: 'Test case note',
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.caseNote.type).toEqual('GEN')
      expect(req.session.suspendJourney.caseNote.text).toEqual('Test case note')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = { type: '', text: '' }

      const requestObject = plainToInstance(CaseNote, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'type', error: 'Select the type of case note' },
        { property: 'text', error: 'Enter a case note' },
      ])
    })

    it('validation fails if a bad value is entered for type', async () => {
      const body = {
        type: 'bad value',
        text: 'Test case note',
      }

      const requestObject = plainToInstance(CaseNote, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'type', error: 'Select the type of case note' }])
    })

    it('validation fails if the text is too long', async () => {
      const body = {
        type: 'GEN',
        text: 'T'.repeat(3801),
      }

      const requestObject = plainToInstance(CaseNote, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'text', error: 'Case note must be 3800 characters or less' }])
    })
  })
})
