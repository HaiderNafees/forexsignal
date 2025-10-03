
'use client';

import { EventEmitter } from 'events';
import { type FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  on<E extends keyof T>(event: E, listener: T[E]): this {
    this.emitter.on(event as string, listener);
    return this;
  }

  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean {
    return this.emitter.emit(event as string, ...args);
  }
}

export const errorEmitter = new TypedEventEmitter<ErrorEvents>();
