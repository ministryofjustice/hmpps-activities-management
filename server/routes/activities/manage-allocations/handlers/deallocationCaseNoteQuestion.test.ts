import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import DeallocationCaseNoteQuestionRoutes, { DeallocationCaseNoteQuestion } from './deallocationCaseNoteQuestion'

describe('Route Handlers - Deallocation case note question', () => {
  const handler = new DeallocationCaseNoteQuestionRoutes()

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
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-case-note-question')
    })
  })

  describe('POST', () => {
    it('redirect to check-answers when `yes` submitted', async () => {
      req.body = {
        choice: 'yes',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('case-note')
    })

    it('redirect to check-answers when `no` submitted', async () => {
      req.body = {
        choice: 'no',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = { choice: '' }

      const requestObject = plainToInstance(DeallocationCaseNoteQuestion, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'choice', error: 'Select either yes or no' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        choice: 'bad value',
      }

      const requestObject = plainToInstance(DeallocationCaseNoteQuestion, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'choice', error: 'Select either yes or no' }])
    })
  })
})
