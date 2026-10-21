import type { en } from './en';

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

/** Shape every language file must match. */
export type Messages = DeepString<typeof en>;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Every valid translation key, e.g. "upload.title". */
export type MessageKey = Leaves<Messages>;

export type Lang = 'el' | 'en';

export type Params = Record<string, string | number>;
