import * as fs from 'fs';

const testResults = {};
const fileResults = {};

export async function test({ label, test }) {
  try {
    await test();
    testResults[label] = { label: label };
  } catch (err) {
    console.error(label);
    console.error(err.stack.split(/\n/g).slice(0, 3).join('\n'));
    testResults[label] = { label: label, error: err };
  }
}

export function testFiles({ label, dir, filter, test }) {
  const files = fs.readdirSync(dir).filter(filter);
  let errors = 0;

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(`${dir}/${file}`);
      test(file, buffer);
    } catch (err) {
      console.error(file);
      console.error(err.stack.split(/\n/g).slice(0, 3).join('\n'));
      ++errors;
    }
  }

  fileResults[label] = {
    label,
    files,
    errors,
  };
}

export function printResults() {
  for (const key of Object.keys(testResults)) {
    const { label, error } = testResults[key];
    console.log(`${label}: ${error ? 'NOT OK' : 'OK'}`);
  }

  for (const key of Object.keys(fileResults)) {
    const { label, files, errors } = fileResults[key];
    const ok = files.length - errors;
    const p = ((ok / files.length) * 100).toFixed(2);
    console.log(`${label}: ${ok}/${files.length} (${p}%)`);
  }
}
