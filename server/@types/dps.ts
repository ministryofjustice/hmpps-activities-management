import { CaseLoad } from './prisonApiImport/types'

export type CaseLoadExtended = CaseLoad & {
  isRolledOut?: boolean
}
