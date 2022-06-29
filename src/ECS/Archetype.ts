import { Blueprint } from "./BluePrint";
import { Component } from "./Component";
import { Itr } from "./Iterator";
import { Sibling } from "./Sibling";
import { Signal } from "./Signal";
import { ClassConstructor, ConstructorArray, Filter, FilterToInstanceType, Signature } from "./TypeDefine";

//signal proxy to check for changing
//be aware that Object.keys don't count uninitiated properties
var signalSetTrap: ProxyHandler<Component> = {
    set(obj, prop, value) {
        //let result;
        // if (prop == 'ecsActive') {
        //     obj[prop] = value;
        //     return;
        // }
        if (/*prop != 'ecsActive' && */prop != 'internal') {
            if (obj.activeByAll) {
                if (obj[prop] != value) {
                    obj.internal.dirtyProperties.add(prop as string);
                    //result = Reflect.set(obj, prop, value); //put here to count uninitiated properties
                    obj[prop] = value;
                    if (obj.internal.dirtyProperties.size == (Object.keys(obj).length - 3)) { //dont count activeByAll, activeOnCreate, internal
                        obj.internal.ecsActive = true;
                        obj.internal.dirtyProperties.clear();
                    }
                }
            } else {
                if (obj[prop] != value) obj.internal.ecsActive = true;
                obj[prop] = value;
                //result = Reflect.set(obj, prop, value);
            }
        }

        obj[prop] = value;

        if (prop == 'internal') {
            return true;
        }

        return true;
    }
}
export class Archetype {
    public signature: Signature;
    public components: Map<ClassConstructor, InstanceType<ClassConstructor>[]>
    public poolSize: number;
    public poolLastIndex: number;
    public nextAvailableRow: number;
    public entityToRowIndex: Map<number, number>;
    private rowIndexToEntity: number[];

    public isContainSignals: boolean = false;
    private signalQueyCache: Map<number, number[]>;
    private isDirty: boolean = false;

    private signalCtorBitmask: Map<ClassConstructor, number>;
    private ctorBitset: number = 0x1;

    isContainSignal(Ctor: ClassConstructor): boolean {
        return this.signalCtorBitmask.has(Ctor);
    }

    init() {
        this.components = new Map();
        this.signalCtorBitmask = new Map();
        this.signalQueyCache = new Map();
    }
    constructor(components: Filter, signalComponent: Filter, initialPoolSize: number) {//components should be understand as componenet constructor
        this.init();

        let narrowedComponents: ConstructorArray = Itr.filterToArray(components);
        let narrowedSignalComponents: ConstructorArray
        if (signalComponent && Itr.len(signalComponent) > 0) {
            narrowedSignalComponents = Itr.filterToArray(signalComponent);
            narrowedSignalComponents.forEach(Ctor => {
                narrowedComponents.push(Ctor);
                this.signalCtorBitmask.set(Ctor, this.ctorBitset);
                this.ctorBitset = this.ctorBitset << 1;
            })
            this.isContainSignals = true;
        }

        this.signature = new Set(narrowedComponents); // calculate the signature
        if (this.signature.size != narrowedComponents.length) {
            throw new Error("[ECS] creating entity with duplicated components");
        }
        // init component pools
        narrowedComponents.forEach((Ctor) => {
            this.components.set(Ctor, Array(initialPoolSize)
                .fill(null)
                // This is the reason ClassConstructor matches _only_ classes with, constructors that have no required arguments
                .map(() => {
                    if (this.signalCtorBitmask.has(Ctor)) {
                        return new Proxy(new Ctor, signalSetTrap);
                    } else {
                        return new Ctor();
                    }
                }))
        })

        this.poolSize = initialPoolSize;
        this.entityToRowIndex = new Map();
        this.rowIndexToEntity = [];
        this.nextAvailableRow = 0;
        this.poolLastIndex = this.poolSize - 1;
    }
    public createEntity<T extends Filter>(
        components: T,
        init: (components: FilterToInstanceType<T>) => void,
        signal: Signal<any>,
        entityID: number,
    ) {
        if (this.nextAvailableRow > this.poolLastIndex) {
            this.resize()
        }

        const newRowIndex = this.nextAvailableRow;
        this.nextAvailableRow++
        this.entityToRowIndex.set(entityID, newRowIndex);
        this.rowIndexToEntity[newRowIndex] = entityID;

        // initialize the newly 'allocated' components
        let comps: FilterToInstanceType<any>;
        comps = Itr.map(components, (Ctor) => {
            return this.components.get(Ctor)[newRowIndex];
        })
        init(comps);

        if (signal) {
            let signals: FilterToInstanceType<any>;
            signals = Itr.map(signal.components, (Ctor) => {
                let comp = this.components.get(Ctor)[newRowIndex];
                if (signal.isActiveByAll) {
                    comp.internal.dirtyProperties = new Set();
                }
                return comp
            })
            signal.initChainCB(signals);
            //initiate signals may active them so we need to reset all to inactive
            Itr.forEach(signal.components, (Ctor) => {
                this.components.get(Ctor)[newRowIndex].internal.ecsActive = this.components.get(Ctor)[newRowIndex].activeOnCreation;
            })
            this.recordActiveSignal(newRowIndex);
        }

        return this;
    }

    //double the size of all component pools
    resize() {
        //is it ok to let this happen somewhere during gameplay?
        this.components.forEach((instances, Ctor) => {
            instances.push(...Array(this.poolSize).fill(null));
            let i = this.poolLastIndex + 1;
            let len = instances.length;
            for (i; i < len; ++i) {
                instances[i] = new Ctor();
            }
        })
        this.poolSize *= 2;
        this.poolLastIndex = this.poolSize - 1;
    }

    public deleteEntity(entity: number) {
        const row = this.entityToRowIndex.get(entity);
        if (row == null || this.nextAvailableRow == 0) {
            return // nothing was deleted
        }

        this.nextAvailableRow--;
        if (row === this.nextAvailableRow) { //deleting last row
            let temp;
            this.components.forEach((pool, Ctor) => {
                temp = pool[row];
                pool[row] = pool[this.poolLastIndex]; //swap last row to deleting row
                pool[this.poolLastIndex] = temp;
            })

            delete this.rowIndexToEntity[row]
            this.entityToRowIndex.delete(entity);
        } else {
            let temp;
            this.components.forEach((pool, Ctor) => {
                temp = pool[row];
                pool[row] = pool[this.nextAvailableRow]; //swap last row to deleting row
                pool[this.nextAvailableRow] = pool[this.poolLastIndex]; // swap deleting row to last row of the pool
                pool[this.poolLastIndex] = temp;
            })

            // maintain index of the moved entity
            this.rowIndexToEntity[row] = this.rowIndexToEntity[this.nextAvailableRow]
            this.entityToRowIndex.set(this.rowIndexToEntity[row], row);

            // delete the entity from index
            delete this.rowIndexToEntity[this.nextAvailableRow]
            //delete this.entityToRowIndex[entity]
            this.entityToRowIndex.delete(entity);
        }
        this.poolLastIndex--;
    }

    public recycle<T extends Filter>(
        entity: number,
        components: T,
        reset: (components: FilterToInstanceType<T>) => void,
        blueprint?: Blueprint<T, any>
    ) {
        const row = this.entityToRowIndex.get(entity);
        if (row == null || this.nextAvailableRow == 0) {
            return // nothing was deleted
        }

        this.nextAvailableRow--;
        if (row === this.nextAvailableRow) {
            // if we are deleting the last used row, just delete the entity from index
            delete this.rowIndexToEntity[row]
            this.entityToRowIndex.delete(entity);
        } else {
            let temp;
            this.components.forEach((pool, Ctor) => { //swap last row to deleting row
                temp = pool[row];
                pool[row] = pool[this.nextAvailableRow];
                pool[this.nextAvailableRow] = temp;
            })

            // maintain index of the moved entity
            this.rowIndexToEntity[row] = this.rowIndexToEntity[this.nextAvailableRow]
            this.entityToRowIndex.set(this.rowIndexToEntity[row], row);

            // delete the entity from index
            delete this.rowIndexToEntity[this.nextAvailableRow]
            //delete this.entityToRowIndex[entity]
            this.entityToRowIndex.delete(entity);
        }

        let comps: FilterToInstanceType<any>;
        if (Itr.len(components) > 0) {
            //need separated loop to preseve comps order
            comps = Itr.map(components, (Ctor) => {
                if (this.components.has(Ctor)) {
                    let comp = this.components.get(Ctor)[this.nextAvailableRow];
                    return comp;
                } else {
                    throw new Error(`[ECS] recycling ${entity}: can not find component ${Ctor.name}`);
                }
            })
            reset(comps);
        }
        if (blueprint) {
            comps = Itr.map(blueprint.filter, (Ctor) => {
                if (this.components.has(Ctor)) {
                    return this.components.get(Ctor)[this.nextAvailableRow];
                } else {
                    throw new Error(`[ECS] recycling ${entity}: mismatch blueprint`);
                }
            })
            blueprint.initCB(comps);
            if (this.isContainSignals) {
                comps = Itr.map(blueprint.signals.components, (Ctor) => {
                    if (this.components.has(Ctor)) {
                        return this.components.get(Ctor)[this.nextAvailableRow];
                    } else {
                        throw new Error(`[ECS] recycling ${entity}: mismatch blueprint`);
                    }
                })
                blueprint.signals.initCB(comps);
            }
        }
    }

    // cacheSignalQuery<T extends Filter>(query: T) {
    //     let querySignalBitmask = 0;
    //     forEach(query, (Ctor) => {
    //         if (this.signalCtorBitmask.has(Ctor)) {
    //             querySignalBitmask = querySignalBitmask & this.signalCtorBitmask.get(Ctor);
    //         }
    //     })
    //     if (this.signalQueyCache.has(querySignalBitmask)) {
    //         console.log('[ECS] cache signal query already exist');
    //     } else {
    //         this.signalQueyCache.set(querySignalBitmask, []);
    //     }
    // }

    public query<T extends Filter>(
        filter: T,
        mutation: (components: FilterToInstanceType<T>, entityID?: number) => void,
        signalAccessor: Sibling,
        isQueryAll: boolean,
    ) {
        let querySignalBitmask = 0;
        let numCtorContaining = 0;
        Itr.forEach(filter, (Ctor) => {
            if (this.signalCtorBitmask.has(Ctor)) {
                querySignalBitmask = querySignalBitmask | this.signalCtorBitmask.get(Ctor);
            }
            if (this.components.has(Ctor)) numCtorContaining++;
        })

        let isQueryMatchEntity = numCtorContaining == this.signature.size;
        if (querySignalBitmask != 0 && !isQueryAll) { //query contain signal
            this.queryWithSignal(filter, mutation, signalAccessor, querySignalBitmask, isQueryMatchEntity);
        } else {
            //let sameSize = this.signature.size == length(query);
            let proxy: FilterToInstanceType<T>;
            for (let i = 0; i < this.nextAvailableRow; ++i) {
                if (signalAccessor) signalAccessor.readingRowIdx = i;
                proxy = Itr.map(filter, (Ctor) => {
                    if (typeof Ctor == 'object') {
                        return Ctor;
                    } else {
                        return this.components.get(Ctor)[i];
                    }
                })
                mutation(proxy, isQueryMatchEntity ? this.rowIndexToEntity[i] : null);
                this.recordActiveSignal(i);
            }
        }
    }

    public queryWithSignal<T extends Filter>(
        filter: T,
        mutation: (components: FilterToInstanceType<T>, entityID?: number) => void,
        signalAccessor: Sibling,
        querySignalBitmask: number,
        isQueryMatchEntity: boolean,
    ) {
        let proxy: FilterToInstanceType<T>;

        // if (!this.signalQueyCache.has(querySignalBitmask)) { //cache this quey if this is the first time encounter
        //     this.signalQueyCache.set(querySignalBitmask, []);
        // }

        this.signalQueyCache.forEach((activeIdx, cachedQueryMask) => {
            if ((cachedQueryMask & querySignalBitmask) == querySignalBitmask) {
                activeIdx.forEach((idx) => {
                    if (!this.rowIndexToEntity[idx]) return;
                    if (signalAccessor) signalAccessor.readingRowIdx = idx;
                    proxy = Itr.map(filter, (Ctor) => {
                        if (typeof Ctor == 'object') {
                            return Ctor;
                        } else {
                            return this.components.get(Ctor)[idx];
                        }
                    })
                    mutation(proxy, isQueryMatchEntity ? this.rowIndexToEntity[idx] : null);
                    this.recordActiveSignal(idx);
                })
            }
        })
    }

    private recordActiveSignal(idx: number) {
        let component;
        let querySignalBitmask = 0;
        this.signalCtorBitmask.forEach((bitset, Ctor) => {
            component = this.components.get(Ctor)[idx];
            if (component.ecsActive) {//if the component is activated
                querySignalBitmask = querySignalBitmask | bitset;
            }
        })

        if (querySignalBitmask > 0) {
            if (!this.signalQueyCache.has(querySignalBitmask)) {//cache this quey if this is the first time encounter
                this.signalQueyCache.set(querySignalBitmask, []);
            }
            this.isDirty = true;
        }

        if (this.signalQueyCache.has(querySignalBitmask)) {
            this.signalQueyCache.get(querySignalBitmask).push(idx);
        }
    }

    reset() {
        if (!this.isDirty) {
            return;
        }
        this.signalQueyCache.forEach((activeIdx, cachedQueryMask) => {
            activeIdx.forEach((idx) => {
                this.signalCtorBitmask.forEach((bitset, Ctor) => {
                    if ((cachedQueryMask & bitset) == bitset) {
                        this.components.get(Ctor)[idx].internal.ecsActive = false;
                    }
                })
            })

            this.signalQueyCache.set(cachedQueryMask, []);
        })
        this.isDirty = false;
    }

    public exchangeCleanup<T extends Filter>(entity: number, target: Archetype, signals?: T) {
        if (this.signature.size < target.signature.size) { //in case of adding components
            this.recycle(entity, [], null); //swap to last available row;
            if (signals) {
                Itr.forEach(signals, Ctor => target.components.get(Ctor)[target.nextAvailableRow - 1].internal.ecsActive = false);
            }
        } else { //in case of removing components
            this.deleteEntity(entity);
        }
    }

    public exchangeComponents<T extends Filter, K extends Filter>(
        entityID: number,
        source: Archetype,
        addingComponents: T,
        addingSignals: K
    ): { comps: FilterToInstanceType<T>, signals: FilterToInstanceType<K> } {
        if (this.nextAvailableRow > this.poolLastIndex) {
            this.resize()
        }
        const sourceRowIndex = source.entityToRowIndex.get(entityID);
        const newRowIndex = this.nextAvailableRow;
        this.nextAvailableRow++
        this.entityToRowIndex.set(entityID, newRowIndex);
        this.rowIndexToEntity[newRowIndex] = entityID;

        let swapTempVar;
        source.components.forEach((instancePool, Ctor) => {
            if (this.components.get(Ctor)) { //in case of removing comps, souce have more pools than target
                swapTempVar = instancePool[sourceRowIndex];
                instancePool[sourceRowIndex] = this.components.get(Ctor)[newRowIndex];
                this.components.get(Ctor)[newRowIndex] = swapTempVar;
            }
        })

        this.rowIndexToEntity[newRowIndex] = entityID;
        this.entityToRowIndex.set(entityID, newRowIndex);

        if (source.signature.size < this.signature.size) { //adding component case
            let returnIntances: {
                comps: FilterToInstanceType<T>,
                signals: FilterToInstanceType<K>
            } = { comps: null, signals: null };
            if (addingComponents) {
                returnIntances.comps = Itr.map(addingComponents, (Ctor) => {
                    return this.components.get(Ctor)[newRowIndex];
                })
            }
            if (addingSignals) {
                returnIntances.signals = Itr.map(addingSignals, (Ctor) => {
                    return this.components.get(Ctor)[newRowIndex];
                })
            }

            return returnIntances;
        }
    }

    hasEntity(entity: number) {
        return this.entityToRowIndex.has(entity);
    }
}