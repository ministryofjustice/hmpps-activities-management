import getCategories from '../../../../integration_tests/fixtures/activitiesApi/getCategories.json'
import getActivities from '../../../../integration_tests/fixtures/activitiesApi/getActivities.json'
import getActivity from '../../../../integration_tests/fixtures/activitiesApi/getActivity.json'
import getPrisonRegime from '../../../../integration_tests/fixtures/activitiesApi/getPrisonRegime.json'
import moorlandPayBands from '../../../../integration_tests/fixtures/activitiesApi/getMdiPrisonPayBands.json'
import moorlandIncentiveLevels from '../../../../integration_tests/fixtures/incentivesApi/getMdiPrisonIncentiveLevels.json'
import educationLevels from '../../../../integration_tests/fixtures/prisonApi/educationLevels.json'
import studyAreas from '../../../../integration_tests/fixtures/prisonApi/studyAreas.json'
import getPayProfile from '../../../../integration_tests/fixtures/prisonApi/getPayProfile.json'
import getCategoriesIncludingRotl from '../../../../integration_tests/fixtures/activitiesApi/getCategoriesIncludingRotl.json'
import getNonResidentialActivityLocations from '../../../../integration_tests/fixtures/locationsinsideprison/non-residential-usage-activities.json'
import { stubEndpoint } from '../../../../integration_tests/mockApis/wiremock'

const stubCreateActivity = async (): Promise<void> => {
  await Promise.all([
    stubEndpoint('GET', '/activity-categories', getCategories),
    stubEndpoint('GET', '/activity-categories\\?includeRotl=true', getCategoriesIncludingRotl),
    stubEndpoint('GET', '/prison/prison-regime/MDI', getPrisonRegime),
    stubEndpoint('GET', '/prison/MDI/prison-pay-bands', moorlandPayBands),
    stubEndpoint('GET', '/prison/MDI/activities\\?excludeArchived=false', getActivities),
    stubEndpoint('GET', '/incentive/prison-levels/MDI', moorlandIncentiveLevels),
    stubEndpoint('GET', '/api/reference-domains/domains/EDU_LEVEL/codes', educationLevels),
    stubEndpoint('GET', '/api/reference-domains/domains/STUDY_AREA/codes', studyAreas),
    stubEndpoint(
      'GET',
      '/locations/non-residential/prison/MDI/service/PROGRAMMES_AND_ACTIVITIES\\?formatLocalName=true&filterParents=false',
      getNonResidentialActivityLocations,
    ),
    stubEndpoint('GET', '/api/agencies/MDI/pay-profile', getPayProfile),
    stubEndpoint('POST', '/activities', getActivity),
  ])
}

export default stubCreateActivity
