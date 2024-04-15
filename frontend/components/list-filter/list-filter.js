import { FilterToggleButton } from '@ministryofjustice/frontend'

function ListFilter(container) {
  this.container = container

  new FilterToggleButton({
    bigModeMediaQuery: '(min-width: 40.0625em)',
    startHidden: this.container.dataset.filterStartShown !== 'true',
    toggleButton: {
      container: $('.moj-action-bar__filter'),
      showText: 'Show filter',
      hideText: 'Hide filter',
      classes: 'govuk-button--blue',
    },
    closeButton: {
      container: $('.moj-filter__header-action'),
      text: 'Close',
    },
    filter: {
      container: $('.moj-filter'),
    },
  })
}

export default ListFilter
