window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterForm(testPageDocument) {
    // sets focus on a link after the form landmark
    testPageDocument.getElementById('afterlink').focus();
  }
});
