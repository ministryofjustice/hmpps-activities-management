# Application screen inventory

Generated from `e2e/playwright/accessibility/screens.json`. Edit that file and run `node e2e/scripts/screen-inventory.mjs`.
Headings are the expected stable text in the page’s accessible level-one heading. Dynamic date suffixes are omitted.
Each row represents a page template. Shared create/edit templates use one representative route and state;
journey tests cover the other behaviours. Partials and layouts are checked through their owning screens.

## activities/administration

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/administration/add-prison-pay-band | `/activities/admin/add-prison-pay-band` | Create a prison pay band | covered |
| activities/administration/admin | `/activities/admin` | Activities Administration | covered |
| activities/administration/appointment-preview | `/activities/admin/appointment-preview?fromDate=2030-01-01&categories=CHAP` | Appointment deletion preview | covered |
| activities/administration/appointment-summary | `/activities/admin/appointment-summary` | Set up appointments to be deleted | covered |
| activities/administration/prison-pay-bands | `/activities/admin/prison-pay-bands` | Prison Pay Bands (maximum of 10) | covered |
| activities/administration/regime-times | `/activities/admin/regime` | Amend the start and end times for the prison regime schedule | covered |
| activities/administration/update-prison-pay-band | `/activities/admin/update-prison-pay-band/11` | Update a prison pay band | covered |

## activities/allocation-dashboard

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/allocation-dashboard/activities | `/activities/allocation-dashboard/` | Allocation dashboard | covered |
| activities/allocation-dashboard/allocation-dashboard | `/activities/allocation-dashboard/2` | Entry level English 1 | covered |

## activities/change-of-circumstances

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/change-of-circumstances/select-period | `/activities/change-of-circumstances/select-period` | Select a date to review changes | covered |
| activities/change-of-circumstances/view-events | `/activities/change-of-circumstances/view-changes?date=2023-05-16` | Changes in circumstances | covered |

## activities/create-an-activity

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/create-an-activity/activity-type | `/activities/create/:journeyId/activity-type` | Does the activity take place inside or outside the prison grounds? | covered |
| activities/create-an-activity/attendance-required | `/activities/create/:journeyId/attendance-required` | Should attendance be recorded for this activity? | covered |
| activities/create-an-activity/bank-holiday-option | `/activities/create/:journeyId/bank-holiday-option` | Does this activity run on bank holidays? | covered |
| activities/create-an-activity/capacity | `/activities/create/:journeyId/capacity` | How many people can be allocated to this activity? | covered |
| activities/create-an-activity/category | `/activities/create/:journeyId/category` | Select a category for the new activity | covered |
| activities/create-an-activity/check-answers | `/activities/create/:journeyId/check-answers` | Check details for English level 1 | covered |
| activities/create-an-activity/check-education-level | `/activities/create/:journeyId/check-education-level` | Review education levels and qualifications | covered |
| activities/create-an-activity/check-pay | `/activities/create/:journeyId/check-pay` | Review pay rates for English level 1 | covered |
| activities/create-an-activity/confirm-capacity | `/activities/create/:journeyId/confirm-capacity` | This activity will be overallocated | covered |
| activities/create-an-activity/confirmation | `/activities/create/:journeyId/confirmation/2` | You've created a new activity: English level 1 | covered |
| activities/create-an-activity/custom-times-change-default-or-custom | `/activities/edit/2/:journeyId/custom-times-change-default-or-custom/1` | Select how to change the activity start and end times | covered |
| activities/create-an-activity/custom-times-change-option | `/activities/create/:journeyId/custom-times-change-option/1` | Select what you want to change in this activity’s schedule | covered |
| activities/create-an-activity/days-and-times | `/activities/create/:journeyId/days-and-times/1` | Select the days and sessions when this activity runs | covered |
| activities/create-an-activity/edit-pay | `/activities/edit/2/:journeyId/check-pay` | Review pay rates | covered |
| activities/create-an-activity/education-level | `/activities/create/:journeyId/education-level` | Select education levels and qualifications | covered |
| activities/create-an-activity/end-date | `/activities/create/:journeyId/end-date` | Enter the end date for this activity | covered |
| activities/create-an-activity/end-date-option | `/activities/create/:journeyId/end-date-option` | Do you want to enter an end date for this activity? | covered |
| activities/create-an-activity/location | `/activities/create/:journeyId/location` | Where does this activity take place? | covered |
| activities/create-an-activity/name | `/activities/create/:journeyId/name` | What's the new activity called? | covered |
| activities/create-an-activity/organiser | `/activities/create/:journeyId/organiser` | Who leads or organises this activity? | covered |
| activities/create-an-activity/pay | `/activities/create/:journeyId/pay/single?iep=Standard&bandId=11` | Enter pay amount and pay band name for the Standard incentive level pay rate | covered |
| activities/create-an-activity/pay-amount | `/activities/create/:journeyId/pay-amount/single?iep=Standard&bandId=11` | Change Standard incentive level: Low | covered |
| activities/create-an-activity/pay-cancel | `/activities/create/:journeyId/pay-cancel/single?iep=Standard&bandId=11` | Are you sure you want to cancel the change to Standard: Low ? | covered |
| activities/create-an-activity/pay-date-option | `/activities/create/:journeyId/pay-date-option/single?iep=Standard&bandId=11` | When does the change to Standard: Low take effect? | covered |
| activities/create-an-activity/pay-option | `/activities/create/:journeyId/pay-option` | Will people be paid for attending this activity? | covered |
| activities/create-an-activity/pay-rate-type | `/activities/create/:journeyId/pay-rate-type` | Choose what kind of pay rate you want to set up for this activity | covered |
| activities/create-an-activity/qualification | `/activities/create/:journeyId/qualification` | Do people allocated to this activity need certain education levels or other qualifications? | covered |
| activities/create-an-activity/remove-end-date | `/activities/create/:journeyId/remove-end-date` | Select if you want to change or remove this activity's end date | covered |
| activities/create-an-activity/remove-pay | `/activities/create/:journeyId/remove-pay?iep=Standard&bandId=11` | Are you sure you want to remove this pay rate? | covered |
| activities/create-an-activity/risk-level | `/activities/create/:journeyId/risk-level` | Workplace risk assessment levels: who is suitable for this activity? | covered |
| activities/create-an-activity/run-session-today | `/activities/create/:journeyId/run-session-today` | Do you want the Monday AM session to run today? | covered |
| activities/create-an-activity/schedule-frequency | `/activities/create/:journeyId/schedule-frequency` | How often do you want the schedule to repeat? | covered |
| activities/create-an-activity/session-times | `/activities/create/:journeyId/session-times` | Select the start and end times for the sessions when this activity runs | covered |
| activities/create-an-activity/session-times-option | `/activities/create/:journeyId/session-times-option/1` | Do sessions of this activity follow the prison's regime times? | covered |
| activities/create-an-activity/start-date | `/activities/create/:journeyId/start-date` | Enter the start date for this activity | covered |
| activities/create-an-activity/tier | `/activities/create/:journeyId/tier` | Select a tier for the new activity | covered |
| activities/create-an-activity/who-pays | `/activities/create/:journeyId/who-pays` | Who pays prisoners for this activity? | covered |

## activities/daily-attendance-summary

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/daily-attendance-summary/attendances | `/activities/attendance-summary/:journeyId/attendance?date=2023-05-16&status=Attended` | All attended Tuesday, 16 May 2023 | covered |
| activities/daily-attendance-summary/cancelled-sessions | `/activities/attendance-summary/:journeyId/cancelled-sessions?date=2023-05-16&status=Attended` | Cancelled sessions Tuesday, 16 May 2023 | covered |
| activities/daily-attendance-summary/daily-summary | `/activities/attendance-summary/:journeyId/summary?date=2023-05-16&status=Attended` | Daily attendance summary | covered |
| activities/daily-attendance-summary/refusals | `/activities/attendance-summary/:journeyId/refusals?date=2023-05-16&status=Attended` | All refusals to attend Tuesday, 16 May 2023 | covered |
| activities/daily-attendance-summary/select-period | `/activities/attendance-summary/:journeyId/select-period` | What date do you want to see the daily attendance summary for? | covered |
| activities/daily-attendance-summary/suspended-prisoners | `/activities/attendance-summary/:journeyId/suspended-prisoners?date=2023-05-16&status=Attended` | Prisoners suspended or temporarily absent Tuesday, 16 May 2023 | covered |

## activities/exclusions

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/exclusions/select-prisoner | `/activities/exclusions/select-prisoner` | Find whose schedule you want to change | covered |
| activities/exclusions/view-allocations | `/activities/exclusions/prisoner/A5015DY` | Alfonso Cholak's activities | covered |

## activities/home

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/home/home | `/activities/` | Activities, unlock and attendance | covered |

## activities/manage-activities

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/manage-activities/activities-dashboard | `/activities/dashboard` | Activities dashboard | covered |
| activities/manage-activities/view-activity | `/activities/view/2` | Edit activity details | covered |

## activities/manage-allocations

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/manage-allocations/addToSessionsToday | `/activities/allocations/edit/1/:journeyId/addToToday` | Do you want to add Alfonso Cholak to today's AM session? | covered |
| activities/manage-allocations/allocateMultiplePeople/activityRequirementsReview | `/activities/allocations/create/:journeyId/multiple/activity-requirements-review` | Review 1 person who does not meet activity requirements | covered |
| activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple | `/activities/allocations/create/:journeyId/multiple/check-answers` | Check and confirm 1 allocation | covered |
| activities/manage-allocations/allocateMultiplePeople/confirmation | `/activities/allocations/create/:journeyId/multiple/confirmation` | Allocations complete | covered |
| activities/manage-allocations/allocateMultiplePeople/fromActivityList | `/activities/allocations/create/:journeyId/multiple/from-activity-list` | Search for an activity to get the list of people allocated to it | covered |
| activities/manage-allocations/allocateMultiplePeople/payBandMultiple | `/activities/allocations/create/:journeyId/multiple/pay-band-multiple` | Select the pay rate for one person | covered |
| activities/manage-allocations/allocateMultiplePeople/reviewSearchPrisonerList | `/activities/allocations/create/:journeyId/multiple/review-search-prisoner-list` | Review who you're allocating | covered |
| activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList | `/activities/allocations/create/:journeyId/multiple/review-upload-prisoner-list` | Review who you're allocating | covered |
| activities/manage-allocations/allocateMultiplePeople/selectPrisoner | `/activities/allocations/create/:journeyId/multiple/select-prisoner` | Who do you want to allocate? | covered |
| activities/manage-allocations/allocateMultiplePeople/setUpPrisonerListMethod | `/activities/allocations/create/:journeyId/multiple/set-up-method` | How do you want to set up a list of people to allocate? | covered |
| activities/manage-allocations/allocateMultiplePeople/uploadPrisonerList | `/activities/allocations/create/:journeyId/multiple/upload-prisoner-list` | Upload your list of prison numbers | covered |
| activities/manage-allocations/allocation-error | `/activities/allocations/create/:journeyId/error/already-allocated` | Alfonso Cholak cannot be allocated at the moment | covered |
| activities/manage-allocations/before-you-allocate | `/activities/allocations/create/:journeyId/before-you-allocate` | Before you allocate Alfonso Cholak | covered |
| activities/manage-allocations/cancel | `/activities/allocations/create/:journeyId/cancel` | Are you sure you want to cancel this allocation? | covered |
| activities/manage-allocations/check-answers | `/activities/allocations/create/:journeyId/check-answers` | Check and confirm this allocation | covered |
| activities/manage-allocations/choose-end-date-option | `/activities/allocations/edit/1/:journeyId/choose-end-date-option` | Do you want to change or remove the end date of Alfonso Cholak’s allocation? | covered |
| activities/manage-allocations/confirm-deallocation-if-existing | `/activities/allocations/remove/:journeyId/confirm-deallocation-if-existing?allocationIds=1` | Do you want to change the end date for this allocation? | covered |
| activities/manage-allocations/confirm-exclusions | `/activities/allocations/edit/1/:journeyId/confirm-exclusions` | Check changes to when Alfonso Cholak should attend English level 1 | covered |
| activities/manage-allocations/confirmation | `/activities/allocations/create/:journeyId/confirmation` | Allocation complete | covered |
| activities/manage-allocations/deallocate-today-option | `/activities/allocations/remove/:journeyId/deallocate-today-option` | When do you want Alfonso Cholak's allocation to end? | covered |
| activities/manage-allocations/deallocation-case-note | `/activities/allocations/remove/:journeyId/case-note` | Add a case note for Alfonso Cholak | covered |
| activities/manage-allocations/deallocation-case-note-question | `/activities/allocations/remove/:journeyId/case-note-question` | Do you want to add a case note about why Alfonso Cholak is being removed? | covered |
| activities/manage-allocations/deallocation-reason | `/activities/allocations/remove/:journeyId/reason` | Why are you taking Alfonso Cholak off this activity? | covered |
| activities/manage-allocations/deallocation-reason-option | `/activities/allocations/edit/1/:journeyId/reason-option` | Do you want to change the reason for Alfonso Cholak’s allocation ending? | covered |
| activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm | `/activities/allocations/remove/:journeyId/deallocation-check-and-confirm` | Check and confirm taking Alfonso Cholak off English level 1 | covered |
| activities/manage-allocations/deallocationAfterAllocation/deallocation-date | `/activities/allocations/remove/:journeyId/deallocate-after-allocation-date` | When do you want them to be taken off English level 1? | covered |
| activities/manage-allocations/deallocationAfterAllocation/deallocation-select-activities | `/activities/allocations/remove/:journeyId/deallocation-select-activities` | Select the activities you want to take Alfonso Cholak off | covered |
| activities/manage-allocations/end-date | `/activities/allocations/create/:journeyId/end-date` | When do you want Alfonso Cholak to attend their last session of English level 1? | covered |
| activities/manage-allocations/end-date-option | `/activities/allocations/create/:journeyId/end-date-option` | Do you want to set an end date for this allocation? | covered |
| activities/manage-allocations/end-decision | `/activities/allocations/remove/:journeyId/end-decision` | Select how you want to end Alfonso Cholak's allocation for this activity | covered |
| activities/manage-allocations/exclusions | `/activities/allocations/create/:journeyId/exclusions` | Change Alfonso Cholak's scheduled sessions for this activity | covered |
| activities/manage-allocations/home | `/activities/allocations` | Allocate people to activities | covered |
| activities/manage-allocations/pay-band | `/activities/allocations/create/:journeyId/pay-band` | Select Alfonso Cholak's pay rate | covered |
| activities/manage-allocations/remove-date-option | `/activities/allocations/create/:journeyId/remove-end-date-option` | Do you want to change or remove the end date for this allocation? | covered |
| activities/manage-allocations/start-date | `/activities/allocations/create/:journeyId/start-date` | When do you want Alfonso Cholak to start attending this activity? | covered |
| activities/manage-allocations/view-allocation | `/activities/allocations/view/1` | Change allocation details for Alfonso Cholak (A5015DY) | covered |

## activities/movement-list

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/movement-list/choose-details | `/activities/movement-list/:journeyId/choose-details` | Choose movement list details | covered |
| activities/movement-list/location-events | `/activities/movement-list/:journeyId/location-events?dateOption=today&timeSlot=AM&isOutside=true` | Outside - movement list | covered |
| activities/movement-list/locations | `/activities/movement-list/:journeyId/locations?dateOption=today&timeSlot=AM` | Locations people are going to in this session | covered |

## activities/non-associations

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/non-associations/nonAssociations | `/activities/non-associations/2/A5015DY` | Alfonso Cholak’s non-associations | covered |

## activities/prisoner-allocations

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/prisoner-allocations/activity-search | `/activities/prisoner-allocations/A5015DY/select-activity` | Search for the activity | covered |
| activities/prisoner-allocations/dashboard | `/activities/prisoner-allocations/A5015DY` | Alfonso Cholak's activity allocations | covered |
| activities/prisoner-allocations/non-associations | `/activities/prisoner-allocations/A5015DY/non-associations` | Alfonso Cholak's non-associations | covered |
| activities/prisoner-allocations/pending-application | `/activities/prisoner-allocations/allocate/A5015DY/:journeyId/pending-application` | Alfonso Cholak’s application | covered |
| activities/prisoner-allocations/waitlist-options | `/activities/prisoner-allocations/allocate/A5015DY/:journeyId/waitlist-allocation` | Select an activity to allocate Alfonso Cholak | covered |

## activities/record-attendance

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/record-attendance/activities | `/activities/attendance/:journeyId/activities` | Find an activity to record or edit attendance | covered |
| activities/record-attendance/advance-attendance-change-pay | `/activities/attendance/:journeyId/activities/93/advance-attendance-details/1/change-pay` | Confirm that Booking Andy should not be paid for this session? | covered |
| activities/record-attendance/advance-attendance-details | `/activities/attendance/:journeyId/activities/93/advance-attendance-details/1` | Attendance record for Booking Andy | covered |
| activities/record-attendance/attend-all/choose-details-by-activity | `/activities/attendance/:journeyId/attend-all/choose-details-by-activity` | Choose details to record attendance | covered |
| activities/record-attendance/attend-all/choose-details-by-activity-location | `/activities/attendance/:journeyId/attend-all/choose-details-by-activity-location` | Choose details to record attendance | covered |
| activities/record-attendance/attend-all/choose-details-by-residential-location | `/activities/attendance/:journeyId/attend-all/choose-details-by-residential-location` | Choose details to record attendance | covered |
| activities/record-attendance/attend-all/how-to-record-attendance | `/activities/attendance/:journeyId/attend-all/how-to-record-attendance` | Select how you want to record attendance | covered |
| activities/record-attendance/attend-all/list-activities | `/activities/attendance/:journeyId/attend-all/list-activities?locationType=IN_CELL` | In cell activities - record or edit attendance | covered |
| activities/record-attendance/attend-all/multiple-not-attended-reason | `/activities/attendance/:journeyId/attend-all/multiple-not-attended-reason` | Select the reason why Booking Andy did not attend | covered |
| activities/record-attendance/attend-all/no-activities-for-selection | `/activities/attendance/:journeyId/attend-all/select-people-to-record-attendance-for?activityId=2&timePeriods=PM` | English level 1 did not run in the PM session on | covered |
| activities/record-attendance/attend-all/select-attended | `/activities/attendance/:journeyId/attend-all/select-attended` | Select the activities that Booking Andy attended | covered |
| activities/record-attendance/attend-all/select-not-required | `/activities/attendance/:journeyId/attend-all/select-not-required` | Confirm details for Booking Andy who is not required | covered |
| activities/record-attendance/attend-all/select-people-by-residential-location | `/activities/attendance/:journeyId/attend-all/select-people-by-residential-location?locationKey=Houseblock 1&sessionFilters=PM` | Record activity attendance for Houseblock 1 - record or edit activity attendance | covered |
| activities/record-attendance/attend-all/select-people-to-record-attendance-for | `/activities/attendance/:journeyId/attend-all/select-people-to-record-attendance-for?activityId=2&timePeriods=PM` | Record activity attendance for English level 1 14:00 to 15:00 (PM) | covered |
| activities/record-attendance/attendance-details | `/activities/attendance/:journeyId/activities/93/attendance-details/4` | Attendance record for Booking Andy | covered |
| activities/record-attendance/attendance-list-multiple | `/activities/attendance/:journeyId/activities/attendance-list` | Record attendance at 2 activity sessions | covered |
| activities/record-attendance/attendance-list-single | `/activities/attendance/:journeyId/activities/93/attendance-list` | Record activity attendance for English level 1 14:00 to 15:00 (PM) | covered |
| activities/record-attendance/cancel-multiple-sessions/cancel-reason | `/activities/attendance/:journeyId/activities/cancel-multiple/cancel-reason` | Why are you cancelling these sessions? | covered |
| activities/record-attendance/cancel-multiple-sessions/check-answers | `/activities/attendance/:journeyId/activities/cancel-multiple/check-answers` | Check and confirm cancellation details | covered |
| activities/record-attendance/cancel-multiple-sessions/payment | `/activities/attendance/:journeyId/activities/cancel-multiple/payment` | Should people be paid for these cancelled sessions? | covered |
| activities/record-attendance/cancel-multiple-sessions/view-cancellation-details | `/activities/attendance/:journeyId/activities/cancel-multiple/view-edit-details/93` | View or edit cancellation details | covered |
| activities/record-attendance/cancel-session/cancel-reason | `/activities/attendance/:journeyId/activities/93/cancel` | Why are you cancelling the session? | covered |
| activities/record-attendance/cancel-session/confirm | `/activities/attendance/:journeyId/activities/93/cancel/confirm` | Are you sure you want to cancel the session? | covered |
| activities/record-attendance/cancel-session/payment | `/activities/attendance/:journeyId/activities/93/cancel/payment` | Should people be paid for this cancelled session of English level 1? | covered |
| activities/record-attendance/cancel-session/update-payment | `/activities/attendance/:journeyId/activities/93/cancel/update-payment` | Change if people should be paid for this cancelled session | covered |
| activities/record-attendance/cancel-single-session/cancel-reason | `/activities/attendance/:journeyId/activities/cancel-single/cancel-reason` | Why are you cancelling this session of English level 1? | covered |
| activities/record-attendance/cancel-single-session/check-answers | `/activities/attendance/:journeyId/activities/cancel-single/check-answers` | Check and confirm cancellation details | covered |
| activities/record-attendance/cancel-single-session/payment | `/activities/attendance/:journeyId/activities/cancel-single/payment` | Should people be paid for this cancelled session of English level 1? | covered |
| activities/record-attendance/edit-attendance | `/activities/attendance/:journeyId/activities/93/attendance-details/4/edit-attendance` | Change attendance details for Booking Andy | covered |
| activities/record-attendance/home | `/activities/attendance/` | Record activity attendance | covered |
| activities/record-attendance/not-attended-reason | `/activities/attendance/:journeyId/activities/not-attended-reason` | Select why Test Prisoner did not attend English level 1 - PM | covered |
| activities/record-attendance/not-attended-reason-multiple | `/activities/attendance/:journeyId/activities/not-attended-reason` | Select a reason why 2 people did not attend | covered |
| activities/record-attendance/not-required-or-excused/check-and-confirm | `/activities/attendance/:journeyId/activities/93/not-required-or-excused/check-and-confirm` | Check and confirm that 1 person is not required for this session | covered |
| activities/record-attendance/not-required-or-excused/paid-or-not | `/activities/attendance/:journeyId/activities/93/not-required-or-excused/paid-or-not` | Should 1 person be paid for this session they are not required at? | covered |
| activities/record-attendance/remove-pay | `/activities/attendance/:journeyId/activities/93/attendance-details/4/remove-pay` | Are you sure you want to remove pay for Booking Andy? | covered |
| activities/record-attendance/reset-advance-attendance | `/activities/attendance/:journeyId/activities/93/advance-attendance-details/1/reset` | Are you sure you want to reset the attendance record for Booking Andy? | covered |
| activities/record-attendance/reset-attendance | `/activities/attendance/:journeyId/activities/93/attendance-details/4/reset-attendance` | Are you sure you want to reset the attendance record for Booking Andy? | covered |
| activities/record-attendance/select-period | `/activities/attendance/:journeyId/select-period` | Choose details to record attendance | covered |
| activities/record-attendance/uncancel-multiple-sessions/cancelled-activities | `/activities/attendance/:journeyId/activities/uncancel-multiple` | Uncancel activity sessions that have been cancelled | covered |
| activities/record-attendance/uncancel-multiple-sessions/confirm-multiple | `/activities/attendance/:journeyId/activities/uncancel-multiple/confirm` | Are you sure you want to uncancel 2 activity sessions? | covered |
| activities/record-attendance/uncancel-multiple-sessions/confirm-single | `/activities/attendance/:journeyId/activities/uncancel-multiple/confirm` | Are you sure you want to uncancel English level 1? | covered |
| activities/record-attendance/uncancel-session/confirm | `/activities/attendance/:journeyId/activities/93/uncancel` | Are you sure you want to uncancel this session? | covered |

## activities/suspensions

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/suspensions/case-note | `/activities/suspensions/suspend/G0995GW/:journeyId/case-note` | Add a case note for Stephen Gregs | covered |
| activities/suspensions/case-note-question | `/activities/suspensions/suspend/G0995GW/:journeyId/case-note-question` | Do you want to add a case note about why Stephen Gregs is being suspended? | covered |
| activities/suspensions/check-answers | `/activities/suspensions/suspend/G0995GW/:journeyId/check-answers` | Check and confirm suspension details | covered |
| activities/suspensions/confirmation | `/activities/suspensions/suspend/G0995GW/:journeyId/confirmation` | Suspension added | covered |
| activities/suspensions/pay | `/activities/suspensions/suspend/G0995GW/:journeyId/pay` | Should Stephen Gregs be paid for English level 1 while they’re suspended? | covered |
| activities/suspensions/select-prisoner | `/activities/suspensions/select-prisoner` | Search for someone to suspend them, or to end a suspension | covered |
| activities/suspensions/suspend-from | `/activities/suspensions/suspend/G0995GW/:journeyId/suspend-from` | When does Stephen Gregs's suspension from English level 1 start? | covered |
| activities/suspensions/suspend-until | `/activities/suspensions/unsuspend/G0995GW/:journeyId/suspend-until` | When should Stephen Gregs's suspension from English level 1 end? | covered |
| activities/suspensions/view-allocations | `/activities/suspensions/prisoner/G0995GW` | Alfonso Cholak's activities | covered |
| activities/suspensions/view-suspensions | `/activities/suspensions/prisoner/G0995GW/view-suspensions` | Suspension details | covered |

## activities/unlock-list

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/unlock-list/home | `/activities/unlock-list/` | Manage unlock and movement lists | covered |
| activities/unlock-list/planned-events | `/activities/unlock-list/:journeyId/planned-events` | Houseblock 1 - Unlock list | covered |
| activities/unlock-list/select-date-and-location | `/activities/unlock-list/:journeyId/select-date-and-location` | Choose unlock list details | covered |

## activities/waitlist-application

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/waitlist-application/activity | `/activities/waitlist/:journeyId/activity` | Search for the activity | covered |
| activities/waitlist-application/check-answers | `/activities/waitlist/:journeyId/check-answers` | Check and confirm application details | covered |
| activities/waitlist-application/confirmation | `/activities/waitlist/:journeyId/confirmation` | You've successfully logged David Winchurch's application for Maths level 1 | covered |
| activities/waitlist-application/edit-comment | `/activities/waitlist/:journeyId/view-and-edit/1/comment` | Add or edit comment | covered |
| activities/waitlist-application/edit-request-date | `/activities/waitlist/:journeyId/view-and-edit/1/request-date` | Change the date of David Winchurch's application | covered |
| activities/waitlist-application/edit-requester | `/activities/waitlist/:journeyId/view-and-edit/1/requester` | Change the requester for David Winchurch's application | covered |
| activities/waitlist-application/edit-status | `/activities/waitlist/:journeyId/view-and-edit/1/status` | Change the status of David Winchurch's application | covered |
| activities/waitlist-application/reinstate | `/activities/waitlist/:journeyId/view-and-edit/1/reinstate` | Are you sure you want to reinstate David Winchurch's application? | covered |
| activities/waitlist-application/reinstate-reason | `/activities/waitlist/:journeyId/view-and-edit/1/reinstate-reason` | Enter the reason this application is being reinstated | covered |
| activities/waitlist-application/request-date | `/activities/waitlist/:journeyId/request-date` | Enter the date shown on the application | covered |
| activities/waitlist-application/requester | `/activities/waitlist/:journeyId/requester` | Who made the application? | covered |
| activities/waitlist-application/status | `/activities/waitlist/:journeyId/status` | Record a status for this application | covered |
| activities/waitlist-application/view-application | `/activities/waitlist/:journeyId/view-and-edit/1/view` | Request for David Winchurch, A1350DZ | covered |

## activities/waitlist-dashboard

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| activities/waitlist-dashboard/dashboard | `/activities/waitlist-dashboard/` | Manage applications and waitlists | covered |

## appointments/appointment

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/appointment/copy | `/appointments/11/copy` | Copying an appointment | covered |
| appointments/appointment/details | `/appointments/11/` | Chaplain Meeting (Chaplaincy) | covered |
| appointments/appointment/movement-slip | `/appointments/11/movement-slip` | Print movement slip | covered |

## appointments/appointment-series

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/appointment-series/details | `/appointments/series/10/` | Chaplain Meeting (Chaplaincy) – series overview | covered |

## appointments/appointment-set

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/appointment-set/details | `/appointments/set/1/` | Chaplain Meeting (Chaplaincy) – set overview | covered |
| appointments/appointment-set/movement-slip | `/appointments/set/1/movement-slip` | Print movement slip | covered |

## appointments/attendance

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/attendance/attendance-details | `/appointments/attendance/:journeyId/attendees/1/G0256VF` | Attendance record for Izrmonntas Adalie | covered |
| appointments/attendance/attendees | `/appointments/attendance/:journeyId/attendees` | Record attendance at 2 appointments | covered |
| appointments/attendance/edit-attendance | `/appointments/attendance/:journeyId/attendees/1/G0256VF/edit-attendance` | Change attendance details for Izrmonntas Adalie | covered |
| appointments/attendance/select-date | `/appointments/attendance/:journeyId/select-date` | What date do you want to record attendance for? | covered |
| appointments/attendance/summaries | `/appointments/attendance/:journeyId/summaries?date=:today` | Find an appointment to record or edit attendance | covered |

## appointments/attendance-summary-stats

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/attendance-summary-stats/attendanceData | `/appointments/attendance-summary/attendance-data?date=:today&attendanceState=ATTENDED` | All attended | covered |
| appointments/attendance-summary-stats/dashboard | `/appointments/attendance-summary/dashboard?date=:today&status=ATTENDED` | Appointments attendance summary | covered |
| appointments/attendance-summary-stats/select-date | `/appointments/attendance-summary/select-date` | When do you want to see the attendance summary for? | covered |

## appointments/create-and-edit

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/create-and-edit/apply-to | `/appointments/11/edit/:journeyId/cancel/apply-to` | This appointment is in a series: select which appointments you want to cancel | covered |
| appointments/create-and-edit/appointment-set/add-extra-information | `/appointments/create/:journeyId/appointment-set-extra-information/A8644DY` | Add extra information to Stephen Gregs's appointment (optional) | covered |
| appointments/create-and-edit/appointment-set/date | `/appointments/create/:journeyId/appointment-set-date` | When are the appointments? | covered |
| appointments/create-and-edit/appointment-set/extra-information | `/appointments/create/:journeyId/appointment-set-extra-information` | Add extra information to movement slips (optional) | covered |
| appointments/create-and-edit/appointment-set/times | `/appointments/create/:journeyId/appointment-set-times` | Review appointment start and end times | covered |
| appointments/create-and-edit/appointment-set/upload | `/appointments/create/:journeyId/upload-appointment-set` | Upload your list of prison numbers | covered |
| appointments/create-and-edit/cancellation-reason | `/appointments/11/edit/:journeyId/cancel/reason` | Do you want to show the cancelled appointment on the unlock list? | covered |
| appointments/create-and-edit/check-answers | `/appointments/create/:journeyId/check-answers` | Check and confirm the appointment details | covered |
| appointments/create-and-edit/confirm-edit | `/appointments/11/edit/:journeyId/cancel/confirm` | Are you sure you want to cancel this appointment – Wednesday, 2 January 2030? | covered |
| appointments/create-and-edit/confirm-non-associations | `/appointments/create/:journeyId/confirm-non-associations` | Confirm that 3 people with non-assocations can attend this appointment | covered |
| appointments/create-and-edit/confirmation | `/appointments/create/:journeyId/confirmation/11` | Appointment scheduled | covered |
| appointments/create-and-edit/copy-series | `/appointments/create/:journeyId/copy-series` | Copying an appointment that's part of a series | covered |
| appointments/create-and-edit/date-and-time | `/appointments/create/:journeyId/date-and-time` | Enter the date and time of the appointment | covered |
| appointments/create-and-edit/extra-information | `/appointments/create/:journeyId/extra-information` | Add extra information to Stephen Gregs's appointment (optional) | covered |
| appointments/create-and-edit/host | `/appointments/create/:journeyId/host` | Who hosts this appointment? | covered |
| appointments/create-and-edit/how-to-add-prisoners | `/appointments/create/:journeyId/how-to-add-prisoners` | How do you want to select attendees? | covered |
| appointments/create-and-edit/location | `/appointments/create/:journeyId/location` | Where will the appointment take place? | covered |
| appointments/create-and-edit/name | `/appointments/create/:journeyId/name` | What’s the appointment? | covered |
| appointments/create-and-edit/no-attendees | `/appointments/create/:journeyId/no-attendees` | There are no attendees for this appointment | covered |
| appointments/create-and-edit/repeat | `/appointments/create/:journeyId/repeat` | Will the appointment repeat? | covered |
| appointments/create-and-edit/repeat-frequency-and-count | `/appointments/create/:journeyId/repeat-frequency-and-count` | How often will the appointment repeat? | covered |
| appointments/create-and-edit/review-non-associations | `/appointments/create/:journeyId/review-non-associations?prisonerRemoved=true` | You’ve dealt with all the non-associations between this appointment’s attendees | covered |
| appointments/create-and-edit/review-non-associations-edit | `/appointments/11/edit/:journeyId/prisoners/add/review-non-associations?prisonerRemoved=true` | You’ve dealt with all non-associations for the people you’re adding | covered |
| appointments/create-and-edit/review-prisoners | `/appointments/create/:journeyId/review-prisoners` | Review who’s attending the appointment | covered |
| appointments/create-and-edit/review-prisoners-alerts | `/appointments/create/:journeyId/review-prisoners-alerts` | You've removed all people with alerts | covered |
| appointments/create-and-edit/schedule | `/appointments/create/:journeyId/schedule` | Review scheduled events to avoid clashes | covered |
| appointments/create-and-edit/select-prisoner | `/appointments/create/:journeyId/select-prisoner` | Who is the appointment for? | covered |
| appointments/create-and-edit/tier | `/appointments/create/:journeyId/tier` | Which tier is the appointment in? | covered |
| appointments/create-and-edit/upload-prisoner-list | `/appointments/create/:journeyId/upload-prisoner-list` | Upload your list of prison numbers | covered |

## appointments/home

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/home/index | `/appointments/` | Appointments | covered |

## appointments/search

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/search/results | `/appointments/search/` | Appointments dashboard | covered |
| appointments/search/select-date | `/appointments/search/select-date` | What date do you want to view appointments for? | covered |

## appointments/video-link-booking/court

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/video-link-booking/court/booking-cancelled | `/appointments/video-link-booking/court/cancel/1234/:journeyId/confirmation` | This video link booking has been cancelled | covered |
| appointments/video-link-booking/court/check-booking | `/appointments/video-link-booking/court/create/:journeyId/check-answers` | Check and confirm appointment details | covered |
| appointments/video-link-booking/court/confirm-cancel | `/appointments/video-link-booking/court/cancel/1234/:journeyId/confirm` | Are you sure you want to cancel Stephen Gregs's booking? | covered |
| appointments/video-link-booking/court/confirmation | `/appointments/video-link-booking/court/create/:journeyId/confirmation/1234` | Appointment scheduled | covered |
| appointments/video-link-booking/court/court-hearing-link | `/appointments/video-link-booking/court/create/:journeyId/court-hearing-link` | Enter link details | covered |
| appointments/video-link-booking/court/date-and-time | `/appointments/video-link-booking/court/create/:journeyId/date-and-time` | Enter the date and time of the appointment | covered |
| appointments/video-link-booking/court/details | `/appointments/video-link-booking/court/1234` | Video Link - Court Hearing | covered |
| appointments/video-link-booking/court/extra-information | `/appointments/video-link-booking/court/create/:journeyId/extra-information` | Add extra information | covered |
| appointments/video-link-booking/court/hearing-details | `/appointments/video-link-booking/court/create/:journeyId/hearing-details` | Enter the type of meeting | covered |
| appointments/video-link-booking/court/location | `/appointments/video-link-booking/court/create/:journeyId/location` | Where will the appointment take place? | covered |
| appointments/video-link-booking/court/movement-slip | `/appointments/video-link-booking/court/1234/movement-slip` | Print movement slip | covered |
| appointments/video-link-booking/court/schedule | `/appointments/video-link-booking/court/create/:journeyId/schedule` | Review scheduled events to avoid clashes | covered |
| appointments/video-link-booking/court/select-prisoner | `/appointments/video-link-booking/court/create/:journeyId/select-prisoner` | Select one attendee for this appointment | covered |

## appointments/video-link-booking/probation

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| appointments/video-link-booking/probation/booking-cancelled | `/appointments/video-link-booking/probation/cancel/1234/:journeyId/confirmation` | This video link booking has been cancelled | covered |
| appointments/video-link-booking/probation/check-booking | `/appointments/video-link-booking/probation/create/:journeyId/check-answers` | Check and confirm appointment details | covered |
| appointments/video-link-booking/probation/confirm-cancel | `/appointments/video-link-booking/probation/cancel/1234/:journeyId/confirm` | Are you sure you want to cancel Stephen Gregs's booking? | covered |
| appointments/video-link-booking/probation/confirmation | `/appointments/video-link-booking/probation/create/:journeyId/confirmation/1234` | Appointment scheduled | covered |
| appointments/video-link-booking/probation/date-and-time | `/appointments/video-link-booking/probation/create/:journeyId/date-and-time` | Enter the date and time of the appointment | covered |
| appointments/video-link-booking/probation/details | `/appointments/video-link-booking/probation/1234` | Video Link - Probation Meeting | covered |
| appointments/video-link-booking/probation/extra-information | `/appointments/video-link-booking/probation/create/:journeyId/extra-information` | Add extra information | covered |
| appointments/video-link-booking/probation/location | `/appointments/video-link-booking/probation/create/:journeyId/location` | Where will the appointment take place? | covered |
| appointments/video-link-booking/probation/probation-meeting-details | `/appointments/video-link-booking/probation/create/:journeyId/meeting-details` | Enter appointment details | covered |
| appointments/video-link-booking/probation/schedule | `/appointments/video-link-booking/probation/create/:journeyId/schedule` | Review scheduled events to avoid clashes | covered |
| appointments/video-link-booking/probation/select-prisoner | `/appointments/video-link-booking/probation/create/:journeyId/select-prisoner` | Select one attendee for this appointment | covered |

## general

| Screen | Accessibility route | Expected heading | Status |
| --- | --- | --- | --- |
| 403 | `/activities/dashboard` | You do not have permission to access this page | covered |
| 404 | `/accessibility-page-does-not-exist` | Page not found | covered |
| autherror | `/autherror` | Authorisation Error | covered |
| error | `/activities/dashboard` | Sorry, there is a problem with the service | excluded: The feature application deliberately displays diagnostic stack traces. Testing the production variant would require a separate production-mode server. |
| home/activities-accessibility-statement | `/activities-accessibility-statement` | Accessibility statement for Activities, unlock and attendance | covered |
| home/appointments-accessibility-statement | `/appointments-accessibility-statement` | Accessibility statement for Appointments | covered |
| home/index | `/` | Select service | covered |
| not-rolled-out | `/` | The Activities and Appointments service is not available at Moorland (HMP) yet | excluded: A&A is fully rolled out! |

