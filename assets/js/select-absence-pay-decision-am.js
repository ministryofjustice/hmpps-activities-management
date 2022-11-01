$(function () {
  const $payYesNoRadios = $('.am-pay-yes-no')

  $payYesNoRadios.each(function (i, obj) {
    const split = obj.id.split('-')
    const $paidOptions = $('#paid-options-' + split[2] + '-' + split[3])
    const $unpaidOptions = $('#unpaid-options-' + split[2] + '-' + split[3])
    switch (split[1]) {
      case 'yes':
        if ($(obj).is(':checked')) {
          $paidOptions.removeClass('govuk-visually-hidden')
          $unpaidOptions.addClass('govuk-visually-hidden')
        }
        break
      default:
        if ($(obj).is(':checked')) {
          $unpaidOptions.removeClass('govuk-visually-hidden')
          $paidOptions.addClass('govuk-visually-hidden')
        }
        break
    }
  })

  $payYesNoRadios.on('change', evt => {
    const split = evt.currentTarget.id.split('-')
    const $paidOptions = $('#paid-options-' + split[2] + '-' + split[3])
    const $unpaidOptions = $('#unpaid-options-' + split[2] + '-' + split[3])
    switch (evt.currentTarget.value) {
      case 'yes':
        $paidOptions.removeClass('govuk-visually-hidden')
        $unpaidOptions.addClass('govuk-visually-hidden')
        break
      default:
        $unpaidOptions.removeClass('govuk-visually-hidden')
        $paidOptions.addClass('govuk-visually-hidden')
        break
    }
  })
})
