import { Component } from "./Component";

export type ClassConstructor<T = Component> = new () => T;
// The Signature type, a set of ClassConstructor's aka components
export type Signature = Set<ClassConstructor>
// The QuerySignature type, a convenience type, iterable counterpart of Signature
export type Filter = ConstructorArray | { [key: string]: ClassConstructor; }
// The utility type forcing at least one ClassConstructor in the array
export type ConstructorArray = [ClassConstructor] | ClassConstructor[]

//export type Enclose<T extends Component> = Omit<T, 'ecsActive' | 'dirtyProperties'>
export type FilterToInstanceType<T> = {
    // for every index P in indexable type T
    [P in keyof T]: T[P] extends ClassConstructor // if type T[P] extends ClassConstructor
    ? InstanceType<T[P]>// assume InstanceType of that T[P] as if 'new Class()' was invoked
    : never // otherwise, raise an error when a tuple of non-ClassConstructor types is passed to the helper
}

export type FilterResultHandler<T> = (components: FilterToInstanceType<T>, entityID?: number) => void