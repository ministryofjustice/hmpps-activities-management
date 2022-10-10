import { getOtherEventsSummary } from './activityListHelper'
import activityListItem1 from '../../../services/fixtures/activity_list_item_1.json'

describe('activityListHelper', () => {
  describe('getOtherEventsSummary', () => {
    it('Success', async () => {
      const summary = getOtherEventsSummary(activityListItem1)
      expect(summary).toEqual(
        'Release scheduled, description1 , ' +
          'description2 (cancelled), description3 (expired), description4 (complete), description5 , ' +
          'description1 , description2 (cancelled), description3 (expired), description4 (complete), ' +
          'description5 , 13:15 - 16:15 - PICTA PM',
      )
    })
  })
})
