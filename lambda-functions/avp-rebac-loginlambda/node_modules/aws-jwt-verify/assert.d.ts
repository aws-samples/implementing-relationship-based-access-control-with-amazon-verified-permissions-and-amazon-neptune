import { AssertionErrorConstructor } from "./error.js";
/**
 * Assert value is a non-empty string and equal to the expected value,
 * or throw an error otherwise
 *
 * @param name - Name for the value being checked
 * @param actual - The value to check
 * @param expected - The expected value
 * @param errorConstructor - Constructor for the concrete error to be thrown
 */
export declare function assertStringEquals<T extends string>(name: string, actual: unknown, expected: T, errorConstructor?: AssertionErrorConstructor): asserts actual is T;
/**
 * Assert value is a non-empty string and is indeed one of the expected values,
 * or throw an error otherwise
 *
 * @param name - Name for the value being checked
 * @param actual - The value to check
 * @param expected - The array of expected values. For your convenience you can provide
 * @param errorConstructor - Constructor for the concrete error to be thrown
 * a string here as well, which will mean an array with just that string
 */
export declare function assertStringArrayContainsString<T extends string | Readonly<string[]>>(name: string, actual: unknown, expected: T, errorConstructor?: AssertionErrorConstructor): asserts actual is T extends Readonly<string[]> ? T[number] : T;
/**
 * Assert value is an array of strings, where at least one of the strings is indeed one of the expected values,
 * or throw an error otherwise
 *
 * @param name - Name for the value being checked
 * @param actual - The value to check, must be an array of strings, or a single string (which will be treated
 * as an array with just that string)
 * @param expected - The array of expected values. For your convenience you can provide
 * a string here as well, which will mean an array with just that string
 * @param errorConstructor - Constructor for the concrete error to be thrown
 */
export declare function assertStringArraysOverlap(name: string, actual: unknown, expected: string | Readonly<string[]>, errorConstructor?: AssertionErrorConstructor): asserts actual is string | Readonly<string[]>;
/**
 * Assert value is not a promise, or throw an error otherwise
 *
 * @param actual - The value to check
 * @param errorFactory - Function that returns the error to be thrown
 */
export declare function assertIsNotPromise(actual: unknown, errorFactory: () => Error): void;
