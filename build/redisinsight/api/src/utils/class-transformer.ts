import { ClassType } from 'class-transformer/ClassTransformer';
import { ClassTransformOptions } from 'class-transformer/ClassTransformOptions';
import { classToPlain, plainToClass } from 'class-transformer';

export function classToClass<T, V>(
  targetClass: ClassType<T>,
  classInstance: V,
  options?: ClassTransformOptions,
): T {
  const defaultOptions = {
    excludeExtraneousValues: true,
    groups: ['security'],
  };

  const transformOptions = {
    ...defaultOptions,
    ...options,
  };

  return plainToClass(targetClass, classToPlain(classInstance, transformOptions), transformOptions);
}

export const cloneClassInstance = <V>(entity: V): V => classToClass(entity.constructor as ClassType<V>, entity);
