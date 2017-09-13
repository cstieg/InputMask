var inputMask = {
  symbolList: '90*&',

  addMaskListeners: function() {
    var elements = document.getElementsByTagName('input');
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].hasAttribute('mask')) {
        var mask = elements[i].getAttribute('mask');
        elements[i].addEventListener('keypress', inputMask.maskKeyPress);
      }
    }
  },

  maskKeyPress: function(e) {
    if (e.ctrlKey || e.altKey) return;
    var currentPosition = this.selectionStart;
    var mask = this.getAttribute('mask');
    var inputChar = '';
    var maskChar = '';
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
      debugger;
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
    return (inputMask.symbolList.indexOf(testChar) >= 0);
  },

  testSymbols: function(maskChar, testChar) {
    switch (maskChar) {
      case '9':
        return inputMask.test9(testChar);
      case '0':
        return inputMask.test0(testChar);
    }
    return true;
  },

  test9: function(testChar) {
    return ('0123456789 '.indexOf(testChar) >= 0);
  },

  test0: function(testChar) {
    return ('0123456789'.indexOf(testChar) >= 0);
  }



};

(function init() {
  inputMask.addMaskListeners();
})();
