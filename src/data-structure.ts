import { DefaultIterator } from './default-iterator';
import { IteratorProtocol } from './iterator-protocol';
import { Campo } from './campo';
import { linha } from './linha';

export class DataStructure {
  private _linhas: linha = { CAMPOS: [], REGISTRO: '' };
  private iterator: IteratorProtocol<Campo> = new DefaultIterator(this);

  addItem(register: string, ...campos: Campo[]): void {
    campos.forEach((campo) => this.linhas.CAMPOS.push(campo));
    this.linhas.REGISTRO = register;
  }

  get linhas(): linha {
    return this._linhas;
  }

  size(): number {
    return this.linhas.CAMPOS.length;
  }

  changeIterator(iterator: IteratorProtocol<Campo>): void {
    this.iterator = iterator;
  }

  [Symbol.iterator](): IteratorProtocol<Campo> {
    return this.iterator;
  }

  resetIterator(): void {
    this.iterator.reset();
  }
}
