import { load } from 'c3-module';
import chroma from 'chroma-js';

const c3 = load()

export const findC3Color = (color: string, num: number = 1): [{ termIndex: number, name: string }] => {
  const chromaColor = chroma(color);
  const [L, a, b] = chromaColor.lab();
  const r = 5; // c3 rounds lab colors to nearest 5 in its index
  const [rL, ra, rb] = [Math.round(L/r)*r, Math.round(a/r)*r, Math.round(b/r)*r];
  // TODO: build a lookup table to speed stuff up?
  const colorIndex = c3.color.findIndex(c => c.l == rL && c.a == ra && c.b == rb);
  const terms = c3.color.relatedTerms(colorIndex, num);
  if (terms.length == 0) {
    return [{ name: "unknown", termIndex: -1 }];
  }

  return terms.map(term => ({ name: c3.terms[term.index], termIndex: term.index }));
}