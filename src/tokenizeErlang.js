/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
}

/**
 * @enum number
 */
export const TokenType = {
  Whitespace: 2,
  Punctuation: 3,
  CurlyOpen: 6,
  CurlyClose: 7,
  Variable: 10,
  None: 57,
  Unknown: 881,
  Numeric: 883,
  NewLine: 884,
  Comment: 885,
  Query: 886,
  Text: 887,
  CssSelectorId: 889,
  FuntionName: 890,
  String: 891,
  KeywordImport: 892,
}

export const TokenMap = {
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.CurlyOpen]: 'Punctuation',
  [TokenType.CurlyClose]: 'Punctuation',
  [TokenType.Variable]: 'VariableName',
  [TokenType.None]: 'None',
  [TokenType.Unknown]: 'Unknown',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.NewLine]: 'NewLine',
  [TokenType.Comment]: 'Comment',
  [TokenType.Query]: 'CssAtRule',
  [TokenType.Text]: 'Text',
  [TokenType.CssSelectorId]: 'CssSelectorId',
  [TokenType.FuntionName]: 'Function',
  [TokenType.String]: 'String',
  [TokenType.KeywordImport]: 'KeywordImport',
}

const RE_ANYTHING = /^.+/s
const RE_LINE_COMMENT = /^%.*/
const RE_NUMERIC =
  /^((0(x|X)[0-9a-fA-F]*)|(([0-9]+\.?[0-9]*)|(\.[0-9]+))((e|E)(\+|-)?[0-9]+)?)\b/

const RE_WHITESPACE = /^\s+/
const RE_VARIABLE_NAME = /^[a-zA-Z_$][a-zA-Z\d\_]*/
const RE_PUNCTUATION = /^[\(\)=\+\-><\.:;\{\}\[\]!,&\|\^\?\*%~]/

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
  stack: [],
}

/**
 * @param {any} lineStateA
 * @param {any} lineStateB
 */
export const isEqualLineState = (lineStateA, lineStateB) => {
  return lineStateA.state === lineStateB.state
}

export const hasArrayReturn = true

/**
 * @param {string} line
 * @param {any} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  const stack = lineState.stack
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Variable
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Unknown
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      default:
        console.log({ state, line })
        throw new Error('no')
    }
    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  return {
    state,
    tokens,
    stack,
  }
}

// TODO test :hover, :after, :before, ::first-letter

// TODO test complex background image url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23b64e4e'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")
