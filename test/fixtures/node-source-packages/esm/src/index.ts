import { value } from './value.js'
export default function check(input: boolean): string {
  if (!input) throw new Error('invalid')
  return value
}
