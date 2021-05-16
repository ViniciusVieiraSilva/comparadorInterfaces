import { Line } from './line';
import fs from 'fs';

const CPUs = require('os').cpus().length;
//console.log(CPUs);
const files: string[] = [];

process.argv.forEach((file) => {
  files.push(file);
});

function loadInterfaceDefinition() {
  const fileBuffer = fs.readFileSync(files[2], 'utf-8');
  const contentJson = JSON.parse(fileBuffer);
  return contentJson;
}

const jsonInterface = loadInterfaceDefinition();

function getRegisterTypes() {
  const registerTypes: string[] = [];
  jsonInterface.tpregs.forEach((register: any) =>
    registerTypes.push(register.tpreg),
  );
  return registerTypes;
}

const registerTypes: string[] = getRegisterTypes();

function getRegistersKeys(registerType: string) {
  const jsonInterface = loadInterfaceDefinition();
  const registerKeys: string[][] = [];
  jsonInterface.tpregs.forEach((register: any) => {
    if (register.tpreg === registerType) registerKeys.push(register.keys);
  });
  return registerKeys;
}

function getRegistersIndexes(registerType: string) {
  const jsonInterface = loadInterfaceDefinition();
  const registerIndexes: string[][] = [];
  jsonInterface.tpregs.forEach((register: any) => {
    if (register.tpreg === registerType) registerIndexes.push(register.indexes);
  });
  return registerIndexes;
}

function getRegistersFields(registerType: string) {
  const jsonInterface = loadInterfaceDefinition();
  const registerFields: string[][] = [];
  jsonInterface.tpregs.forEach((register: any) => {
    if (register.tpreg === registerType)
      registerFields.push(register.registers);
  });
  return registerFields;
}

function sliceLine(value: string, ini: number, tam: number) {
  return value.slice(ini - 1, ini - 1 + tam);
}

function getRegisterFieldName(tpreg: string, ini: number, tam: number): string {
  const registerFields: string[][] = getRegistersFields(tpreg);
  let fieldName: string = 'CHAVE';

  registerFields.forEach((registerField: any[]) => {
    registerField.forEach((registerField: any) => {
      if (ini === registerField.ini && tam === registerField.tam) {
        fieldName = registerField.column;
      }
    });
  });
  return fieldName;
}

function parseFile(fileName: string) {
  const fileBuffer = fileName;
  const rawLines: string[] = fileBuffer.split('\n');
  const lines: Map<string, Line> = new Map();

  rawLines.forEach((line: string) => {
    registerTypes.forEach((registerType) => {
      const registerIndexes: string[][] = getRegistersIndexes(registerType);
      registerIndexes.forEach((registerIndex: any[]) => {
        registerIndex.forEach((registerIndex: any) => {
          if (
            registerIndex.value ===
            sliceLine(line, registerIndex.ini, registerIndex.tam)
          ) {
            let id = registerType;
            const registerKeys: string[][] = getRegistersKeys(registerType);
            const fields: Map<string, string> = new Map();
            registerKeys.forEach((registerKey: any[]) => {
              registerKey.forEach((registerKey: any) => {
                const field = getRegisterFieldName(
                  registerType,
                  registerKey.ini,
                  registerKey.tam,
                );
                const value = sliceLine(line, registerKey.ini, registerKey.tam);
                fields.set(field, value);
                id = id + '|' + value;
              });
            });
            const registerFields: string[][] = getRegistersFields(registerType);
            registerFields.forEach((registerField: any[]) => {
              registerField.forEach((registerField: any) => {
                const field = getRegisterFieldName(
                  registerType,
                  registerField.ini,
                  registerField.tam,
                );
                const value = sliceLine(
                  line,
                  registerField.ini,
                  registerField.tam,
                );
                fields.set(field, value);
              });
            });
            lines.set(id, { fields, registerType });
            //console.log(lines.size, id);
          }
        });
      });
    });
  });
  return lines;
}

function compareFilesSizes(registerType: string) {
  // Retorna a quantidade de linhas por tipo de registro

  let originalFileSize = 0;
  let versionFileSize = 0;
  console.log('Registro tipo: ', registerType);
  original.forEach((line) => {
    if (line.registerType === registerType) {
      originalFileSize++;
    }
  });
  version.forEach((line) => {
    if (line.registerType === registerType) {
      versionFileSize++;
    }
  });
  console.log('Quantidade de registros ORI: ', originalFileSize);
  console.log('Quantidade de registros VER: ', versionFileSize);
}

function getUniqueLines(
  registerType: string,
  originalKeys: IterableIterator<string>,
  versionKeys: IterableIterator<string>,
) {
  // Retorna as linhas que estão apenas no arquivo original ou no version.

  for (let key of originalKeys) {
    let valueOnVersion = version.get(key);
    let valueOnOriginal = original.get(key);
    if (valueOnOriginal?.registerType == registerType) {
      if (valueOnVersion == null) {
        console.log('Registros apenas no arquivo ORI:');
        console.log(key);
      }
    }
  }
  for (const key of versionKeys) {
    let valueOnVersion = version.get(key);
    let valueOnOriginal = original.get(key);
    if (valueOnVersion?.registerType == registerType) {
      if (valueOnOriginal == null) {
        console.log('Registros apenas no arquivo VER:');
        console.log(key);
      }
    }
  }
}

function compareNotUniqueLines(
  registerType: string,
  originalKeys: IterableIterator<string>,
) {
  for (let key of originalKeys) {
    let valueOnVersion = version.get(key);
    let valueOnOriginal = original.get(key);
    if (valueOnOriginal?.registerType == registerType) {
      if (valueOnOriginal != null && valueOnVersion != null) {
        const differences = compareFields(valueOnOriginal, valueOnVersion);
        differences.forEach((difference) => {
          const result = {
            REGISTRO: valueOnOriginal?.registerType,
            CAMPO: difference.key,
            'VALOR ORI': difference.valueField1,
            'VALOR VER': difference.valueField2,
          };
          console.log(result);
        });
      }
    }
  }
}

function compareFields(field1: Line, field2: Line) {
  const field1Keys = field1.fields.keys();
  const differences = [];

  for (const key of field1Keys) {
    const valueField1 = field1.fields.get(key);
    const valueField2 = field2.fields.get(key);
    if (valueField2 == null) {
      console.log('Campo não encontrado no arquivo VER');
      console.log(key, ':', valueField1);
    } else if (valueField1 != valueField2) {
      differences.push({ key, valueField1, valueField2 });
    }
  }
  return differences;
}

console.time('Reading');
const fileOriginal = fs.readFileSync(files[3], 'utf-8');
const fileVersion = fs.readFileSync(files[4], 'utf-8');
console.timeEnd('Reading');

console.time('Parsing');
const original = parseFile(fileOriginal);
const version = parseFile(fileVersion);
console.timeEnd('Parsing');

console.time('Comparing');
registerTypes.forEach((registerType) => {
  compareFilesSizes(registerType);
  getUniqueLines(registerType, original.keys(), version.keys());
  console.log('Diferenças');
  compareNotUniqueLines(registerType, original.keys());
});
console.timeEnd('Comparing');
