// The currency a league's numbers are quoted in, and the words that go with it.
//
// Dynasty leagues use market values. Redraft and keeper leagues use raw projected
// points per game. These remain distinct units throughout the application.
//
// Pure presentation data, no I/O — client components import this.

export type ValueBasis = "dynasty" | "redraft";

export type ValueBasisMeta = {
  /** What one number means, in a sentence fragment. */
  noun: string;
  /** Column and tile header for a value. */
  columnLabel: string;
  /** Where the numbers come from, for a page description. */
  blurb: string;
  /**
   * The surplus-per-pick that spans one draft-grade band, in this basis's units. Dynasty values
   * put a mid-first around 2,900, so a 1,000-unit swing is the scale a grade should move on;
   * projected PPG differences use a three-point band.
   */
  gradeUnit: number;
  /** True when this basis has draft-pick values, trends, and tiers behind it. */
  hasMarket: boolean;
  /** Decimal places a value in this basis carries. Market values are whole; PPG is to a tenth. */
  decimals: number;
};

export const VALUE_BASIS: Record<ValueBasis, ValueBasisMeta> = {
  dynasty: {
    noun: "dynasty market value",
    columnLabel: "Value",
    blurb: "Dynasty market values for every player, ranked and filterable.",
    gradeUnit: 1000,
    hasMarket: true,
    decimals: 0,
  },
  redraft: {
    noun: "projected points per game",
    columnLabel: "Proj PPG",
    blurb: "Projected PPR points per game, ranked and filterable.",
    gradeUnit: 3,
    hasMarket: false,
    decimals: 1,
  },
};

export const basisMeta = (basis: ValueBasis): ValueBasisMeta => VALUE_BASIS[basis];

/** Snaps a derived number — an average, a per-pick surplus — to the precision its basis carries. */
export function roundValue(value: number, basis: ValueBasis): number {
  const factor = 10 ** basisMeta(basis).decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Adds values and snaps the total back to a tenth.
 *
 * Redraft values are points per game carried to one decimal, so a plain sum drifts into
 * float noise (`88.69999999999999`) and every `toLocaleString` in the app prints it. Dynasty
 * values are whole numbers, where this rounds nothing.
 */
export function sumValues(values: number[]): number {
  return Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10;
}
