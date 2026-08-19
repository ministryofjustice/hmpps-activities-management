import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'
import getAttendanceCategoryFilter from './attendanceCategoryFilter'

describe('getAttendanceCategoryFilter', () => {
  it('should use SAA_ROTL as the filter value for outside work when the feature is enabled', () => {
    expect(getAttendanceCategoryFilter('Industries', true, true)).toEqual({
      value: ActivityCategoryEnum.SAA_ROTL,
      text: 'Outside activity',
    })
  })

  it('should retain the underlying category when the feature is not enabled', () => {
    expect(getAttendanceCategoryFilter('Industries', true, false)).toEqual({
      value: 'Industries',
      text: 'Industries',
    })
  })
})
