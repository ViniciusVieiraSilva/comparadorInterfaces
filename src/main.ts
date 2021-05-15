import { cachedDataVersionTag } from 'node:v8';
import { Campo } from './campo';
import { DataStructure } from './data-structure';
import fs from 'fs';
import equal from 'fast-deep-equal';

const files: string[] = [];

process.argv.forEach((file) => {
  files.push(file);
});

function loadInterfaceDefinition() {
  const fileBuffer = fs.readFileSync(files[2], 'utf-8');
  const contentJson = JSON.parse(fileBuffer);
  return contentJson;
}

function countFileLines(file: string): number {
  var nLines = 0;
  for (var i = 0, n = file.length; i < n; ++i) {
    if (file[i] === '\n') {
      ++nLines;
    }
  }
  return nLines;
}

function getRegisterTypes() {
  const jsonInterface = loadInterfaceDefinition();
  const registerTypes: string[] = [];
  jsonInterface.tpregs.forEach((register: any) =>
    registerTypes.push(register.tpreg),
  );
  return registerTypes;
}

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

function readFile(fileName: string) {
  const registerTypes: string[] = getRegisterTypes();
  const fileBuffer = fileName;
  const lines: string[] = fileBuffer.split('\n');
  const dataStructureKeys: DataStructure[] = [];
  const dataStructureFields = new DataStructure();

  lines.forEach((line: string) => {
    registerTypes.forEach((registerType) => {
      const registerIndexes: string[][] = getRegistersIndexes(registerType);
      registerIndexes.forEach((registerIndex: any[]) => {
        registerIndex.forEach((registerIndex: any) => {
          if (
            registerIndex.value ===
            sliceLine(line, registerIndex.ini, registerIndex.tam)
          ) {
            const registerKeys: string[][] = getRegistersKeys(registerType);
            registerKeys.forEach((registerKey: any[]) => {
              const dataStructureKey = new DataStructure();
              registerKey.forEach((registerKey: any) => {
                const rKEY = {
                  CAMPO: getRegisterFieldName(
                    registerType,
                    registerKey.ini,
                    registerKey.tam,
                  ),
                  VALOR: sliceLine(line, registerKey.ini, registerKey.tam),
                };
                dataStructureKey.addItem(registerType, rKEY);
              });
              dataStructureKeys.push(dataStructureKey);
              dataStructureKey.resetIterator();
            });
            //dataStructureKeys.push(dataStructureKey);
            const registerFields: string[][] = getRegistersFields(registerType);
            registerFields.forEach((registerField: any[]) => {
              registerField.forEach((registerField: any) => {
                const rField = {
                  CAMPO: registerField.column,
                  VALOR: sliceLine(line, registerField.ini, registerField.tam),
                };
                dataStructureFields.addItem(registerType, rField);
              });
            });
            //console.log(dataStructureKeys);
          }
        });
      });
    });
  });
  return { dataStructureKeys, dataStructureFields };
}

// function compareFileSize(fileLenghtORI: number, fileLenghtVER: number) {
//   const qtdLinesORI: number = countFileLines(
//     fs.readFileSync(files[3], 'utf-8'),
//   );
//   const qtdLinesVER: number = countFileLines(
//     fs.readFileSync(files[4], 'utf-8'),
//   );
//   if (fileLenghtORI != fileLenghtVER) {
//     console.log(
//       'Arquivos com tamanhos diferentes:\n',
//       'Arquivo ORI: ',
//       qtdLinesORI,
//       ' linhas, ',
//       fileLenghtORI,
//       ' campos\n',
//       qtdLinesVER,
//       ' linhas, ',
//       'Arquivo VER: ',
//       fileLenghtVER,
//       ' campos',
//     );
//   } else
//     console.log(
//       'Arquivos com mesmo tamanho:\n',
//       'Arquivo ORI: ',
//       qtdLinesORI,
//       ' linhas, ',
//       fileLenghtORI,
//       ' campos\n',
//       'Arquivo VER: ',
//       qtdLinesVER,
//       ' linhas, ',
//       fileLenghtVER,
//       ' campos',
//     );
// }
const registerTypes = getRegisterTypes();

function compareFileSizeByKeys(
  dataStructureKeysORI: DataStructure[],
  dataStructureKeysVER: DataStructure[],
) {
  console.log('Total de registros ORI: ', dataStructureKeysORI.length);
  console.log('Total de registros VER: ', dataStructureKeysVER.length);

  registerTypes.forEach((regType) => {
    let qtdORI: number = 0;
    let qtdVER: number = 0;
    console.log('Registro tipo: ', regType);
    dataStructureKeysORI.forEach((keyORI) => {
      if (regType == keyORI.linhas.REGISTRO) {
        qtdORI++;
      }
    });
    console.log('Quantidade de registros ORI: ', qtdORI);
    dataStructureKeysVER.forEach((keyVER) => {
      if (regType == keyVER.linhas.REGISTRO) {
        qtdVER++;
      }
    });
    console.log('Quantidade de registros VER: ', qtdVER);
  });

  console.table(dataStructureKeysORI);
  const onlyORI = dataStructureKeysORI.forEach((keyORI) => {
    //console.log(keyORI.linhas.REGISTRO);
    //console.log(keyORI.linhas.CAMPOS);
    // keyORI.linhas.CAMPOS.filter(({ CAMPO: campoORI, VALOR: valorORI }) =>
    //   dataStructureKeysVER.forEach((keyVER) => {
    //     !keyVER.linhas.CAMPOS.some(
    //       ({ CAMPO: campoVER, VALOR: valorVER }) =>
    //         campoORI === campoVER && valorORI === valorVER,
    //     );
    //   }),
    // );
  });

  //console.table(onlyORI);

  // const onlyVER = dataStructureKeysVER.linhas.filter(
  //   ({ CAMPO: campoVER, VALOR: valorVER, REGISTRO: registroVER }) =>
  //     fileDataStructuresVER[0].linhas.some(
  //       ({ CAMPO: campoORI, VALOR: valorORI, REGISTRO: registroORI }) =>
  //         campoVER === campoORI &&
  //         valorVER === valorORI &&
  //         registroVER === registroORI,
  //     ),
  // );
}

function compareFiles() {
  const fileORI = readFile(fs.readFileSync(files[3], 'utf-8'));
  const fileVER = readFile(fs.readFileSync(files[4], 'utf-8'));

  const dataStructureKeysORI = fileORI.dataStructureKeys;
  const dataStructureFieldsORI = fileORI.dataStructureFields;

  const dataStructureKeysVER = fileVER.dataStructureKeys;
  const dataStructureFieldsVER = fileVER.dataStructureFields;

  compareFileSizeByKeys(dataStructureKeysORI, dataStructureKeysVER);

  // fileDataStructuresORI[0].linhas.forEach((linha) => {
  //   console.log(linha);
  // });
  //console.log('Registros apenas no arquivo ORI:');
  //console.table(onlyORI);
  //console.log('Registros apenas no arquivo VER:');
  //console.table(onlyVER);
}

compareFiles();
