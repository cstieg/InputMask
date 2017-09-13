// inputmask.js
// Emulates form field mask function of MS Access
// Automatically causes input to follow pattern of mask:

/*  Special wildcard symbols
0 - User must enter a digit (0-9)
9 - User can enter a digit (0-9)
# - User can enter a digit, space, plus, or minus sign
L - User must enter a letter
? - User can enter a letter
A - User must enter a letter or a digit
a - User can enter a letter or a digit
& - User must enter either a character or a space
C - User can enter either a character or a space
*/


// Namespace variable
var inputMask = {
  // List of allowed wildcard symbols; all others are considered framework
  symbolList: '90#L?Aa&C',

  // Adds the necessary listeners to all input elements with 'mask' property
  addMaskListeners: function() {
    var elements = document.getElementsByTagName('input');
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].hasAttribute('mask')) {
        var mask = elements[i].getAttribute('mask');
        elements[i].addEventListener('keypress', inputMask.maskKeyPress);
        elements[i].addEventListener('change', inputMask.maskChange);
      }
    }
  },

  // Handles a key press in an input element with a 'mask' property
  maskKeyPress: function(e) {
    if (e.ctrlKey || e.altKey) return;
    var currentPosition = this.selectionStart;
    var mask = this.getAttribute('mask');
    var inputChar = '';
    var maskChar = '';

    // process inputted char
    inputChar = e.key;
    while (currentPosition < mask.length) {
      // mask character at current input location
      maskChar = mask.substring(currentPosition, currentPosition + 1);

      // If mask has a symbol here, test to make sure input character meets the constraints of the mask
      if (inputMask.isSymbol(maskChar)) {
        // cancel input character if doesn't meet constraints of mask
        if (!inputMask.testSymbols(maskChar, inputChar)) {
          return inputMask.cancelInput(e);
        }
        return true;
      }
      // if mask is not a symbol here, find the next place this input character matches the mask
      else {
        // drop through any framework characters
        if (maskChar != inputChar) {
          this.value += maskChar;
          currentPosition++;
          continue;
        }
        return true;
      }
    }
    // if there are no more characters in mask, cancel input
    return inputMask.cancelInput(e);
  },

  // Handles a value change (after lost focus) in an input element with a 'mask' property
  maskChange: function(e) {
    var mask = this.getAttribute('mask');
    var inputChar = '';
    var maskChar = '';

    // Always allow leaving the field if empty
    if (this.value.length === 0) {
      return true;
    }

    // Don't allow input that is longer than mask
    if (this.value.length > mask.length) {
      return inputMask.validationFailed(e, 'Input is too long!');
    }

    // process inputted char
    for (var i = 0; i < mask.length; i++) {
      inputChar = this.value.substring(i, i+1) || '';
      // mask character at current input location
      maskChar = mask.substring(i, i+1);

      // If mask has a symbol here, test to make sure input character meets the constraints of the mask
      if (inputMask.isSymbol(maskChar)) {
        // Disallow input character if doesn't meet constraints of mask
        if (!inputMask.testSymbols(maskChar, inputChar)) {
          return inputMask.validationFailed(e, 'Invalid input!');
        }
      }
      else {
        // Disallow input character if doesn't match mask framework
        if (maskChar != inputChar) {
          return inputMask.validationFailed(e, 'Invalid input!');
        }
      }
    }
  },

  // Checks whether a character is one of the special wildcard symbols
  isSymbol: function(testChar) {
    return (inputMask.symbolList.includes(testChar));
  },

  // Checks the current input character against the corresponding mask character
  // Returns true if it matches; false if it doesn't
  testSymbols: function(maskChar, testChar) {
    switch (maskChar) {
      case '9':
        return testChar !== '' && testChar == ' ' || inputMask.isDigit(testChar);
      case '0':
        return inputMask.isDigit(testChar);
      case '#':
        return ' +-'.includes(testChar) || inputMask.isDigit(testChar);
      case 'L':
        return testChar !== '' && inputMask.isLetter(testChar);
      case '?':
        return testChar == ' ' || inputMask.isLetter(testChar);
      case 'A':
        return testChar !== '' && inputMask.isLetter(testChar) || inputMask.isDigit(testChar);
      case 'a':
        return testChar == ' ' || inputMask.isLetter(testChar) || inputMask.isDigit(testChar);
      case '&':
         return testChar !== '';
      case 'C':
         return true;
    }
    return false;
  },

  // Checks whether character is a digit
  isDigit: function(testChar) {
    return ('0123456789'.includes(testChar));
  },

  // Checks whether character is a letter
  // Returns true if testChar is a letter from any alphabet where there is upper and lower case
  isLetter: function(testChar) {
    return testChar.toLowerCase() != testChar.toUpperCase();
  },

  // Cancels input, ignoring keystroke
  // Parameters:
  //  e - event object
  cancelInput: function(e) {
    e.preventDefault();
    return false;
  },

  // Displays an error message when validation fails
  // Parameters:
  //  e - event object
  //  message - string error message
  validationFailed: function(e, message) {
    alert(message);
    e.currentTarget.focus();
    return false;
  }

};


// Automatically initializes inputMask module
(function initInputMask() {
  inputMask.addMaskListeners();
})();
