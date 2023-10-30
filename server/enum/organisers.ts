enum Organiser {
  PRISON_STAFF = 1,
  PRISONER = 2,
  EXTERNAL_PROVIDER = 3,
  OTHER = 4,
}

export const organiserDescriptions = {
  [Organiser.PRISON_STAFF]: 'Prison staff',
  [Organiser.PRISONER]: 'A prisoner or group of prisoners',
  [Organiser.EXTERNAL_PROVIDER]: 'An external provider',
  [Organiser.OTHER]: 'Someone else',
}

export default Organiser
