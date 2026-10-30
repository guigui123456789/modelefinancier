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

// Les fonctions EST… s'appliquent terme à terme sur une plage, comme dans Excel :
// =SOMMEPROD((ESTNUM(B2:B6)=FAUX)*1) doit tester chaque cellule, pas seulement la première.
const perCell = (test) => (v) => (Array.isArray(v) ? flatten([v]).map(test) : test(v));

def(['ISERROR', 'ESTERREUR'], perCell((v) => isError(v)));
def(['ISNA', 'ESTNA'], perCell((v) => isError(v) && v.code === '#N/A'));
def(['ISBLANK', 'ESTVIDE'], perCell((v) => isBlank(v)));
def(['ISNUMBER', 'ESTNUM'], perCell((v) => typeof v === 'number'));
def(['ISTEXT', 'ESTTEXTE'], perCell((v) => typeof v === 'string'));

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
  if (Array.isArray(crit)) return flatten([crit]).map((c) => FN['SUMIF'].impl(range, c, sumRange));
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

// Un critere peut etre une plage : la fonction renvoie alors un resultat par
// critere, comme dans Excel. C'est l'idiome de detection de doublons :
// =SOMMEPROD((NB.SI(A2:A6;A2:A6)>1)*1)
const perCriterion = (fn) => (range, crit) => (
  Array.isArray(crit) ? flatten([crit]).map((c) => fn(range, c)) : fn(range, crit)
);

def(['COUNTIF', 'NB.SI'], perCriterion((range, crit) => {
  const test = criterion(crit);
  return flatten([range]).filter(test).length;
}));

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

// ---------- dates ----------
// Excel stocke une date comme un nombre de jours depuis le 30 decembre 1899.
// On garde cette representation : le moteur ne manipule que des nombres, donc
// une date EST un nombre, exactement comme dans Excel. C'est le fil conducteur
// du niveau 1 : ce qui est affiche n'est pas ce qui est stocke.
const EPOCH = Date.UTC(1899, 11, 30);
const JOUR_MS = 86400000;
const serieVersDate = (n) => new Date(EPOCH + Math.floor(n) * JOUR_MS);
const dateVersSerie = (y, m, d) => Math.round((Date.UTC(y, m, d) - EPOCH) / JOUR_MS);

def(['DATE'], (y, m, d) => {
  const an = toNumber(y), mois = toNumber(m), jour = toNumber(d);
  const e = firstError([an, mois, jour]);
  if (e) return e;
  // Date.UTC absorbe les debordements : DATE(2026;13;1) donne janvier 2027.
  return dateVersSerie(an, mois - 1, jour);
});

def(['YEAR', 'ANNEE'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  return serieVersDate(n).getUTCFullYear();
});
def(['MONTH', 'MOIS'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  return serieVersDate(n).getUTCMonth() + 1;
});
def(['DAY', 'JOUR'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  return serieVersDate(n).getUTCDate();
});
def(['WEEKDAY', 'JOURSEM'], (v, type) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  const jour = serieVersDate(n).getUTCDay(); // 0 = dimanche
  const t = type === undefined ? 1 : toNumber(type);
  if (t === 2) return jour === 0 ? 7 : jour;       // lundi = 1
  if (t === 3) return jour === 0 ? 6 : jour - 1;   // lundi = 0
  return jour + 1;                                  // dimanche = 1
});
def(['TODAY', 'AUJOURDHUI'], () => {
  const now = new Date();
  return dateVersSerie(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
});
def(['DAYS', 'JOURS'], (fin, debut) => {
  const a = toNumber(fin), b = toNumber(debut);
  const e = firstError([a, b]);
  if (e) return e;
  return Math.floor(a) - Math.floor(b);
});

def(['EOMONTH', 'FIN.MOIS'], (v, mois) => {
  const n = toNumber(v), m = toNumber(mois);
  const e = firstError([n, m]);
  if (e) return e;
  const d = serieVersDate(n);
  // jour 0 du mois suivant = dernier jour du mois visé
  return dateVersSerie(d.getUTCFullYear(), d.getUTCMonth() + Math.trunc(m) + 1, 0);
});

def(['EDATE', 'MOIS.DECALER'], (v, mois) => {
  const n = toNumber(v), m = toNumber(mois);
  const e = firstError([n, m]);
  if (e) return e;
  const d = serieVersDate(n);
  const cible = d.getUTCMonth() + Math.trunc(m);
  const finCible = new Date(Date.UTC(d.getUTCFullYear(), cible + 1, 0)).getUTCDate();
  // Excel ramene au dernier jour du mois quand le jour n'existe pas :
  // le 31 janvier decale d'un mois donne le 28 ou 29 fevrier.
  return dateVersSerie(d.getUTCFullYear(), cible, Math.min(d.getUTCDate(), finCible));
});

const joursFeries = (arg) => new Set(
  (arg === undefined ? [] : numbersOnly([arg])).map((x) => Math.floor(x)),
);
const estOuvre = (serie, feries) => {
  const j = serieVersDate(serie).getUTCDay();
  return j !== 0 && j !== 6 && !feries.has(serie);
};

def(['NETWORKDAYS', 'NB.JOURS.OUVRES'], (debut, fin, feries) => {
  const a = toNumber(debut), b = toNumber(fin);
  const e = firstError([a, b]);
  if (e) return e;
  const f = joursFeries(feries);
  const d1 = Math.min(Math.floor(a), Math.floor(b));
  const d2 = Math.max(Math.floor(a), Math.floor(b));
  let n = 0;
  for (let k = d1; k <= d2; k++) if (estOuvre(k, f)) n += 1;
  return Math.floor(a) <= Math.floor(b) ? n : -n;
});

def(['WORKDAY', 'SERIE.JOUR.OUVRE'], (debut, jours, feries) => {
  const a = toNumber(debut), n = toNumber(jours);
  const e = firstError([a, n]);
  if (e) return e;
  const f = joursFeries(feries);
  const pas = n >= 0 ? 1 : -1;
  let restant = Math.abs(Math.trunc(n));
  let cur = Math.floor(a);
  while (restant > 0) {
    cur += pas;
    if (estOuvre(cur, f)) restant -= 1;
  }
  return cur;
});

def(['DAYS360', 'JOURS360'], (debut, fin, methode) => {
  const a = toNumber(debut), b = toNumber(fin);
  const e = firstError([a, b]);
  if (e) return e;
  const europeenne = methode !== undefined && !!toBoolean(methode);
  const d1 = serieVersDate(a), d2 = serieVersDate(b);
  let j1 = d1.getUTCDate(), j2 = d2.getUTCDate();
  const m1 = d1.getUTCMonth() + 1, m2 = d2.getUTCMonth() + 1;
  const y1 = d1.getUTCFullYear(), y2 = d2.getUTCFullYear();
  if (europeenne) {
    // Methode europeenne (30E/360) : tout 31 devient 30.
    if (j1 === 31) j1 = 30;
    if (j2 === 31) j2 = 30;
  } else {
    // Methode americaine (30U/360), celle d'Excel par defaut.
    const finFevrier = (y, m, j) => m === 2
      && j === new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (finFevrier(y1, m1, j1) && finFevrier(y2, m2, j2)) j2 = 30;
    if (finFevrier(y1, m1, j1)) j1 = 30;
    if (j2 === 31 && j1 >= 30) j2 = 30;
    if (j1 === 31) j1 = 30;
  }
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (j2 - j1);
});

def(['DATEDIF'], (debut, fin, unite) => {
  const a = toNumber(debut), b = toNumber(fin);
  const e = firstError([a, b]);
  if (e) return e;
  if (b < a) return ERR.num();
  const d1 = serieVersDate(a), d2 = serieVersDate(b);
  const u = toText(unite).toUpperCase();
  const mois = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12
    + (d2.getUTCMonth() - d1.getUTCMonth())
    - (d2.getUTCDate() < d1.getUTCDate() ? 1 : 0);
  if (u === 'Y') return Math.floor(mois / 12);
  if (u === 'M') return mois;
  if (u === 'D') return Math.floor(b) - Math.floor(a);
  return ERR.num();
});

// ---------- financieres ----------
// Les fonctions d'annuite suivent la convention de signe d'Excel : un flux
// recu est positif, un flux verse est negatif. VPM renvoie donc un nombre
// negatif pour une mensualite d'emprunt.
const _vpm = (r, n, pv, fv, t) => {
  if (r === 0) return -(pv + fv) / n;
  const pow = (1 + r) ** n;
  return -(pv * pow + fv) * r / ((pow - 1) * (1 + r * t));
};
const _vc = (r, n, pmt, pv, t) => {
  if (r === 0) return -(pv + pmt * n);
  const pow = (1 + r) ** n;
  return -(pv * pow + pmt * (1 + r * t) * (pow - 1) / r);
};

def(['NPER', 'NPM'], (rate, pmt, pv, fv, type) => {
  const r = toNumber(rate), pm = toNumber(pmt), p = toNumber(pv);
  const e = firstError([r, pm, p]);
  if (e) return e;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  if (r === 0) {
    if (pm === 0) return ERR.num();
    return -(p + f) / pm;
  }
  const a = pm * (1 + r * t);
  const num = a - f * r;
  const den = a + p * r;
  // Les deux termes sont souvent negatifs ensemble — un emprunt a pour
  // mensualite negative et pour capital positif. C'est leur rapport qui doit
  // etre strictement positif, pas chacun d'eux.
  if (den === 0) return ERR.num();
  const rapport = num / den;
  if (!(rapport > 0)) return ERR.num();
  return Math.log(rapport) / Math.log(1 + r);
});

def(['RATE', 'TAUX'], (nper, pmt, pv, fv, type, guess) => {
  const n = toNumber(nper), pm = toNumber(pmt), p = toNumber(pv);
  const e = firstError([n, pm, p]);
  if (e) return e;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  // On resout VA = 0 par dichotomie : plus lent que Newton, mais il ne
  // diverge jamais, et la correction d'un exercice n'a pas de contrainte
  // de temps.
  const reste = (r) => {
    if (Math.abs(r) < 1e-12) return p + pm * n + f;
    const pow = (1 + r) ** n;
    return p * pow + pm * (1 + r * t) * (pow - 1) / r + f;
  };
  // Borne haute a 100 % par periode : au-dela, (1 + r) ** nper deborde a
  // l'infini sur un echeancier de 360 mois et la dichotomie ne demarre pas.
  let lo = -0.9999, hi = 1;
  let flo = reste(lo), fhi = reste(hi);
  const signe = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  if (Number.isNaN(flo) || Number.isNaN(fhi)) return ERR.num();
  if (signe(flo) * signe(fhi) >= 0) return ERR.num();
  for (let k = 0; k < 300; k++) {
    const mid = (lo + hi) / 2;
    const fm = reste(mid);
    if (Math.abs(fm) < 1e-10) return mid;
    if (signe(flo) * signe(fm) < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
});

def(['IPMT', 'INTPER'], (rate, per, nper, pv, fv, type) => {
  const r = toNumber(rate), k = toNumber(per), n = toNumber(nper), p = toNumber(pv);
  const e = firstError([r, k, n, p]);
  if (e) return e;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  if (k < 1 || k > n) return ERR.num();
  const pmt = _vpm(r, n, p, f, t);
  if (k === 1) return t === 1 ? 0 : -p * r;
  // capital restant du a la fin de la periode precedente
  const solde = _vc(r, k - 1, pmt, p, t);
  return t === 1 ? solde * r / (1 + r) : solde * r;
});

def(['PPMT', 'PRINCPER'], (rate, per, nper, pv, fv, type) => {
  const r = toNumber(rate), k = toNumber(per), n = toNumber(nper), p = toNumber(pv);
  const e = firstError([r, k, n, p]);
  if (e) return e;
  const f = fv === undefined ? 0 : toNumber(fv);
  const t = type === undefined ? 0 : toNumber(type);
  if (k < 1 || k > n) return ERR.num();
  const pmt = _vpm(r, n, p, f, t);
  const interets = k === 1
    ? (t === 1 ? 0 : -p * r)
    : (t === 1 ? _vc(r, k - 1, pmt, p, t) * r / (1 + r) : _vc(r, k - 1, pmt, p, t) * r);
  return pmt - interets;
});

def(['SLN', 'AMORLIN'], (cout, valeurResiduelle, duree) => {
  const c = toNumber(cout), v = toNumber(valeurResiduelle), d = toNumber(duree);
  const e = firstError([c, v, d]);
  if (e) return e;
  if (d === 0) return ERR.div0();
  return (c - v) / d;
});

def(['SYD'], (cout, valeurResiduelle, duree, periode) => {
  const c = toNumber(cout), v = toNumber(valeurResiduelle), d = toNumber(duree), k = toNumber(periode);
  const e = firstError([c, v, d, k]);
  if (e) return e;
  if (k < 1 || k > d) return ERR.num();
  return (c - v) * (d - k + 1) * 2 / (d * (d + 1));
});

def(['DB'], (cout, valeurResiduelle, duree, periode, mois) => {
  const c = toNumber(cout), v = toNumber(valeurResiduelle), d = toNumber(duree), k = toNumber(periode);
  const e = firstError([c, v, d, k]);
  if (e) return e;
  const m = mois === undefined ? 12 : toNumber(mois);
  if (c === 0) return 0;
  // Excel arrondit le taux a trois decimales, et c'est ce qui explique les
  // ecarts de quelques centimes avec un calcul fait a la main.
  const taux = Math.round((1 - (v / c) ** (1 / d)) * 1000) / 1000;
  let cumul = 0;
  let amort = 0;
  for (let i = 1; i <= k; i++) {
    if (i === 1) amort = c * taux * m / 12;
    else if (i === d + 1) amort = (c - cumul) * taux * (12 - m) / 12;
    else amort = (c - cumul) * taux;
    cumul += amort;
  }
  return amort;
});

// VAN.PAIEMENTS et TRI.PAIEMENTS actualisent sur les dates reelles, en
// annees de 365 jours. C'est ce qui les rend justes sur des flux irreguliers,
// la ou VAN et TRI supposent des periodes egales.
const _xnpv = (r, flux, dates) => {
  const d0 = dates[0];
  return flux.reduce((acc, v, i) => acc + v / (1 + r) ** ((dates[i] - d0) / 365), 0);
};

def(['XNPV', 'VAN.PAIEMENTS'], (rate, values, dates) => {
  const r = toNumber(rate);
  if (isError(r)) return r;
  const flux = numbersOnly([values]);
  const d = numbersOnly([dates]).map((x) => Math.floor(x));
  if (flux.length !== d.length || flux.length < 2) return ERR.num();
  return _xnpv(r, flux, d);
});

def(['XIRR', 'TRI.PAIEMENTS'], (values, dates, guess) => {
  const flux = numbersOnly([values]);
  const d = numbersOnly([dates]).map((x) => Math.floor(x));
  if (flux.length !== d.length || flux.length < 2) return ERR.num();
  let lo = -0.9999, hi = 100;
  let flo = _xnpv(lo, flux, d), fhi = _xnpv(hi, flux, d);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return ERR.num();
  for (let k = 0; k < 300; k++) {
    const mid = (lo + hi) / 2;
    const fm = _xnpv(mid, flux, d);
    if (Math.abs(fm) < 1e-9) return mid;
    if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
});

def(['MIRR'], (values, tauxFinancement, tauxReinvestissement) => {
  const xs = numbersOnly([values]);
  const rf = toNumber(tauxFinancement), rr = toNumber(tauxReinvestissement);
  const e = firstError([rf, rr]);
  if (e) return e;
  const n = xs.length;
  if (n < 2) return ERR.num();
  let vaNeg = 0;
  let vcPos = 0;
  xs.forEach((v, i) => {
    if (v < 0) vaNeg += v / (1 + rf) ** i;
    else vcPos += v * (1 + rr) ** (n - 1 - i);
  });
  if (vaNeg === 0) return ERR.div0();
  return (-vcPos / (vaNeg * (1 + rf) ** 0)) ** (1 / (n - 1)) - 1;
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
// Le nom TRIM est surcharge entre les deux langues : en anglais c'est la
// fonction texte, en francais c'est le taux de rentabilite interne modifie
// (MIRR). On tranche sur le nombre d'arguments, qui ne laisse aucune ambiguite :
// la fonction texte en prend un, MIRR en prend trois.
// SUPPRESPACE ne traite que l'espace ordinaire (caractere 32), comme dans
// Excel. Il ne touche ni l'espace insecable (160), ni les caracteres de
// controle : c'est precisement ce qui fait echouer les rapprochements apres
// un import, et ce que la lecon xl-nettoyer enseigne.
def(['SUPPRESPACE'], (v) => toText(v).replace(/^ +| +$/g, '').replace(/ {2,}/g, ' '));
def(['TRIM'], (...args) => (
  args.length >= 3
    ? FN['MIRR'].impl(args[0], args[1], args[2])
    : toText(args[0]).replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ')
));

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

// ---------- TEXTE : formater un nombre ou une date dans une formule ----------
// Sous-ensemble des codes de format d'Excel : ceux qu'on rencontre reellement
// dans un modele. Les codes de date sont ceux de la version francaise (j, m, a).
const MOIS_COURTS = ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin',
                     'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'];
const MOIS_LONGS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Separe les milliers par une espace insecable fine, comme l'usage francais. */
// Excel francais separe les milliers par une espace INSECABLE (caractere 160),
// pas par une espace ordinaire ni par une espace fine. C'est ce qui fait qu'un
// TEXTE(...) ne se compare pas a un libelle tape au clavier, et que CNUM doit
// savoir la relire. Voir la lecon xl-nettoyer.
const grouper = (entier) => entier.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

function formatNombre(n, code) {
  let reste = code;
  let pourcent = false;
  if (reste.includes('%')) { pourcent = true; n *= 100; reste = reste.replace(/%/g, ''); }
  const milliers = /#\s?##0|#,##0/.test(reste);
  reste = reste.replace(/#\s?##0|#,##0/g, '0');
  const m = reste.match(/0*(?:[.,](0+))?/);
  const decimales = m && m[1] ? m[1].length : 0;
  const signe = n < 0 ? '-' : '';
  const abs = Math.abs(n).toFixed(decimales);
  let [entier, frac] = abs.split('.');
  // Des zeros dans la partie entiere du code imposent une largeur minimale :
  // TEXTE(12;"0000") donne 0012. C'est ainsi qu'on fabrique un code produit.
  const largeur = (reste.split(/[.,]/)[0].match(/0/g) || []).length;
  if (largeur > 1) entier = entier.padStart(largeur, '0');
  if (milliers) entier = grouper(entier);
  const noyau = signe + entier + (frac ? ',' + frac : '');
  // ce qui entoure le code numerique est conserve tel quel (unite, libelle)
  const avant = code.match(/^[^0#%.,]*/)[0];
  const apres = code.match(/[^0#%.,]*$/)[0];
  return avant + noyau + (pourcent ? '%' : '') + apres;
}

function formatDate(serie, code) {
  const d = serieVersDate(serie);
  const an = d.getUTCFullYear(), mo = d.getUTCMonth(), jo = d.getUTCDate();
  const sem = d.getUTCDay();
  const p2 = (x) => String(x).padStart(2, '0');
  // Les codes les plus longs d'abord, sinon "jjjj" serait lu comme deux "jj".
  return code
    .replace(/aaaa|yyyy/gi, String(an))
    .replace(/jjjj|dddd/gi, JOURS_LONGS[sem])
    .replace(/jjj|ddd/gi, JOURS_COURTS[sem])
    .replace(/mmmm/gi, MOIS_LONGS[mo])
    .replace(/mmm/gi, MOIS_COURTS[mo])
    .replace(/jj|dd/gi, p2(jo))
    .replace(/mm/gi, p2(mo + 1))
    .replace(/aa|yy/gi, p2(an % 100))
    .replace(/\bj\b|\bd\b/gi, String(jo))
    .replace(/\bm\b/gi, String(mo + 1));
}

def(['TEXT', 'TEXTE'], (v, format) => {
  const e = firstError([v, format]);
  if (e) return e;
  const code = toText(format);
  const estCodeDate = /aaaa|yyyy|jj|dd|mmm/i.test(code)
    || (/m{1,2}/i.test(code) && /[/\-]/.test(code));
  const n = toNumber(v);
  if (isError(n)) return toText(v);
  if (estCodeDate) return formatDate(n, code);
  if (/[0#]/.test(code)) return formatNombre(n, code);
  return toText(v);
});

def(['CLEAN', 'EPURAGE'], (v) => {
  // Retire les caracteres de controle (0 a 31), ceux qu'un import de PDF ou
  // de mainframe laisse derriere lui et que SUPPRESPACE ne touche pas.
  const e = firstError([v]);
  if (e) return e;
  return toText(v).replace(/[\u0000-\u001f\u007f]/g, '');
});

def(['CODE'], (v) => {
  const t = toText(v);
  return t.length ? t.codePointAt(0) : ERR.value();
});

def(['CHAR', 'CAR'], (v) => {
  const n = toNumber(v);
  if (isError(n)) return n;
  if (n < 1 || n > 65535) return ERR.value();
  return String.fromCodePoint(Math.floor(n));
});

def(['PROPER', 'NOMPROPRE'], (v) => toText(v)
  .toLowerCase()
  .replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase()));

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
