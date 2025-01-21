import ActivitiesService from "../../../../services/activitiesService";
import PrisonService from "../../../../services/prisonService";
import RefusedSessionsRoutes from "./refusals";

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>


describe('Refusals list', () => {
      const handler = new RefusedSessionsRoutes(activitiesService, prisonService)
      let req: Request
      let res: Response
    
      beforeEach(() => {
        res = {
          locals: {
            username: 'joebloggs',
          },
          render: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response
    
        req = { session: {}, query: {} } as unknown as Request
      })
    describe('', () => {
        it('', () => {
            
        })
    })
})