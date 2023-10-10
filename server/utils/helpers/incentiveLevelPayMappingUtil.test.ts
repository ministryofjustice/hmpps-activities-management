// import { Request } from 'express'
//
// import { when } from 'jest-when'
// import IncentiveLevelPayMappingUtil from './incentiveLevelPayMappingUtil'
// import PrisonService from '../../services/prisonService'
// import { ServiceUser } from '../../@types/express'
// import atLeast from '../../../jest.setup'
// import { IncentiveLevel } from '../../@types/incentivesApi/types'
//
// jest.mock('../../../services/prisonService')
//
// const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
//
// describe('Route Handlers - Create an activity - Helper', () => {
//   const helper = new IncentiveLevelPayMappingUtil(prisonService)
//   let req: Request
//   let user: ServiceUser
//
//   beforeEach(() => {
//     req = {
//       session: {
//         createJourney: {
//           pay: [
//             { incentiveLevel: 'Standard', bandId: 2, rate: 200, displaySequence: 2 },
//             { incentiveLevel: 'Standard', bandId: 1, rate: 100, displaySequence: 1 },
//             { incentiveLevel: 'Basic', bandId: 3, rate: 300, displaySequence: 3 },
//             { incentiveLevel: 'Enhanced', bandId: 4, rate: 400, displaySequence: 4 },
//           ],
//           allocations: [],
//         },
//       },
//     } as Request
//
//     user = {
//       username: 'joebloggs',
//       activeCaseLoadId: 'MDI',
//     } as ServiceUser
//   })
//
//   afterEach(() => {
//     jest.resetAllMocks()
//   })
//
//   describe('getPayGroupedByIncentiveLevel', () => {
//     it('should group pay by incentive level', async () => {
//       when(prisonService.getIncentiveLevels)
//         .calledWith(atLeast('MDI'))
//         .mockResolvedValue([
//           { levelName: 'Basic' },
//           { levelName: 'Standard' },
//           { levelName: 'Enhanced' },
//         ] as IncentiveLevel[])
//
//       const result = await helper.getPayGroupedByIncentiveLevel(
//         req.session.createJourney.pay,
//         req.session.createJourney.allocations,
//         user,
//       )
//       expect(result).toEqual([
//         { incentiveLevel: 'Basic', pays: [{ incentiveLevel: 'Basic', bandId: 3, rate: 300, displaySequence: 3 }] },
//         {
//           incentiveLevel: 'Standard',
//           pays: [
//             { incentiveLevel: 'Standard', bandId: 1, rate: 100, displaySequence: 1 },
//             { incentiveLevel: 'Standard', bandId: 2, rate: 200, displaySequence: 2 },
//           ],
//         },
//         {
//           incentiveLevel: 'Enhanced',
//           pays: [{ incentiveLevel: 'Enhanced', bandId: 4, rate: 400, displaySequence: 4 }],
//         },
//       ])
//     })
//   })
// })
