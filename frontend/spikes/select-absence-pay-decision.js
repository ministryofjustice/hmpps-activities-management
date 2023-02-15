//TODO: These should be removed eventually

// $(function () {
//   const $payYesNoRadios = $('.am-pay-yes-no')
//   const $paidReasonSelect = $('.am-paid-reason')
//   const $unpaidReasonSelect = $('.am-unpaid-reason')
//
//   $payYesNoRadios.on('change', evt => {
//     const split = evt.currentTarget.id.split('-')
//     const $paidOptions = $('#paid-options-' + split[2] + '-' + split[3])
//     const $unpaidOptions = $('#unpaid-options-' + split[2] + '-' + split[3])
//     switch (evt.currentTarget.value) {
//       case 'yes':
//         $paidOptions.removeClass('govuk-visually-hidden')
//         $unpaidOptions.addClass('govuk-visually-hidden')
//         break
//       default:
//         $unpaidOptions.removeClass('govuk-visually-hidden')
//         $paidOptions.addClass('govuk-visually-hidden')
//         break
//     }
//   })
//
//   $paidReasonSelect.on('change', evt => {
//     const split = evt.currentTarget.id.split('-')
//     const $selectSubReasonToPay = $('#subreason-to-pay-group-' + split[3] + '-' + split[4])
//     switch (evt.currentTarget.value) {
//       case 'AcceptableAbsence':
//         $selectSubReasonToPay.removeClass('govuk-visually-hidden')
//         break
//       default:
//         $selectSubReasonToPay.addClass('govuk-visually-hidden')
//         break
//     }
//   })
//
//   $unpaidReasonSelect.on('change', evt => {
//     const split = evt.currentTarget.id.split('-')
//     const $selectSubReasonToNotPay = $('#subreason-to-not-pay-group-' + split[3] + '-' + split[4])
//     const $incentiveWarningRadios = $('#incentive-warning-group-' + split[3] + '-' + split[4])
//     switch (evt.currentTarget.value) {
//       case 'RestDay':
//       case 'RestInCellOrSick':
//         $selectSubReasonToNotPay.addClass('govuk-visually-hidden')
//         $incentiveWarningRadios.addClass('govuk-visually-hidden')
//         break
//       case 'Refused':
//       case 'UnacceptableAbsence':
//         $selectSubReasonToNotPay.removeClass('govuk-visually-hidden')
//         $incentiveWarningRadios.removeClass('govuk-visually-hidden')
//         break
//       case 'SessionCancelled':
//         $selectSubReasonToNotPay.removeClass('govuk-visually-hidden')
//         $incentiveWarningRadios.addClass('govuk-visually-hidden')
//         break
//       default:
//         $selectSubReasonToNotPay.addClass('govuk-visually-hidden')
//         $incentiveWarningRadios.addClass('govuk-visually-hidden')
//         break
//     }
//   })
// })
