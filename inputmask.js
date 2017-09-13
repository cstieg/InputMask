var inputMask = {
  symbolList: '90#L?Aa&C',

  addMaskListeners: function() {
    var elements = document.getElementsByTagName('input');
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].hasAttribute('mask')) {
        var mask = elements[i].getAttribute('mask');
        elements[i].addEventListener('keypress', inputMask.maskKeyPress);
        elements[i].onblur = inputMask.maskLostFocus;
      }
    }
  },

  validationFailed: function(e, message) {
    // workaround to stop alert from taking focus from input window and firing blur again
    var handler = e.currentTarget.onblur;
    e.currentTarget.onblur = null;
    alert(message);

    // Setting handler back immediately after alert still causes blur to fire again
    // Setting the handler back after 1/10th of a second does the trick
    setTimeout(function(currentTarget, handler) {
      currentTarget.onblur = handler;
    }, 100, e.currentTarget, handler);

    return true;
  },

  maskLostFocus: function(e) {
    var mask = this.getAttribute('mask');
    var errorMessage = '';

    if (this.value.length === 0) {
      return true;
    }

    if (this.value.length > mask.length) {
      errorMessage = 'Input is too long!';
      return inputMask.validationFailed(e, errorMessage);
    }

    var inputChar = '';
    var maskChar = '';
    for (var i = 0; i < mask.length; i++) {
      maskChar = mask.substring(i, i+1);
      inputChar = this.value.substring(i, i+1) || '';
      if (inputMask.isSymbol(maskChar)) {
        if (!inputMask.testSymbols(maskChar, inputChar)) {
          errorMessage = 'Invalid input!';
          return inputMask.validationFailed(e, errorMessage);
        }
      }
      else {
        if (maskChar != inputChar) {
          errorMessage = 'Invalid input!';
          return inputMask.validationFailed(e, errorMessage);
        }
      }
    }

  },

  maskKeyPress: function(e) {
    if (e.ctrlKey || e.altKey) return;
    var currentPosition = this.selectionStart;
    var mask = this.getAttribute('mask');
    var inputChar = '';
    var maskChar = '';

    if (this.value.length >= mask.length) {
      return inputMask.cancelInput(e, this);
    }

    // check previous
    for (var i = 0; i < currentPosition; i++) {
      maskChar = mask.substring(i, i+1);
      inputChar = this.value.substring(i, i+1);
      if (inputMask.isSymbol(maskChar)) {
        if (!inputMask.testSymbols(maskChar, inputChar)) {
          return inputMask.clearAndCancelInput(e, this);
        }
      }
      else {
        if (maskChar != inputChar) {
          return inputMask.clearAndCancelInput(e, this);
        }
      }
    }

    // process inputted char
    inputChar = e.key;
    while (currentPosition < mask.length) {
      maskChar = mask.substring(currentPosition, currentPosition + 1);
      if (inputMask.isSymbol(maskChar)) {
        if (!inputMask.testSymbols(maskChar, inputChar)) {
          return inputMask.cancelInput(e);
        }
        break;
      }
      else {
        if (maskChar != inputChar) {
          this.value += maskChar;
          currentPosition++;
          continue;
        }
        break;
      }
    }

  },

  cancelInput: function(e) {
    e.preventDefault();
    return false;
  },

  clearAndCancelInput: function(e, element) {
    element.value = '';
    return inputMask.cancelInput(e);
  },

  isSymbol: function(testChar) {
    return (inputMask.symbolList.includes(testChar));
  },

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

  isDigit: function(testChar) {
    return ('0123456789'.includes(testChar));
  },

  isLetter: function(testChar) {
    return testChar.toLowerCase() != testChar.toUpperCase();
  }



};

(function init() {
  inputMask.addMaskListeners();
})();
