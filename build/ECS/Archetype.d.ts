import { Blueprint } from "./BluePrint";
import { Sibling } from "./Sibling";
import { Signal } from "./Signal";
import { ClassConstructor, Filter, FilterToInstanceType, Signature } from "./TypeDefine";
export declare class Archetype {
    signature: Signature;
    components: Map<ClassConstructor, InstanceType<ClassConstructor>[]>;
    poolSize: number;
    poolLastIndex: number;
    nextAvailableRow: number;
    entityToRowIndex: Map<number, number>;
    private rowIndexToEntity;
    isContainSignals: boolean;
    private signalQueyCache;
    private isDirty;
    private signalCtorBitmask;
    private ctorBitset;
    isContainSignal(Ctor: ClassConstructor): boolean;
    init(): void;
    constructor(components: Filter, signalComponent: Filter, initialPoolSize: number);
    createEntity<T extends Filter>(components: T, init: (components: FilterToInstanceType<T>) => void, signal: Signal<any>, entityID: number): this;
    resize(): void;
    deleteEntity(entity: number): void;
    recycle<T extends Filter>(entity: number, components: T, reset: (components: FilterToInstanceType<T>) => void, blueprint?: Blueprint<T, any>): void;
    query<T extends Filter>(filter: T, mutation: (components: FilterToInstanceType<T>, entityID?: number) => void, signalAccessor: Sibling, isQueryAll: boolean): void;
    queryWithSignal<T extends Filter>(filter: T, mutation: (components: FilterToInstanceType<T>, entityID?: number) => void, signalAccessor: Sibling, querySignalBitmask: number, isQueryMatchEntity: boolean): void;
    private recordActiveSignal;
    reset(): void;
    exchangeCleanup<T extends Filter>(entity: number, target: Archetype, signals?: T): void;
    exchangeComponents<T extends Filter, K extends Filter>(entityID: number, source: Archetype, addingComponents: T, addingSignals: K): {
        comps: FilterToInstanceType<T>;
        signals: FilterToInstanceType<K>;
    };
    hasEntity(entity: number): boolean;
}
