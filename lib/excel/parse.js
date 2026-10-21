// Transforme les jetons en arbre syntaxique, par précédence grimpante.

import { T, tokenize, FormulaError } from './tokenize.js';

// Du moins liant au plus liant.
const BINARY = {
  '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1,
  '&': 2,
  '+': 3, '-': 3,
  '*': 4, '/': 4,
  '^': 5,
};

const RIGHT_ASSOC = new Set(['^']);

export function parse(input) {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (type, label) => {
    const t = tokens[pos];
    if (!t || t.type !== type) {
      throw new FormulaError(`${label} attendu`, pos);
    }
    return tokens[pos++];
  };

  function parseExpression(minPrec = 0) {
    let left = parseUnary();

    while (true) {
      const t = peek();
      if (!t || t.type !== T.OP) break;
      const prec = BINARY[t.value];
      if (prec === undefined || prec < minPrec) break;
      next();
      const nextMin = RIGHT_ASSOC.has(t.value) ? prec : prec + 1;
      const right = parseExpression(nextMin);
      left = { type: 'binary', op: t.value, left, right };
    }

    return left;
  }

  function parseUnary() {
    const t = peek();
    if (t && t.type === T.OP && (t.value === '-' || t.value === '+') && t.unary) {
      next();
      // l'unaire lie plus fort que *, moins fort que ^
      const operand = parseExpression(5);
      return t.value === '-' ? { type: 'unary', op: '-', operand } : operand;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = next();
    if (!t) throw new FormulaError('Formule incomplète', pos);

    switch (t.type) {
      case T.NUM:
        return { type: 'number', value: t.value };
      case T.STR:
        return { type: 'string', value: t.value };
      case T.BOOL:
        return { type: 'boolean', value: t.value };
      case T.ERROR:
        return { type: 'error', value: t.value };
      case T.REF:
        return { type: 'ref', name: t.value, named: !!t.named };
      case T.RANGE:
        return { type: 'range', name: t.value };
      case T.LPAREN: {
        const inner = parseExpression(0);
        expect(T.RPAREN, 'Parenthèse fermante');
        return inner;
      }
      case T.FUNC: {
        expect(T.LPAREN, 'Parenthèse ouvrante');
        const args = [];
        if (peek() && peek().type !== T.RPAREN) {
          args.push(parseExpression(0));
          while (peek() && peek().type === T.SEP) {
            next();
            // argument omis : SI(A1;;0)
            if (peek() && (peek().type === T.SEP || peek().type === T.RPAREN)) {
              args.push({ type: 'omitted' });
            } else {
              args.push(parseExpression(0));
            }
          }
        }
        expect(T.RPAREN, 'Parenthèse fermante');
        return { type: 'call', name: t.value, args };
      }
      default:
        throw new FormulaError('Élément inattendu dans la formule', pos);
    }
  }

  const ast = parseExpression(0);
  if (pos < tokens.length) {
    throw new FormulaError('Caractères en trop à la fin de la formule', pos);
  }
  return ast;
}

export { FormulaError };
