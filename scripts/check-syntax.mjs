import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';
for (const dir of ['.', 'api', 'card']) {
  for (const file of readdirSync(dir).filter(name => /\.(js|jsx)$/.test(name))) {
    parse(readFileSync(dir + '/' + file, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
  }
}
console.log('JavaScript and JSX syntax passed.');
