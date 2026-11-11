const { readFile } = require('node:fs/promises')

// accessible-autocomplete only recognises iOS user agents. Modern iPads can
// identify as Macs, missing its VoiceOver support (including keeping the menu
// open on blur). Patch the distributed entry point. Remove when fixed upstream.
const iosUserAgentCheck = 'navigator.userAgent.match(/(iPod|iPhone|iPad)/g)'
const iosDeviceCheck = `(${iosUserAgentCheck}||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))`

const accessibleAutocompletePlugin = () => ({
  name: 'accessible-autocomplete-ipados',
  setup(build) {
    build.onLoad(
      { filter: /[/\\]accessible-autocomplete[/\\]dist[/\\]accessible-autocomplete\.min\.js$/ },
      async args => {
        const contents = await readFile(args.path, 'utf8')
        // Fail the build if a dependency update changes this check, so the patch
        // must be reviewed rather than silently dropping the iPad correction.
        if (contents.split(iosUserAgentCheck).length !== 2) {
          throw new Error('Review the accessible-autocomplete iPadOS patch: expected exactly one iOS user agent check')
        }
        return { contents: contents.replace(iosUserAgentCheck, iosDeviceCheck), loader: 'js' }
      },
    )
  },
})

module.exports = { accessibleAutocompletePlugin }
