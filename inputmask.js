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
> - Converts all characters that follow to uppercase
< - Converts all characters that follow to lowercase
! - Causes the input mask to fill from left to right instead of from right to left (NOT IMPLEMENTED)
^ - Stops converting case of all characters that follow (not in MS Access)
\ - Characters immediately following will be displayed literally
"" - Characters enclosed in double quotation marks will be displayed literally
*/


// Namespace variable
var inputMask = {
  // List of allowed wildcard symbols; all others are considered framework
  symbolList: '90#L?Aa&C',

  // List of escape symbols that do not take space in the mask
  escapeSymbolList: '<>!\\"',

  // Adds the necessary listeners to all input elements with 'mask' property
  addMaskListeners: function() {
    var elements = document.getElementsByTagName('input');
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].hasAttribute('mask')) {
        var mask = elements[i].getAttribute('mask');
        elements[i].addEventListener('keypress', inputMask.maskKeyPress);
        elements[i].addEventListener('paste', inputMask.maskPaste);
      }
    }
  },

  // Handles a key press in an input element with a 'mask' property
  maskKeyPress: function(e) {
    if (e.ctrlKey || e.altKey) return;
    this.currentPosition = this.selectionStart;
    var maskInfo = inputMask.getMaskInfo(this.getAttribute('mask'));
    e.preventDefault();

    // process inputted char
    var isValidChar = inputMask.processChar(this, e.key, maskInfo, e);
    if (isValidChar) {
      this.value += isValidChar;
      return true;
    }
    return inputMask.cancelInput(e);
  },

  // Handles pasting into an input element with a 'mask' property
  maskPaste: function(e) {
    this.currentPosition = this.selectionStart;
    var maskInfo = inputMask.getMaskInfo(this.getAttribute('mask'));
    var pasteString = e.clipboardData.getData('text');
    var beforeSelection = this.value.substr(0, this.selectionStart);
    var afterSelection = this.value.substr(this.selectionEnd);

    // put what was before selection in resulting product
    this.value = beforeSelection;
    var i;
    var isValidChar;

    // process pasted characters that replace selection
    for (i = 0; i < pasteString.length; i++) {
      isValidChar = inputMask.processChar(this, pasteString[i], maskInfo, e);
      if (isValidChar) {
        this.value += isValidChar;
      }
    }

    // process characters back in that were originally in input following selection
    for (i = 0; i < afterSelection.length; i++) {
      isValidChar = inputMask.processChar(this, afterSelection[i], maskInfo, e);
      if (isValidChar) {
        this.value += isValidChar;
      }
    }

    // Cancel paste since pasted characters have already been processed into value
    e.preventDefault();
  },

  // Processes character input one at a time
  // Parameters:
  //   inputObj - input DOM element which is receiving input
  //   inputChar - the character being processed
  //   maskInfo - the object containing the mask strings
  processChar: function(inputObj, inputChar, maskInfo) {
    var returnChar = '';
    var symbolMaskChar = '';
    var literalMaskChar = '';
    while (inputObj.currentPosition < maskInfo.symbolMask.length) {
      // mask character at current input location
      symbolMaskChar = maskInfo.symbolMask.substring(inputObj.currentPosition, inputObj.currentPosition + 1);
      literalMaskChar = maskInfo.literalMask.substring(inputObj.currentPosition, inputObj.currentPosition + 1);

      // If mask has a symbol here, test to make sure input character meets the constraints of the mask
      if (symbolMaskChar !== ' ') {
        // disallow input character if doesn't meet constraints of mask
        if (!inputMask.testSymbols(symbolMaskChar, inputChar)) {
          return false;
        }
        returnChar += inputMask.convertedLetterCase(inputChar, maskInfo.caseMask.charAt(inputObj.CurrentPosition));
        inputObj.currentPosition++;
        // If have filled the last wildcard symbol, add the rest of the literal mask
        var charsLeft = maskInfo.symbolMask.length - (inputObj.currentPosition);
        if (maskInfo.symbolMask.substr(inputObj.currentPosition, charsLeft).trim() === '') {
          returnChar += maskInfo.literalMask.substr(inputObj.currentPosition, charsLeft);
          inputObj.currentPosition++;
        }
        return returnChar;
      }
      // if mask is not a symbol here, find the next place this input character matches the mask
      else {
        // drop through any framework characters
        if (literalMaskChar != inputChar) {
          returnChar += literalMaskChar;
          inputObj.currentPosition++;
          continue;
        }
        return returnChar;
      }
    }
    // if there are no more characters in mask, don't add character to input field
    return false;
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

  // Converts case of letter in an input field according to the caseMask
  // Parameters:
  //   inputObj - the input element being edited
  //   e - event object fired by key process
  //   chr - the character just typed
  //   index - the location in the input field of the character just typed
  //   maskInfo - the maskInfo object containing the caseMask
  convertLetterCase: function(inputObj, chr, index, maskInfo) {
    inputObj.value = insertCharAt(inputObj.value, index, inputMask.convertedLetterCase(chr, maskInfo.caseMask.charAt(index)));
  },

  // Converts a single letter according to a letter case mask
  // Parameters:
  //   c - the character to potentially convert
  //   lCase - letter case mask
  //      '>' for convert to uppercase
  //      '<' for convert to lowercase
  //      otherwise do not convert
  // Returns: converted character
  convertedLetterCase: function(c, lCase) {
    if (lCase === '>') {
      return c.toUpperCase();
    }
    if (lCase === '<') {
      return c.toLowerCase();
    }
    return c;
  },

  // Processes a raw mask into a component masks where each is of the length of the desired input
  // Parameter:
  //   mask - raw input mask (MS Access style)
  // Returns:
  //   maskInfo object containing codes for corresponding locations in the input:
  //     .symbolMask - mask containing all wildcard symbols (indicating decimals, letters, etc.)
  //     .literalMask - mask containing framework characters (parens, colons, literal text, etc.)
  //     .caseMask - mask containing case conversion symbols ('>', '<')
  getMaskInfo: function(mask) {
    var i;
    var maskInfo = {};

    // strip the mask of escape characters to find actual input length
    var strippedMask = mask;
    for (i = 0; i < inputMask.escapeSymbolList.length; i++) {
      strippedMask = strippedMask.replaceAll(inputMask.escapeSymbolList.charAt(i), '');
    }

    // create blank masks of the proper length
    maskInfo.symbolMask = ' '.repeat(strippedMask.length);
    maskInfo.literalMask = ' '.repeat(strippedMask.length);
    maskInfo.caseMask = ' '.repeat(strippedMask.length);

    // char to keep track of running case conversions
    var letterCase = ' ';

    // character index number of target mask, may be different from index in source mask
    var targetI = 0;

    // process characters in source mask
    for (i = 0; i < mask.length; i++) {
      var c = mask[i];
      switch (c) {
        // case conversion
        case '>':
        case '<':
          letterCase = c;
          break;
        case '^':
          letterCase = ' ';
          break;

        // left to right --- why is this necessary? -- left to right is normal, right?
        case '!':
          // todo: implement behavior
          break;

        // 1 char literal
        case '\\':
          // grab character after backslash
          i++;
          maskInfo.literalMask = setCharAt(maskInfo.literalMask, targetI, mask[i]);
          // increment target mask index because of char added to literal mask
          targetI++;
          break;

        // multichar literal
        case '"':
          // continue to iterate through source mask until closing quotation mark
          for (var j = i + 1; j < mask.length; j++) {
            if (mask[j] === '"') {
              // Add characters in quotes to target literal mask without the quotes
              maskInfo.literalMask = setCharsAt(maskInfo.literalMask, targetI, mask.substring(i+1, j));
              // Advance index in target mask by literal string length
              // Ex - '"Abc"1234'
              //   i = 0; j starts at 1 to ignore opening quote in searching for closing quote
              //   Closing quote is at 4
              //   Literal string length is 3 (4 - 0 - 1)
              //   Intuitively, we might subtract 2 for 2 quotes, but j is position in front of the second quote
              //   and thus j-i only encompasses the opening quote.
              targetI += j-i-1;

              // Advance count in source mask to beginning of second quote;
              // i++ in for loop will move to next character
              i = j;
              break;
            }
          }
          break;

        // not escape character
        default:
          // add symbols to symbol mask
          if (inputMask.symbolList.includes(c)) {
            maskInfo.symbolMask = setCharAt(maskInfo.symbolMask, targetI, c);
          }
          // add literals to literal mask
          else {
            maskInfo.literalMask = setCharAt(maskInfo.literalMask, targetI, c);
          }
          targetI++;
      }

      // Update case mask at target index according to most recent case control char
      maskInfo.caseMask = setCharAt(maskInfo.caseMask, targetI, letterCase);
    }

    return maskInfo;
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

// Sets the character at a given index in a string
// Parameters:
//   str - the string whose character to replace
//   index - the index at which to replace the character
//   chr - the character to substitute in at the index of str
// Returns: the string with the character replaced
//   Will return original string without replacement if index is out of range
function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + chr + str.substr(index+1);
}

// Sets or appends multiple characters at a given index in a string
// Parameters:
//   str - the string whose character to replace
//   index - the index at which to replace the character
//   chr - the character to substitute in at the index of str
// Returns: the string with the character replaced
//   Will append on end of string if index is equal to length of string
//   Will return original string if index is greater than length of string
function setCharsAt(str, index, chrs) {
  if (index > str.length) return str;
  return str.substr(0, index) + chrs + str.substr(index+chrs.length);
}

// Inserts character(s) at a given index in a string (does not replace)
//   str - the string into which to insert character
//   index - the index at which to insert the character
//   chr - the character(s) to insert at the index of str
function insertCharAt(str, index, chr) {
  return str.substr(0, index) + chr + str.substr(index);
}

// Extends String class to search the String object and replace all occurrences of
// one substring with another
// Paramaters:
//   origString - the string to search for
//   newString - the string to substitute in place of origString
String.prototype.replaceAll = function (origString, newString) {
  if (origString === '\\') {
    origString = '\\\\';
  }
  return this.replace(new RegExp(origString, 'g'), newString);
};
