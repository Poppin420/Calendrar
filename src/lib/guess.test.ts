import { describe, expect, it } from 'vitest';
import { profileColumn } from './csv/profile';
import { guessDecision, guessFavorable, guessSensitive, guessTruth } from './guess';

const profiles = [
  profileColumn('gender', ['F', 'M', 'F']),
  profileColumn('age', ['23', '45', '31', '52']),
  profileColumn('hired', ['no', 'yes', 'no']),
  profileColumn('actual_performance', ['good', 'bad', 'good']),
];

describe('mapping guesses', () => {
  it('finds the decision column and favorable value', () => {
    expect(guessDecision(profiles)).toBe('hired');
    expect(guessFavorable(profiles[2])).toEqual(['yes']);
  });
  it('finds a sensitive attribute and ground truth', () => {
    expect(guessSensitive(profiles, ['hired'])).toEqual(['gender']);
    expect(guessTruth(profiles, ['hired'])).toBe('actual_performance');
  });
  it('still finds a decision column where everyone got the same outcome', () => {
    expect(
      guessDecision([profileColumn('sex', ['F', 'M']), profileColumn('hired', ['no', 'no'])]),
    ).toBe('hired');
  });
  it('handles 0/1 decisions', () => {
    expect(guessFavorable(profileColumn('y', ['0', '1', '0']))).toEqual(['1']);
  });
});
