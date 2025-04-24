import { FilterToggleButton } from '@ministryofjustice/frontend'

function ListFilter(container) {
  this.container = container

  new FilterToggleButton(container, {
    bigModeMediaQuery: '(min-width: 40.0625em)',
    startHidden: this.container.dataset.filterStartShown !== 'true',
    toggleButton: {
      showText: 'Show filter',
      hideText: 'Hide filter',
      classes: 'govuk-button--blue',
    },
    toggleButtonContainer: {
      selector: '.moj-action-bar__filter',
    },
    closeButton: {
      text: 'Close',
    },
    closeButtonContainer: {
      selector: '.moj-filter__header-action',
    },
  })
}

export default ListFilter
