import { nodeListForEach } from '../../utils'

function FormSpinner(container) {
  this.container = container

  this.spinnerSvg =
    '<div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'

  this.container.addEventListener('submit', () => {
    const formSpinnerTemplate = document.createElement('template')
    formSpinnerTemplate.innerHTML = `
      <div class="form-spinner">
        <div class="form-spinner__notification-box" role="alert">
          ${this.container.dataset.loadingText ?? 'Loading'}
          <div class="form-spinner__spinner">
            ${this.spinnerSvg}
          </div>
        </div>
      </div>
    `.trim()

    setTimeout(() => document.querySelector('body').appendChild(formSpinnerTemplate.content.firstChild), 1000)

    const buttons = this.container.querySelectorAll('[data-module="govuk-button"]')
    nodeListForEach(buttons, function (button) {
      button.setAttribute('disabled', 'disabled')
      button.setAttribute('aria-disabled', 'true')
    })

    const stickyHeader = this.container.querySelector('.govuk-table__head')
    const stickyActionBar = this.container.querySelector('.sticky-select-action-bar')
    if (stickyHeader && stickyActionBar) {
      stickyHeader.style.position = 'relative'
      stickyHeader.style['z-index'] = 'auto'
      stickyActionBar.style.position = 'relative'
      stickyActionBar.style['z-index'] = 'auto'
    }
  })
}

export default FormSpinner
