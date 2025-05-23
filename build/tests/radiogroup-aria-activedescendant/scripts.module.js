export function checkFirstRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
  // sets the state of the first radio button to checked, and sets focus on a link after the radio group
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  testPageDocument.querySelector('#afterlink').focus();
}

export function checkFirstRadioButtonAndSetFocusBeforeRadioGroup(testPageDocument) {
  // sets the state of the first radio button to checked, and sets focus on a link before the radio group
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  testPageDocument.querySelector('#beforelink').focus();
}

export function checkThirdRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
  // sets the state of the third radio button to checked, and sets focus on a link after the radio group
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[2].classList.add('focus');
  radios[2].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[2].id);
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusAfterRadioGroup(testPageDocument) {
  // sets focus on a link after the radio group
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeRadioGroup(testPageDocument) {
  // sets focus on a link before the radio group
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnAndCheckFirstRadioButton(testPageDocument) {
  // sets focus on the first radio button, and sets its state to checked
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  radioGroup.focus();
}

export function setFocusOnFirstRadioButton(testPageDocument) {
  // sets focus on the first radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  radioGroup.focus();
}

export function setFocusOnFirstRadioButtonAndCheckSecondRadioButton(testPageDocument) {
  // sets focus on the first radio button, and checks the  second radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[1].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  radioGroup.focus();
}

export function setFocusOnSecondRadioButton(testPageDocument) {
  // sets focus on the second radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[1].classList.add('focus');
  radioGroup.setAttribute('aria-activedescendant', radios[1].id);
  radioGroup.focus();
}

export function setFocusOnSecondRadioButtonAndCheckFirstRadioButton(testPageDocument) {
  // sets focus on the second radio button, and checks the first radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[1].classList.add('focus');
  radios[0].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[1].id);
  radioGroup.focus();
}

export function setFocusOnThirdRadioButton(testPageDocument) {
  // sets focus on the third radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[2].classList.add('focus');
  radioGroup.setAttribute('aria-activedescendant', radios[2].id);
  radioGroup.focus();
}
