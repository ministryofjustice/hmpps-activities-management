import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    'node_modules/cypress@15.10.0': 'ALLOW',
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    'node_modules/esbuild@0.27.2': 'ALLOW',
    'node_modules/unrs-resolver@1.9.1': 'ALLOW',
  },
})
