export function openAddDeliveryAddressDialogAndFocusFirstInput(testPageDocument) {
  // opens the 'Add Delivery Address' modal dialog, and sets focus on the first input
  const btn = testPageDocument.querySelector('#ex1 > button');
  testPageDocument.defaultView.openDialog('dialog1', btn);
}
