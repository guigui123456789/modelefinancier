// Bibliothèque de fonctions. Chaque fonction est enregistrée sous son nom
// anglais et son nom français : l'apprenant écrit dans la langue de son Excel.

import {
  ERR, ExcelError, isError, isBlank, flatten, firstError,
  toNumber, toText, toBoolean, numbersOnly, compare, criterion,
} from './values.js';

const FN = {};

/**
 * @param names  noms acceptés, anglais puis français
 * @param impl   reçoit les arguments déjà évalués
 * @param opts   lazy: reçoit des fonctions à appeler (pour SI, SIERREUR)
 */
function def(names, impl, opts = {}) {
  const entry = { impl, lazy: !!opts.lazy, minArgs: opts.minArgs ?? 0 };
  names.forEach((n) => { FN[n.toUpperCase()] = entry; });
}

/** Enveloppe qui propage les erreurs et convertit en nombres. */
const nums = (fn) => (...args) => {
  const e = firstError(args);
  if (e) return e;
  return fn(numbersOnly(args), args);
};

// ---------- mathématiques et statistiques ----------
def(['SUM', 'SOMME'], nums((xs) => xs.reduce((a, b) => a + b, 0)));

def(['AVERAGE', 'MOYENNE'], nums((xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : ERR.div0())));

def(['MIN'], nums((xs) => (xs.length ? Math.min(...xs) : 0)));
def(['MAX'], nums((xs) => (xs.length ? Math.max(...xs) : 0)));

def(['COUNT', 'NB'], (...args) => numbersOnly(args).length);
def(['COUNTA', 'NBVAL'], (...args) => flatten(args).filter((v) => !isBlank(v)).length);
def(['COUNTBLANK', 'NB.VIDE'], (...args) => flatten(args).filter(isBlank).length);

def(['LARGE', 'GRANDE.VALEUR'], (range, k) => {
  const n = toNumber(k);
  if (isError(n)) return n;
  const xs = numbersOnly([range]).sort((a, b) => b - a);
  return n >= 1 && n <= xs.length ? xs[n - 1] : ERR.num();
});

def(['SMALL', 'PETITE.VALEUR'], (range, k) => {
  const n = toNumber(k);
  if (isError(n)) return n;
  const xs = numbersOnly([range]).sort((a, b) => a - b);
  return n >= 1 && n <= xs.length ? xs[n - 1] : ERR.num();
});

def(['RANK', 'RANG', 'RANK.EQ'], (v, range, order) => {
  const x = toNumber(v);
  if (isError(x)) return x;
  const asc = order !== undefined && toNumber(order) !== 0;
  const xs = numbersOnly([range]).sort((a, b) => (asc ? a - b : b - a));
  const i = xs.indexOf(x);
  return i === -1 ? ERR.na() : i + 1;
});

def(['PERCENTILE', 'CENTILE', 'PERCENTILE.INC'], (range, p) => {
  const k = toNumber(p);
  if (isError(k)) return k;
  const xs = numbersOnly([range]).sort((a, b) => a - b);
  if (!xs.length || k < 0 || k > 1) return ERR.num();
  const pos = k * (xs.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo);
});

def(['MEDIAN', 'MEDIANE'], nums((xs) => {
  if (!xs.length) return ERR.num();
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}));

def(['STDEV', 'ECARTYPE', 'STDEV.S'], nums((xs) => {
  if (xs.length < 2) return ERR.div0();
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1));
}));

def(['VAR', 'VAR.S'], nums((xs) => {
  if (xs.length < 2) return ERR.div0();
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1);
}));

def(['ABS'], (v) => { const n = toNumber(v); return isError(n) ? n : Math.abs(n); });
def(['SQRT', 'RACINE'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  return n < 0 ? ERR.num() : Math.sqrt(n);
});
def(['POWER', 'PUISSANCE'], (a, b) => {
  const x = toNumber(a), y = toNumber(b);
  if (isError(x)) return x;
  if (isError(y)) return y;
  return x ** y;
});
def(['EXP'], (v) => { const n = toNumber(v); return isError(n) ? n : Math.exp(n); });
def(['LN'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  return n <= 0 ? ERR.num() : Math.log(n);
});
def(['LOG'], (v, base) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  const b = base === undefined ? 10 : toNumber(base);
  if (isError(b)) return b;
  return n <= 0 ? ERR.num() : Math.log(n) / Math.log(b);
});

const roundTo = (n, d) => {
  const f = 10 ** d;
  // arrondi commercial : 2,5 → 3, comme Excel, pas comme JS
  return Math.sign(n) * Math.round(Math.abs(n) * f + Number.EPSILON) / f;
};

def(['ROUND', 'ARRONDI'], (v, d) => {
  const n = toNumber(v), dd = toNumber(d ?? 0);
  if (isError(n)) return n;
  if (isError(dd)) return dd;
  return roundTo(n, dd);
});
def(['ROUNDUP', 'ARRONDI.SUP'], (v, d) => {
  const n = toNumber(v), dd = toNumber(d ?? 0);
  if (isError(n)) return n;
  const f = 10 ** dd;
  return Math.sign(n) * Math.ceil(Math.abs(n) * f - Number.EPSILON) / f;
});
def(['ROUNDDOWN', 'ARRONDI.INF'], (v, d) => {
  const n = toNumber(v), dd = toNumber(d ?? 0);
  if (isError(n)) return n;
  const f = 10 ** dd;
  return Math.sign(n) * Math.floor(Math.abs(n) * f + Number.EPSILON) / f;
});
def(['INT', 'ENT'], (v) => { const n = toNumber(v); return isError(n) ? n : Math.floor(n); });
def(['MOD'], (a, b) => {
  const x = toNumber(a), y = toNumber(b);
  if (isError(x)) return x;
  if (isError(y)) return y;
  if (y === 0) return ERR.div0();
  return x - y * Math.floor(x / y);
});

def(['SUMPRODUCT', 'SOMMEPROD'], (...args) => {
  const e = firstError(args);
  if (e) return e;
  const arrays = args.map((a) => (Array.isArray(a) ? flatten([a]) : [a]));
  const len = Math.max(...arrays.map((a) => a.length));
  let total = 0;
  for (let i = 0; i < len; i++) {
    let p = 1;
    for (const arr of arrays) {
      const v = arr.length === 1 ? arr[0] : arr[i];
      const n = typeof v === 'boolean' ? (v ? 1 : 0) : typeof v === 'number' ? v : 0;
      p *= n;
    }
    total += p;
  }
  return total;
});

// ---------- conditionnelles ----------
def(['IF', 'SI'], (cond, yes, no) => {
  const c = toBoolean(cond());
  if (isError(c)) return c;
  if (c) return yes ? yes() : true;
  return no ? no() : false;
}, { lazy: true });

def(['IFERROR', 'SIERREUR'], (val, fallback) => {
  let v;
  try { v = val(); } catch { return fallback ? fallback() : ERR.na(); }
  return isError(v) ? (fallback ? fallback() : '') : v;
}, { lazy: true });

def(['IFNA', 'SI.NON.DISP'], (val, fallback) => {
  const v = val();
  return isError(v) && v.code === '#N/A' ? fallback() : v;
}, { lazy: true });

def(['IFS', 'SI.CONDITIONS'], (...args) => {
  for (let i = 0; i + 1 < args.length; i += 2) {
    const c = toBoolean(args[i]());
    if (isError(c)) return c;
    if (c) return args[i + 1]();
  }
  return ERR.na();
}, { lazy: true });

def(['AND', 'ET'], (...args) => {
  const e = firstError(args);
  if (e) return e;
  const vals = flatten(args).filter((v) => !isBlank(v));
  return vals.every((v) => toBoolean(v) === true);
});
def(['OR', 'OU'], (...args) => {
  const e = firstError(args);
  if (e) return e;
  return flatten(args).filter((v) => !isBlank(v)).some((v) => toBoolean(v) === true);
});
def(['NOT', 'NON'], (v) => { const b = toBoolean(v); return isError(b) ? b : !b; });

def(['ISERROR', 'ESTERREUR'], (v) => isError(v));
def(['ISNA', 'ESTNA'], (v) => isError(v) && v.code === '#N/A');
def(['ISBLANK', 'ESTVIDE'], (v) => isBlank(Array.isArray(v) ? v[0] : v));
def(['ISNUMBER', 'ESTNUM'], (v) => typeof (Array.isArray(v) ? v[0] : v) === 'number');
def(['ISTEXT', 'ESTTEXTE'], (v) => typeof (Array.isArray(v) ? v[0] : v) === 'string');

// ---------- recherche ----------
def(['VLOOKUP', 'RECHERCHEV'], (needle, table, colIndex, approx) => {
  const e = firstError([needle, colIndex]);
  if (e) return e;
  if (!Array.isArray(table) || !Array.isArray(table[0])) return ERR.ref();
  const col = toNumber(colIndex);
  if (isError(col)) return col;
  if (col < 1 || col > table[0].length) return ERR.ref();
  const isApprox = approx === undefined ? true : toBoolean(approx) === true;

  if (!isApprox) {
    for (const row of table) {
      if (compare(row[0], needle) === 0) return row[col - 1];
    }
    return ERR.na();
  }
  let best = null;
  for (const row of table) {
    if (compare(row[0], needle) <= 0) best = row;
    else break;
  }
  return best ? best[col - 1] : ERR.na();
});

def(['HLOOKUP', 'RECHERCHEH'], (needle, table, rowIndex, approx) => {
  if (!Array.isArray(table) || !Array.isArray(table[0])) return ERR.ref();
  const r = toNumber(rowIndex);
  if (isError(r)) return r;
  if (r < 1 || r > table.length) return ERR.ref();
  const header = table[0];
  const exact = approx === undefined ? false : toBoolean(approx) !== true;
  for (let c = 0; c < header.length; c++) {
    if (compare(header[c], needle) === 0) return table[r - 1][c];
  }
  if (exact) return ERR.na();
  let best = -1;
  for (let c = 0; c < header.length; c++) {
    if (compare(header[c], needle) <= 0) best = c;
  }
  return best >= 0 ? table[r - 1][best] : ERR.na();
});

def(['INDEX'], (array, rowNum, colNum) => {
  if (isError(array)) return array;
  const r = toNumber(rowNum ?? 0);
  if (isError(r)) return r;
  const c = colNum === undefined ? null : toNumber(colNum);
  if (isError(c)) return c;

  if (!Array.isArray(array)) return r <= 1 ? array : ERR.ref();

  const is2d = Array.isArray(array[0]);
  if (!is2d) {
    const flat = array;
    const idx = (c !== null && r === 0) ? c : r;
    if (idx < 1 || idx > flat.length) return ERR.ref();
    return flat[idx - 1];
  }
  if (r === 0 && c !== null) {
    // colonne entière
    if (c < 1 || c > array[0].length) return ERR.ref();
    return array.map((row) => row[c - 1]);
  }
  if (r < 1 || r > array.length) return ERR.ref();
  const row = array[r - 1];
  if (c === null) return row.length === 1 ? row[0] : row;
  if (c < 1 || c > row.length) return ERR.ref();
  return row[c - 1];
});

def(['MATCH', 'EQUIV'], (needle, array, type) => {
  if (isError(needle)) return needle;
  const t = type === undefined ? 1 : toNumber(type);
  if (isError(t)) return t;
  const flat = flatten([array]);

  if (t === 0) {
    const wild = typeof needle === 'string' && /[*?]/.test(needle);
    const test = wild ? criterion(needle) : (v) => compare(v, needle) === 0;
    const i = flat.findIndex(test);
    return i === -1 ? ERR.na() : i + 1;
  }
  if (t === 1) {
    let best = -1;
    for (let i = 0; i < flat.length; i++) {
      if (compare(flat[i], needle) <= 0) best = i; else break;
    }
    return best === -1 ? ERR.na() : best + 1;
  }
  let best = -1;
  for (let i = 0; i < flat.length; i++) {
    if (compare(flat[i], needle) >= 0) best = i; else break;
  }
  return best === -1 ? ERR.na() : best + 1;
});

def(['XLOOKUP', 'RECHERCHEX'], (needle, lookupArr, returnArr, ifNotFound) => {
  const look = flatten([lookupArr]);
  const ret = Array.isArray(returnArr) && Array.isArray(returnArr[0])
    ? returnArr
    : flatten([returnArr]);
  const i = look.findIndex((v) => compare(v, needle) === 0);
  if (i === -1) return ifNotFound !== undefined ? ifNotFound : ERR.na();
  return Array.isArray(ret[0]) ? ret[i] : ret[i];
});

def(['CHOOSE', 'CHOISIR'], (idx, ...options) => {
  const i = toNumber(idx);
  if (isError(i)) return i;
  if (i < 1 || i > options.length) return ERR.value();
  return options[i - 1];
});

// ---------- agrégations conditionnelles ----------
const pairUp = (args, start) => {
  const pairs = [];
  for (let i = start; i + 1 < args.length; i += 2) {
    pairs.push([flatten([args[i]]), criterion(args[i + 1])]);
  }
  return pairs;
};

const matchingIndexes = (pairs, length) => {
  const out = [];
  for (let i = 0; i < length; i++) {
    if (pairs.every(([arr, test]) => test(arr[i]))) out.push(i);
  }
  return out;
};

def(['SUMIF', 'SOMME.SI'], (range, crit, sumRange) => {
  const src = flatten([range]);
  const target = sumRange === undefined ? src : flatten([sumRange]);
  const test = criterion(crit);
  let total = 0;
  src.forEach((v, i) => {
    if (test(v) && typeof target[i] === 'number') total += target[i];
  });
  return total;
});

def(['SUMIFS', 'SOMME.SI.ENS'], (sumRange, ...rest) => {
  const target = flatten([sumRange]);
  const pairs = pairUp(rest, 0);
  if (!pairs.length) return 0;
  return matchingIndexes(pairs, pairs[0][0].length)
    .reduce((acc, i) => acc + (typeof target[i] === 'number' ? target[i] : 0), 0);
});

def(['COUNTIF', 'NB.SI'], (range, crit) => {
  const test = criterion(crit);
  return flatten([range]).filter(test).length;
});

def(['COUNTIFS', 'NB.SI.ENS'], (...args) => {
  const pairs = pairUp(args, 0);
  if (!pairs.length) return 0;
  return matchingIndexes(pairs, pairs[0][0].length).length;
});

def(['AVERAGEIF', 'MOYENNE.SI'], (range, crit, avgRange) => {
  const src = flatten([range]);
  const target = avgRange === undefined ? src : flatten([avgRange]);
  const test = criterion(crit);
  const picked = [];
  src.forEach((v, i) => { if (test(v) && typeof target[i] === 'number') picked.push(target[i]); });
  return picked.length ? picked.reduce((a, b) => a + b, 0) / picked.length : ERR.div0();
});

def(['AVERAGEIFS', 'MOYENNE.SI.ENS'], (avgRange, ...rest) => {
  const target = flatten([avgRange]);
  const pairs = pairUp(rest, 0);
  if (!pairs.length) return ERR.div0();
  const picked = matchingIndexes(pairs, pairs[0][0].length)
    .map((i) => target[i]).filter((v) => typeof v === 'number');
  return picked.length ? picked.reduce((a, b) => a + b, 0) / picked.length : ERR.div0();
});

def(['MAXIFS', 'MAX.SI.ENS'], (maxRange, ...rest) => {
  const target = flatten([maxRange]);
  const pairs = pairUp(rest, 0);
  const picked = matchingIndexes(pairs, pairs[0]?.[0].length ?? 0)
    .map((i) => target[i]).filter((v) => typeof v === 'number');
  return picked.length ? Math.max(...picked) : 0;
});

def(['MINIFS', 'MIN.SI.ENS'], (minRange, ...rest) => {
  const target = flatten([minRange]);
  const pairs = pairUp(rest, 0);
  const picked = matchingIndexes(pairs, pairs[0]?.[0].length ?? 0)
    .map((i) => target[i]).filter((v) => typeof v === 'number');
  return picked.length ? Math.min(...picked) : 0;
});

// ---------- finance ----------
def(['NPV', 'VAN'], (rate, ...flows) => {
  const r = toNumber(rate);
  if (isError(r)) return r;
  const xs = numbersOnly(flows);
  return xs.reduce((acc, v, i) => acc + v / (1 + r) ** (i + 1), 0);
});

def(['IRR', 'TRI'], (flows, guess) => {
  const xs = numbersOnly([flows]);
  if (xs.length < 2) return ERR.num();
  const npv = (r) => xs.reduce((acc, v, i) => acc + v / (1 + r) ** i, 0);
  let lo = -0.9999, hi = 10;
  let flo = npv(lo), fhi = npv(hi);
  if (flo * fhi > 0) return ERR.num();
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid);
    if (Math.abs(f) < 1e-9) return mid;
    if (flo * f < 0) { hi = mid; fhi = f; } else { lo = mid; flo = f; }
  }
  return (lo + hi) / 2;
});

def(['PMT', 'VPM'], (rate, nper, pv, fv, type) => {
  const r = toNumber(rate), n = toNumber(nper), p = toNumber(pv);
  if (isError(r)) return r;
  if (isError(n)) return n;
  if (isError(p)) return p;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  if (r === 0) return -(p + f) / n;
  const pow = (1 + r) ** n;
  return -(p * pow + f) * r / ((pow - 1) * (1 + r * t));
});

def(['FV', 'VC'], (rate, nper, pmt, pv, type) => {
  const r = toNumber(rate), n = toNumber(nper), pm = toNumber(pmt ?? 0);
  if (isError(r)) return r;
  const p = pv === undefined ? 0 : toNumber(pv);
  const t = type === undefined ? 0 : toNumber(type);
  if (r === 0) return -(p + pm * n);
  const pow = (1 + r) ** n;
  return -(p * pow + pm * (1 + r * t) * (pow - 1) / r);
});

def(['PV', 'VA'], (rate, nper, pmt, fv, type) => {
  const r = toNumber(rate), n = toNumber(nper), pm = toNumber(pmt ?? 0);
  if (isError(r)) return r;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  if (r === 0) return -(f + pm * n);
  const pow = (1 + r) ** n;
  return -(f + pm * (1 + r * t) * (pow - 1) / r) / pow;
});

// ---------- texte ----------
def(['CONCATENATE', 'CONCATENER', 'CONCAT'], (...args) =>
  flatten(args).map(toText).join(''));
def(['LEFT', 'GAUCHE'], (v, n) => toText(v).slice(0, n === undefined ? 1 : toNumber(n)));
def(['RIGHT', 'DROITE'], (v, n) => {
  const k = n === undefined ? 1 : toNumber(n);
  return k <= 0 ? '' : toText(v).slice(-k);
});
def(['MID', 'STXT'], (v, start, len) => {
  const s = toNumber(start), l = toNumber(len);
  return toText(v).slice(s - 1, s - 1 + l);
});
def(['LEN', 'NBCAR'], (v) => toText(v).length);
def(['TRIM', 'SUPPRESPACE'], (v) => toText(v).trim().replace(/\s+/g, ' '));

def(['SUBSTITUTE', 'SUBSTITUE'], (v, oldText, newText, occurrence) => {
  const e = firstError([v, oldText, newText]);
  if (e) return e;
  const src = toText(v);
  const from = toText(oldText);
  const to = toText(newText);
  if (from === '') return src;
  if (occurrence === undefined || isBlank(occurrence)) return src.split(from).join(to);
  const n = toNumber(occurrence);
  if (isError(n)) return n;
  if (n < 1) return ERR.value();
  let seen = 0;
  let at = -1;
  while (seen < n) {
    at = src.indexOf(from, at + 1);
    if (at === -1) return src;
    seen += 1;
  }
  return src.slice(0, at) + to + src.slice(at + from.length);
});

def(['TEXTJOIN', 'JOINDRE.TEXTE'], (sep, ignoreEmpty, ...rest) => {
  const e = firstError([sep]);
  if (e) return e;
  const glue = toText(sep);
  const skip = ignoreEmpty === undefined ? true : !!toBoolean(ignoreEmpty);
  const parts = flatten(rest)
    .filter((v) => !(skip && isBlank(v)))
    .map((v) => toText(v));
  return parts.join(glue);
});

def(['REPT', 'REPT.TEXTE'], (v, times) => {
  const n = toNumber(times);
  if (isError(n)) return n;
  if (n < 0) return ERR.value();
  return toText(v).repeat(Math.floor(n));
});

def(['EXACT', 'EXACT.TEXTE'], (a, b) => toText(a) === toText(b));

def(['VALUE', 'CNUM'], (v) => {
  const n = toNumber(v);
  return isError(n) ? ERR.value() : n;
});

def(['UPPER', 'MAJUSCULE'], (v) => toText(v).toUpperCase());
def(['LOWER', 'MINUSCULE'], (v) => toText(v).toLowerCase());
def(['FIND', 'TROUVE'], (needle, hay, start) => {
  const i = toText(hay).indexOf(toText(needle), (start ? toNumber(start) : 1) - 1);
  return i === -1 ? ERR.value() : i + 1;
});
def(['SEARCH', 'CHERCHE'], (needle, hay, start) => {
  const i = toText(hay).toUpperCase()
    .indexOf(toText(needle).toUpperCase(), (start ? toNumber(start) : 1) - 1);
  return i === -1 ? ERR.value() : i + 1;
});

export function getFunction(name) {
  return FN[name.toUpperCase()] ?? null;
}

export function functionNames() {
  return Object.keys(FN).sort();
}

export { ExcelError, isError };
