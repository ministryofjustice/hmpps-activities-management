import accessibleAutocomplete from 'accessible-autocomplete'
import _ from 'lodash'

function AutoComplete(meta) {
  this.meta = meta

  var autocompleteElements = this.meta.content.split(',')
  autocompleteElements.forEach(el => {
    var selectElement = document.querySelector('#' + el)
    accessibleAutocomplete.enhanceSelectElement({
      selectElement,
      showAllValues: true,
      preserveNullOptions: true,
      templates: {
        suggestion: option => _.escape(option), // escape html which may have been injected to the component
      },
    })

    selectElement = document.querySelector('#' + el)
    // By default accessible-autocomplete creates an input element with type="text".
    // We want to use type="search" to enable the clear button (cross) on these inputs
    selectElement.setAttribute('type', 'search')

    // There is a bug(?) where the scroll bar of a child element will trigger a "blur" event when it has a parent with a
    // tabindex of -1. Because dialogs typically use tabindex=-1 to recieve programmatic focus, and this autocomplete
    // component uses blur events to close the autocomplete menu, it means the autocomplete will close when using the
    // scroll bar. This fix adds a tabindex=-1 to the wrapper of the autocomplete then supresses blur events that occur
    // within the wrapper such as clicking scrollbars.
    selectElement.parentNode.setAttribute('tabindex', -1)
    selectElement.parentNode.addEventListener(
      'blur',
      e => {
        if (e.relatedTarget && e.relatedTarget.classList.contains('autocomplete__wrapper')) {
          e.stopImmediatePropagation()
          setTimeout(() => selectElement.focus(), 10)
        }
      },
      true
    )
  })
}

export default AutoComplete
