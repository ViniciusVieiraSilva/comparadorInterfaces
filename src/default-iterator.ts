import { Campo } from './campo';
import { DataStructure } from './data-structure';
import { IteratorProtocol } from './iterator-protocol';

export class DefaultIterator implements IteratorProtocol<Campo> {
  private index = 0;

  constructor(private readonly dataStructure: DataStructure) {}

  reset(): void {
    this.index = 0;
  }

  next(): IteratorResult<Campo> {
    const returnValue = this.makeValue(
      this.dataStructure.linhas.CAMPOS[this.index],
    );
    returnValue.done = this.index >= this.dataStructure.size();
    this.index++;
    return returnValue;
  }

  private makeValue(value: Campo): IteratorResult<Campo> {
    return { value, done: false };
  }
}
