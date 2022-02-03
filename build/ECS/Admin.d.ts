import { Blueprint } from "./BluePrint";
import { Signal } from "./Signal";
import { System } from "./System";
import { ClassConstructor, ConstructorArray, Filter, FilterResultHandler, FilterToInstanceType } from "./TypeDefine";
export declare type CreateOptions = Partial<{
    signals: Signal<Filter>;
    pool: number;
}>;
export declare type BluePrintOverrideOption<T, K extends CreateOptions> = Partial<{
    overrideComponent: FilterResultHandler<T>;
    overrideSignal: K['signals']['initCB'];
}>;
export declare class Admin {
    private idIncrement;
    private systemList;
    private archetypes;
    private singletonComponents;
    private readingArchetype;
    private isQueryRunning;
    constructor();
    private addBuildInComponent;
    createEntity<T extends Filter, CreateOpt extends CreateOptions>(components: T, initCB: FilterResultHandler<T> | BluePrintOverrideOption<T, CreateOpt>, opts?: CreateOpt): number;
    createEntity<T extends Filter, CreateOpt extends CreateOptions>(blueprint: Blueprint<T, CreateOpt>, override?: FilterResultHandler<T> | BluePrintOverrideOption<T, CreateOpt>): number;
    private _createEntity;
    deleteEntity(entity: number): void;
    recycle<T extends Filter>(entity: number, signature: T, reset: FilterResultHandler<T>, blueprint?: Blueprint<T, any>): void;
    private _idToArchytype;
    private _query;
    queryAll<T extends Filter>(filter: T, mutator: FilterResultHandler<T>): void;
    queryActive<T extends Filter>(filter: T, mutator: FilterResultHandler<T>): void;
    addSingleton<T extends ClassConstructor>(comp: T, init?: (components: InstanceType<T>) => void): InstanceType<T>;
    getSingleton<T extends ClassConstructor>(index: T | string): InstanceType<T>;
    addComponents<T extends Filter, K extends Filter>(entity: number, components: T, signals: K, initNewComponents?: (components?: FilterToInstanceType<T>, signals?: FilterToInstanceType<K>) => void): void;
    removeComponents<T extends ConstructorArray, K extends ConstructorArray>(entity: number, components: T, signals: K): void;
    registerSystem<T extends System>(system: T): void;
    systemIdx: number;
    systemSize: number;
    update(dt: number): void;
    private reset;
}
