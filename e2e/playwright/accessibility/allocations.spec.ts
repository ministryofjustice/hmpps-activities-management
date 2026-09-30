import { accessibilityArea } from './support/run'
import { allocationJourney, stubAllocations } from './support/allocations'

accessibilityArea('activities/manage-allocations', stubAllocations, allocationJourney)
accessibilityArea('activities/exclusions', stubAllocations)
accessibilityArea('activities/non-associations', stubAllocations)
