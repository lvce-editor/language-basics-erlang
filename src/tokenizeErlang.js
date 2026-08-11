/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
  InsideDoubleQuoteString: 2,
  InsideQuotedAtom: 3,
}

/**
 * @enum number
 */
export const TokenType = {
  None: 1,
  Whitespace: 2,
  PunctuationString: 3,
  String: 4,
  Keyword: 5,
  Numeric: 6,
  Punctuation: 7,
  VariableName: 8,
  Comment: 9,
  Text: 10,
  LanguageConstant: 11,
  Function: 12,
  KeywordControl: 13,
  Macro: 14,
}

export const TokenMap = {
  [TokenType.None]: 'None',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.PunctuationString]: 'PunctuationString',
  [TokenType.String]: 'String',
  [TokenType.Keyword]: 'Keyword',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.VariableName]: 'VariableName',
  [TokenType.Comment]: 'Comment',
  [TokenType.Text]: 'Text',
  [TokenType.LanguageConstant]: 'LanguageConstant',
  [TokenType.Function]: 'Function',
  [TokenType.KeywordControl]: 'KeywordControl',
  [TokenType.Macro]: 'Macro',
}

const RE_WHITESPACE = /^\s+/
const RE_COMMENT = /^%.*/
const RE_CONTROL_KEYWORD =
  /^(?:after|begin|case|catch|cond|else|end|fun|if|let|maybe|of|receive|try|when)\b/
const RE_KEYWORD =
  /^(?:and|andalso|band|bnot|bor|bsl|bsr|bxor|div|not|or|orelse|rem|xor)\b/
const RE_MACRO = /^\?(?:[a-zA-Z_][a-zA-Z\d_@]*|'(?:\\.|[^'\\])*')/
const RE_NUMBER =
  /^(?:\d+#[\da-zA-Z]+(?:#[\da-zA-Z]+)?|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?)/
const RE_VARIABLE = /^[A-Z_][a-zA-Z\d_@]*/
const RE_ATOM = /^[a-z][a-zA-Z\d_@]*/
const RE_CHARACTER =
  /^\$(?:\\(?:[0-7]{1,3}|x\{[\da-fA-F]+\}|x[\da-fA-F]{2}|.)|.)/u
const RE_CONTROL_OPERATOR = /^(?:->|<-)/
const RE_PUNCTUATION =
  /^(?:=:=|=\/=|<<|>>|\+\+|--|==|\/=|=<|>=|:=|=>|::|\|\||[()[\]{},.;:+\-*\/=<>!#|&^~])/
const RE_STRING_CONTENT = /^(?:\\.|[^"\\])+/u
const RE_QUOTED_ATOM_CONTENT = /^(?:\\.|[^'\\])+/u
const RE_UNKNOWN = /^./u

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
  stack: [],
}

export const hasArrayReturn = true

/**
 * @param {any} lineStateA
 * @param {any} lineStateB
 */
export const isEqualLineState = (lineStateA, lineStateB) => {
  return lineStateA.state === lineStateB.state
}

/**
 * @param {string} line
 * @param {number} index
 */
const isAttributeName = (line, index) => {
  return line.slice(0, index).trim() === '-'
}

/**
 * @param {string} line
 * @param {number} index
 */
const getNextCharacter = (line, index) => {
  return line.slice(index).match(/^\s*(.)/u)?.[1]
}

/**
 * @param {string} line
 * @param {any} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let index = 0
  const tokens = []
  let state = lineState.state

  while (index < line.length) {
    const part = line.slice(index)
    let next
    let token

    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
        } else if ((next = part.match(RE_COMMENT))) {
          token = TokenType.Comment
        } else if ((next = part.match(RE_CONTROL_KEYWORD))) {
          token = TokenType.KeywordControl
        } else if ((next = part.match(RE_KEYWORD))) {
          token = TokenType.Keyword
        } else if ((next = part.match(RE_MACRO))) {
          token = TokenType.Macro
        } else if ((next = part.match(RE_CHARACTER))) {
          token = TokenType.String
        } else if ((next = part.match(RE_NUMBER))) {
          token = TokenType.Numeric
        } else if ((next = part.match(RE_VARIABLE))) {
          token = TokenType.VariableName
        } else if ((next = part.match(RE_ATOM))) {
          const nextCharacter = getNextCharacter(line, index + next[0].length)
          if (isAttributeName(line, index)) {
            token = TokenType.Keyword
          } else if (nextCharacter === '(' || nextCharacter === '/') {
            token = TokenType.Function
          } else {
            token = TokenType.LanguageConstant
          }
        } else if (part.startsWith('"')) {
          next = ['"']
          token = TokenType.PunctuationString
          state = State.InsideDoubleQuoteString
        } else if (part.startsWith("'")) {
          next = ["'"]
          token = TokenType.PunctuationString
          state = State.InsideQuotedAtom
        } else if ((next = part.match(RE_CONTROL_OPERATOR))) {
          token = TokenType.KeywordControl
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
        } else if ((next = part.match(RE_UNKNOWN))) {
          token = TokenType.Text
        } else {
          throw new Error('failed to tokenize Erlang source')
        }
        break

      case State.InsideDoubleQuoteString:
        if (part.startsWith('"')) {
          next = ['"']
          token = TokenType.PunctuationString
          state = State.TopLevelContent
        } else if ((next = part.match(RE_STRING_CONTENT))) {
          token = TokenType.String
        } else {
          throw new Error('failed to tokenize Erlang string')
        }
        break

      case State.InsideQuotedAtom:
        if (part.startsWith("'")) {
          next = ["'"]
          token = TokenType.PunctuationString
          state = State.TopLevelContent
        } else if ((next = part.match(RE_QUOTED_ATOM_CONTENT))) {
          token = TokenType.LanguageConstant
        } else {
          throw new Error('failed to tokenize quoted Erlang atom')
        }
        break

      default:
        throw new Error(`unknown Erlang tokenizer state: ${state}`)
    }

    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }

  return {
    state,
    tokens,
    stack: lineState.stack,
  }
}
