import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import EditStatusRoutes, { EditStatus } from './editStatus'
import config from '../../../../../config'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../config')

const activitiesService = new ActivitiesService(null)
const fakeWaitlistApplicationJourneyData = { prisoner: { name: 'Alan Key' } }

const enableWaitlistWithdrawn = (enabled: boolean) => {
  ;(config as jest.Mocked<typeof config>).waitlistWithdrawnEnabled = enabled
}

describe('Route Handlers - Waitlist application - Edit Status', () => {
  const handler = new EditStatusRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { applicationId: 1 },
      journeyData: { waitListApplicationJourney: fakeWaitlistApplicationJourneyData },
    } as unknown as Request
  })

  describe('GET', () => {
    beforeEach(() => {
      enableWaitlistWithdrawn(false)
    })

    it('should render the edit status page template when feature-flag is disabled', async () => {
      enableWaitlistWithdrawn(false)
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-status`, {
        WaitingListStatus: {
          PENDING: 'PENDING',
          APPROVED: 'APPROVED',
          DECLINED: 'DECLINED',
          ALLOCATED: 'ALLOCATED',
        },
        WaitingListStatusDescriptions: {
          APPROVED: `Add the applicant to the waitlist. They're ready to be allocated.`,
          DECLINED: `Reject the application and inform the person concerned.`,
          PENDING: `Add the applicant to the waitlist as 'Pending'. Follow your usual procedure to check if they can be allocated.`,
          WITHDRAWN: `will be removed from the waitlist.`,
        },
        prisonerName: 'Alan Key',
        waitlistWithdrawnEnabled: false,
      })
    })

    it('should render the edit status with withdrawn page template when the feature-flag is enabled', async () => {
      enableWaitlistWithdrawn(true)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-status-with-withdrawn`, {
        WaitingListStatusWithWithdrawn: {
          ALLOCATED: 'ALLOCATED',
          APPROVED: 'APPROVED',
          PENDING: 'PENDING',
          DECLINED: 'DECLINED',
          WITHDRAWN: 'WITHDRAWN',
        },
        WaitingListStatusDescriptions: {
          APPROVED: `Add the applicant to the waitlist. They're ready to be allocated.`,
          DECLINED: `Reject the application and inform the person concerned.`,
          PENDING: `Add the applicant to the waitlist as 'Pending'. Follow your usual procedure to check if they can be allocated.`,
          WITHDRAWN: `will be removed from the waitlist.`,
        },
        prisonerName: 'Alan Key',
        waitlistWithdrawnEnabled: true,
      })
    })
  })

  describe('POST', () => {
    it('should patch the application with the new status and redirect', async () => {
      req.body = {
        status: 'PENDING',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { status: 'PENDING' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the status of Alan Key's application`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        status: 'bad value',
      }

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation passes', async () => {
      const body = {
        status: 'PENDING',
      }

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })
  })
})
