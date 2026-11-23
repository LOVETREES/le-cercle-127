// Workaround for expo-modules-jsi 58.0.22 and Xcode 26.3:
// https://github.com/expo/expo/issues/52754
const fs = require('node:fs');
const path = require('node:path');

const before = `    // The isolated closure below runs synchronously on this thread.
    nonisolated(unsafe) let slot = buffer.baseAddress!
    expo.emplaceUndefined(slot)`;
const after = `    let slot = buffer.baseAddress!
    // The isolated closure below runs synchronously on this thread.
    let slotAddress = UInt(bitPattern: slot)
    expo.emplaceUndefined(slot)`;
const beforeClosure = `      try JavaScriptActor.assumeIsolated {
        try encode(JavaScriptValue.Slot(slot), runtime)`;
const afterClosure = `      try JavaScriptActor.assumeIsolated {
        let slot = UnsafeMutablePointer<facebook.jsi.Value>(bitPattern: slotAddress)!
        try encode(JavaScriptValue.Slot(slot), runtime)`;

function patch(source) {
  if (source.includes(after) && source.includes(afterClosure)) return source;
  if (source.split(before).length !== 2 || source.split(beforeClosure).length !== 2) {
    throw new Error('Le code Expo a changé : le correctif iOS doit être vérifié avant de continuer.');
  }
  return source.replace(before, after).replace(beforeClosure, afterClosure);
}

if (require.main === module) {
  const root = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi');
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (version !== '58.0.22') throw new Error(`Version expo-modules-jsi inattendue (${version}) : vérifier le correctif iOS.`);
  const file = path.join(root, 'apple', 'Sources', 'ExpoModulesJSI', 'Runtime', 'Values', 'JavaScriptObject.swift');
  const source = fs.readFileSync(file, 'utf8');
  const result = patch(source);
  if (result !== source) fs.writeFileSync(file, result);
  console.log('Correctif Expo iOS vérifié.');
}

module.exports = { patch };
