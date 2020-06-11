import * as fs from 'fs';

export function testFiles({ label, dir, filter, test }) {
  const files = fs.readdirSync(dir).filter(filter);
  let errors = 0;

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(`${dir}/${file}`);
      test(file, buffer);
    } catch (err) {
      console.error(file);
      console.error(err.stack);
      ++errors;
    }
  }

  console.log(`${label}: ${files.length - errors}/${files.length}`);
}
