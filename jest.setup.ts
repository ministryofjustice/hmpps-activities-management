import 'reflect-metadata'
// eslint-disable-next-line import/no-extraneous-dependencies
import { when } from 'jest-when'

const atLeast = (...argsToMatch: unknown[]) =>
  when.allArgs((args, equals) => equals(args, expect.arrayContaining(argsToMatch)))

export default atLeast
