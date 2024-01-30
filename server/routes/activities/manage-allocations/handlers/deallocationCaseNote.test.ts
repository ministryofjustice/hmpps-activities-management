import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import DeallocationCaseNoteRoutes, { DeallocationCaseNote } from './deallocationCaseNote'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Deallocation case note', () => {
  const handler = new DeallocationCaseNoteRoutes()

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { allocationId: 1 },
      session: {
        allocateJourney: {
          endDate: formatIsoDate(new Date()),
          deallocationReason: 'SECURITY',
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            activityId: 1,
            scheduleId: 1,
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-case-note')
    })
  })

  describe('POST', () => {
    it('redirect when form submitted', async () => {
      req.body = {
        type: 'GEN',
        text: 'Test case note',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationCaseNote.type).toEqual('GEN')
      expect(req.session.allocateJourney.deallocationCaseNote.text).toEqual('Test case note')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = { type: '', text: '' }

      const requestObject = plainToInstance(DeallocationCaseNote, body)
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

      const requestObject = plainToInstance(DeallocationCaseNote, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'type', error: 'Select the type of case note' }])
    })

    it('validation fails if the text is too long', async () => {
      const body = {
        type: 'GEN',
        text: 'T'.repeat(3801),
      }

      const requestObject = plainToInstance(DeallocationCaseNote, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'text', error: 'Case note must be 3800 characters or less' }])
    })
  })
})
