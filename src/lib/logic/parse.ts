/**
 * A small Prolog-flavoured parser for authoring the knowledge base as text.
 *
 * The KB will eventually hold thousands of clauses. Writing those as nested
 * JSON term objects would be unreadable and unreviewable by a human scholar,
 * which defeats the point of an explainable engine. So clauses are authored as:
 *
 *     % Mistreating kin is forbidden.
 *     ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), harm).
 *     kin(mother, ego).
 *
 * Deliberately omitted: operators, lists, cut, arithmetic, negation-as-failure.
 * None are needed for a Horn-clause fiqh KB, and each one is a way for a rule
 * to mean something other than what it appears to mean.
 */

import { atom, lit, struct, v } from "./term";
import type { Clause, Literal, Term } from "./types";

export class ParseError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly column: number,
    readonly source?: string
  ) {
    const where = source ? `${source}:${line}:${column}` : `${line}:${column}`;
    super(`${where}: ${message}`);
    this.name = "ParseError";
  }
}

type TokenType =
  | "atom"
  | "var"
  | "number"
  | "string"
  | "lparen"
  | "rparen"
  | "comma"
  | "dot"
  | "implies"
  | "eof";

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const IDENT_START = /[A-Za-z_]/;
const IDENT_REST = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

function tokenize(input: string, sourceName?: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const fail = (msg: string): never => {
    throw new ParseError(msg, line, column, sourceName);
  };

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (input[i] === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      i++;
    }
  };

  while (i < input.length) {
    const ch = input[i];

    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // Comments run to end of line.
    if (ch === "%") {
      while (i < input.length && input[i] !== "\n") advance();
      continue;
    }

    // Block comments.
    if (ch === "/" && input[i + 1] === "*") {
      const startLine = line;
      const startCol = column;
      advance(2);
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) advance();
      if (i >= input.length) {
        throw new ParseError("unterminated block comment", startLine, startCol, sourceName);
      }
      advance(2);
      continue;
    }

    const startLine = line;
    const startCol = column;

    if (ch === "(") {
      advance();
      tokens.push({ type: "lparen", value: "(", line: startLine, column: startCol });
      continue;
    }
    if (ch === ")") {
      advance();
      tokens.push({ type: "rparen", value: ")", line: startLine, column: startCol });
      continue;
    }
    if (ch === ",") {
      advance();
      tokens.push({ type: "comma", value: ",", line: startLine, column: startCol });
      continue;
    }
    if (ch === ".") {
      // A clause terminator must be followed by whitespace or EOF, so that
      // decimals inside numbers are not mistaken for it.
      const next = input[i + 1];
      if (next === undefined || /\s/.test(next) || next === "%") {
        advance();
        tokens.push({ type: "dot", value: ".", line: startLine, column: startCol });
        continue;
      }
      fail("unexpected '.' (clause terminator must be followed by whitespace)");
    }
    if (ch === ":" && input[i + 1] === "-") {
      advance(2);
      tokens.push({ type: "implies", value: ":-", line: startLine, column: startCol });
      continue;
    }

    // Quoted atom: 'like this'
    if (ch === "'") {
      advance();
      let value = "";
      while (i < input.length && input[i] !== "'") {
        if (input[i] === "\\") {
          advance();
          if (i >= input.length) fail("unterminated escape in quoted atom");
          value += input[i];
          advance();
        } else {
          value += input[i];
          advance();
        }
      }
      if (i >= input.length) {
        throw new ParseError("unterminated quoted atom", startLine, startCol, sourceName);
      }
      advance(); // closing quote
      tokens.push({ type: "atom", value, line: startLine, column: startCol });
      continue;
    }

    // String literal: "like this"
    if (ch === '"') {
      advance();
      let value = "";
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\") {
          advance();
          if (i >= input.length) fail("unterminated escape in string");
          const esc = input[i];
          value += esc === "n" ? "\n" : esc === "t" ? "\t" : esc;
          advance();
        } else {
          value += input[i];
          advance();
        }
      }
      if (i >= input.length) {
        throw new ParseError("unterminated string literal", startLine, startCol, sourceName);
      }
      advance(); // closing quote
      tokens.push({ type: "string", value, line: startLine, column: startCol });
      continue;
    }

    if (DIGIT.test(ch) || (ch === "-" && DIGIT.test(input[i + 1] ?? ""))) {
      let value = "";
      if (ch === "-") {
        value += "-";
        advance();
      }
      while (i < input.length && DIGIT.test(input[i])) {
        value += input[i];
        advance();
      }
      if (input[i] === "." && DIGIT.test(input[i + 1] ?? "")) {
        value += ".";
        advance();
        while (i < input.length && DIGIT.test(input[i])) {
          value += input[i];
          advance();
        }
      }
      tokens.push({ type: "number", value, line: startLine, column: startCol });
      continue;
    }

    if (IDENT_START.test(ch)) {
      let value = "";
      while (i < input.length && IDENT_REST.test(input[i])) {
        value += input[i];
        advance();
      }
      // Prolog convention: uppercase or leading underscore means variable.
      const isVariable = /[A-Z_]/.test(value[0]);
      tokens.push({
        type: isVariable ? "var" : "atom",
        value,
        line: startLine,
        column: startCol,
      });
      continue;
    }

    fail(`unexpected character ${JSON.stringify(ch)}`);
  }

  tokens.push({ type: "eof", value: "", line, column });
  return tokens;
}

/** Each `_` is a distinct variable, so they need unique names. */
let anonCounter = 0;

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly sourceName?: string
  ) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType, what: string): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new ParseError(
        `expected ${what} but found ${t.type === "eof" ? "end of input" : JSON.stringify(t.value)}`,
        t.line,
        t.column,
        this.sourceName
      );
    }
    return this.next();
  }

  atEnd(): boolean {
    return this.peek().type === "eof";
  }

  private parseTerm(): Term {
    const t = this.next();
    switch (t.type) {
      case "var":
        return t.value === "_" ? v(`_anon${anonCounter++}`) : v(t.value);
      case "number":
        return lit(Number(t.value));
      case "string":
        return lit(t.value);
      case "atom": {
        if (this.peek().type === "lparen") {
          const args = this.parseArgs();
          return struct(t.value, ...args);
        }
        return atom(t.value);
      }
      default:
        throw new ParseError(
          `expected a term but found ${t.type === "eof" ? "end of input" : JSON.stringify(t.value)}`,
          t.line,
          t.column,
          this.sourceName
        );
    }
  }

  private parseArgs(): Term[] {
    this.expect("lparen", "'('");
    const args: Term[] = [];
    if (this.peek().type === "rparen") {
      const t = this.peek();
      throw new ParseError(
        "empty argument list; write a bare atom instead of `f()`",
        t.line,
        t.column,
        this.sourceName
      );
    }
    for (;;) {
      args.push(this.parseTerm());
      if (this.peek().type === "comma") {
        this.next();
        continue;
      }
      break;
    }
    this.expect("rparen", "')'");
    return args;
  }

  private parseLiteral(): Literal {
    const t = this.peek();
    if (t.type !== "atom") {
      throw new ParseError(
        `a goal must start with a predicate name, found ${
          t.type === "var" ? `variable ${t.value}` : JSON.stringify(t.value)
        }`,
        t.line,
        t.column,
        this.sourceName
      );
    }
    this.next();
    if (this.peek().type === "lparen") {
      return { predicate: t.value, args: this.parseArgs() };
    }
    return { predicate: t.value, args: [] };
  }

  parseClause(idFor: (index: number) => string, index: number): Clause {
    const head = this.parseLiteral();
    const body: Literal[] = [];
    if (this.peek().type === "implies") {
      this.next();
      for (;;) {
        body.push(this.parseLiteral());
        if (this.peek().type === "comma") {
          this.next();
          continue;
        }
        break;
      }
    }
    this.expect("dot", "'.' at end of clause");
    return { id: idFor(index), head, body };
  }
}

export interface ParseOptions {
  /** Shown in error messages, e.g. the KB filename. */
  sourceName?: string;
  /**
   * Generates the clause id used to join into the evidence store.
   * Defaults to `<sourceName|clause>:<index>`.
   */
  idFor?: (index: number) => string;
}

/** Parses a whole KB source file into clauses. */
export function parseProgram(source: string, options: ParseOptions = {}): Clause[] {
  const { sourceName } = options;
  const idFor = options.idFor ?? ((index: number) => `${sourceName ?? "clause"}:${index}`);
  const parser = new Parser(tokenize(source, sourceName), sourceName);
  const clauses: Clause[] = [];
  while (!parser.atEnd()) {
    clauses.push(parser.parseClause(idFor, clauses.length));
  }
  return clauses;
}

/** Parses exactly one clause. Throws if the source holds more than one. */
export function parseClause(source: string, id = "clause:0"): Clause {
  const clauses = parseProgram(source, { idFor: () => id });
  if (clauses.length !== 1) {
    throw new ParseError(`expected exactly one clause, found ${clauses.length}`, 1, 1);
  }
  return clauses[0];
}

/**
 * Parses a query: one or more comma-separated goals, with an optional
 * trailing '.'. This is what the NL-to-goal stage produces.
 */
export function parseQuery(source: string, sourceName = "query"): readonly Literal[] {
  const trimmed = source.trim();
  const withDot = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  // Reuse clause parsing by treating the query as a headless body. The wrapper
  // head must be lowercase or the tokenizer reads it as a variable.
  const parser = new Parser(tokenize(`query :- ${withDot}`, sourceName), sourceName);
  const clause = parser.parseClause(() => "query", 0);
  if (!parser.atEnd()) {
    throw new ParseError("trailing input after query", 1, 1, sourceName);
  }
  if (clause.body.length === 0) {
    throw new ParseError("query is empty", 1, 1, sourceName);
  }
  return clause.body;
}

/** Parses a single term. Useful for tests and for NL-extracted arguments. */
export function parseTerm(source: string): Term {
  const goals = parseQuery(`wrapper(${source})`);
  return goals[0].args[0];
}
