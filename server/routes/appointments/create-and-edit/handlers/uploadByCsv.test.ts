import { Request, Response } from 'express'
import UploadByCsv from './uploadByCsv'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'

describe('Route Handlers - Appointments - Upload by CSV', () => {
  const handler = new UploadByCsv()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.CREATE,
          type: AppointmentType.GROUP,
        },
      },
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render upload by CSV view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/upload-prisoners-by-csv', {
        preserveHistory: undefined,
      })
    })

    it('should render upload by CSV view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/upload-prisoners-by-csv', {
        preserveHistory: 'true',
      })
    })
  })

  describe('POST', () => {
    it('should redirect to upload prisoner list', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('upload-prisoner-list')
    })
  })
})
