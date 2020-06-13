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

export function debugHtml(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${title}</title>
    <link rel="stylesheet" href="../css/debug.css">
  </head>
  <body>
    <h1>${title}</h1>
    ${body}
  </body>
</html>`;
}

export function dumpReader(reader) {
  let html = '';

  let unread = 0;

  for (let i = 0; i < reader.data.length; ++i) {
    if (reader.type[i] === 0) ++unread;
  }

  const p = 1 - unread / reader.data.length;

  html += `<p>${(p * 100).toFixed(2)}% complete, ${unread}/${
    reader.data.length
  } bytes unread</p>`;

  html += '<pre class="hex">';

  for (let i = 0; i < reader.data.length; ++i) {
    let h = reader.data[i].toString(16);

    if (h.length === 1) h = '0' + h;

    html += `<i class="t${reader.type[i]} i${reader.info[i]}">${h}</i> `;

    if (i % 16 === 15) html += '<br>';
  }

  html += '</pre>';

  return html;
}
