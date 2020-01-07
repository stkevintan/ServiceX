import { timer } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Entry {
  name: string
  age: number
}
const entries: Entry[] = [
  { name: 'Bell Hilts', age: 12 },
  { name: 'Makeda Kerby', age: 22 },
  { name: 'Fran Quan', age: 33 },
  { name: 'Assunta Rashid', age: 44 },
  { name: 'Lanora Bogle', age: 51 },
  { name: 'Teresia Forsberg', age: 62 },
  { name: 'Kimberley Olivares', age: 20 },
  { name: 'Golden Naval', age: 30 },
  { name: 'Margarita Gelb', age: 42 },
  { name: 'Francesca Satterfield', age: 87 },
  { name: 'Karey Jessee', age: 68 },
  { name: 'Violet Carlow', age: 57 },
  { name: 'Taina Cloud', age: 45 },
  { name: 'Chantay Etheredge', age: 98 },
  { name: 'Edith Manier', age: 100 },
  { name: 'Boris Padgett', age: 46 },
  { name: 'Bailey Meints', age: 53 },
  { name: 'Kenda Davin', age: 25 },
]

// fake fetch
export const fetchEntries = (keyword?: string) => {
  const filters =
    keyword === undefined ? entries : entries.filter((item) => item.name.startsWith(keyword))
  return timer(1000).pipe(map(() => filters))
}
