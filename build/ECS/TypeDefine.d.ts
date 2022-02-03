import { Component } from "./Component";
export declare type ClassConstructor<T = Component> = new () => T;
export declare type Signature = Set<ClassConstructor>;
export declare type Filter = ConstructorArray | {
    [key: string]: ClassConstructor;
};
export declare type ConstructorArray = [ClassConstructor] | ClassConstructor[];
export declare type FilterToInstanceType<T> = {
    [P in keyof T]: T[P] extends ClassConstructor ? InstanceType<T[P]> : never;
};
export declare type FilterResultHandler<T> = (components: FilterToInstanceType<T>, entityID?: number) => void;
