export enum WaitingListAllocationStatusOptions {
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
  WITHDRAWN = 'WITHDRAWN',
}

export enum WaitingListStatusDescriptions {
  APPROVED = `Add the applicant to the waitlist. They're ready to be allocated.`,
  DECLINED = `Reject the application and inform the person concerned.`,
  PENDING = "Add the applicant to the waitlist as 'Pending'. " +
    'Follow your usual procedure to check if they can be allocated.',
  WITHDRAWN = 'will be removed from the waitlist.',
}
