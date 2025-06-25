import config from '../../../../config'

// eslint-disable-next-line import/prefer-default-export
export const toFullCourtLink = (hmctsNumber: string) => {
  if (!hmctsNumber || hmctsNumber.length < 1) {
    return undefined
  }
  return `HMCTS${hmctsNumber}@${config.defaultCourtVideoUrl}`
}
