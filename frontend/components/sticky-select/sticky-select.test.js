// @ts-nocheck

import StickySelect from './sticky-select'

jest.mock('../../utils', () => ({
  nodeListForEach: (nodes, callback) => nodes.forEach(callback),
}))

describe('StickySelect', () => {
  const createStickySelect = ({ selectedCheckboxes = 1, maxItems = '1' } = {}) => {
    const stickySelect = Object.create(StickySelect.prototype)

    stickySelect.radios = []
    stickySelect.checkboxes = Array.from({ length: selectedCheckboxes }, () => ({
      checked: true,
      getAttribute: jest.fn().mockReturnValue(null),
    }))

    const actionButton = {
      id: 'activities-action-0',
      dataset: { maxItems },
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
    }

    stickySelect.actionButtons = [actionButton]

    return { stickySelect, actionButton }
  }

  it('should keep an action enabled when the selected count does not exceed its maximum', () => {
    const { stickySelect, actionButton } = createStickySelect({
      selectedCheckboxes: 1,
    })

    stickySelect.handleDisabledButtons(1)

    expect(actionButton.removeAttribute).toHaveBeenCalledWith('disabled')
    expect(actionButton.setAttribute).not.toHaveBeenCalledWith('disabled', 'disabled')
  })

  it('should disable an action when the selected count exceeds its maximum', () => {
    const { stickySelect, actionButton } = createStickySelect({
      selectedCheckboxes: 2,
    })

    stickySelect.handleDisabledButtons(2)

    expect(actionButton.setAttribute).toHaveBeenCalledWith('disabled', 'disabled')
  })
})
