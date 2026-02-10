// TODO: Clean up redundant enums once waitlistWithdrawnEnabled flag is removed.
// Allocation dashboard does not have allocated. Decide on either separate enums or combined with filter.

export enum WaitingListStatusOptions {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum WaitingListStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ALLOCATED = 'ALLOCATED',
}

export enum WaitingListStatusWithWithdrawn {
  ALLOCATED = 'ALLOCATED',
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum WaitingListStatusDescriptions {
  APPROVED = `Add the applicant to the waitlist. They're ready to be allocated.`,
  DECLINED = `Reject the application and inform the person concerned.`,
  PENDING = "Add the applicant to the waitlist as 'Pending'. " +
    'Follow your usual procedure to check if they can be allocated.',
  WITHDRAWN = 'will be removed from the waitlist.',
}
