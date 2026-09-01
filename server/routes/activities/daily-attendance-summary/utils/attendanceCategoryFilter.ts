import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

export type ActivityCategoryFilter = {
  value: string
  text: string
}

const getAttendanceCategoryFilter = (
  categoryName: string,
  outsideWork: boolean,
  externalActivitiesRolledOut: boolean,
): ActivityCategoryFilter =>
  externalActivitiesRolledOut && outsideWork
    ? { value: ActivityCategoryEnum.SAA_ROTL, text: 'Outside activity' }
    : { value: categoryName, text: categoryName }

export default getAttendanceCategoryFilter
