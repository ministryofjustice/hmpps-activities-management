enum EventOrganiser {
  PRISON_STAFF = 'PRISON_STAFF',
  PRISONER = 'PRISONER',
  EXTERNAL_PROVIDER = 'EXTERNAL_PROVIDER',
  OTHER = 'OTHER',
}

export const organiserDescriptions = {
  [EventOrganiser.PRISON_STAFF]: 'Prison staff',
  [EventOrganiser.PRISONER]: 'A prisoner or group of prisoners',
  [EventOrganiser.EXTERNAL_PROVIDER]: 'An external provider',
  [EventOrganiser.OTHER]: 'Someone else',
}

export default EventOrganiser
