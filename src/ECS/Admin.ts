import { Archetype } from "./Archetype";
import { Blueprint } from "./BluePrint";
import { Itr } from "./Iterator";
import { Sibling } from "./Sibling";
import { Signal } from "./Signal"
import { System } from "./System";
import { ClassConstructor, ConstructorArray, Filter, FilterResultHandler, FilterToInstanceType, Signature } from "./TypeDefine"
import { Utils } from "./Utils";

export type CreateOptions = Partial<{
    signals: Signal<Filter>,
    pool: number,
}>

export type BluePrintOverrideOption<T, K extends CreateOptions> = Partial<{
    overrideComponent: FilterResultHandler<T>,
    overrideSignal: K['signals']['initCB']
}>

export class Admin {
    private idIncrement: number = 1;
    private systemList: System[];
    private archetypes: Map<number, Archetype[]>;
    private singletonComponents: Map<ClassConstructor, InstanceType<ClassConstructor>>;
    //private idToArchetype: Archetype[] = [];

    private readingArchetype: Archetype = null; //is the archetype we querying on
    private isQueryRunning: boolean = false;

    //public context: Context;

    constructor() {
        this.singletonComponents = new Map();
        this.systemList = [];
        this.archetypes = new Map()
        this.addBuildInComponent();
    }
    private addBuildInComponent() {
        this.addSingleton(Sibling, () => { });
    }
    createEntity<T extends Filter, CreateOpt extends CreateOptions>(components: T, initCB: FilterResultHandler<T> | BluePrintOverrideOption<T, CreateOpt>, opts?: CreateOpt): number;

    createEntity<T extends Filter, CreateOpt extends CreateOptions>(blueprint: Blueprint<T, CreateOpt>, override?: FilterResultHandler<T> | BluePrintOverrideOption<T, CreateOpt>): number;
    createEntity<T extends Filter, CreateOpt extends CreateOptions>(firstParam: T | Blueprint<T, CreateOpt>, secondParam: FilterResultHandler<T> | BluePrintOverrideOption<T, CreateOpt>, opts?: CreateOpt): number {
        if (firstParam instanceof Blueprint) {
            let option = secondParam as BluePrintOverrideOption<T, CreateOpt>;
            if (option) {
                firstParam.overrideCB = option.overrideComponent;
                firstParam.signals.overrideCB = option.overrideSignal;
            }
            return this._createEntity(firstParam.filter, firstParam.initChainCB.bind(firstParam), firstParam.signals, firstParam.pool);
        } else {
            if (Itr.len(firstParam) < 1 && (!opts || !opts.signals)) {
                console.warn("[ECS] can not create entity without components");
                return;
            }
            return this._createEntity(firstParam, secondParam as FilterResultHandler<T>, opts?.signals, opts?.pool);
        }
    }

    private _createEntity<T extends Filter>(components: T, init: FilterResultHandler<T>, signal: Signal<any>, pool: number = 1) {
        if (Itr.some(components, ctor => this.singletonComponents.has(ctor))) {
            throw new Error("[ECS] Creating entity with a component previously defined as singleton " + components);
        }
        if (pool < 1) pool = 1;

        let newEntityID = this.idIncrement;
        let signalLength = signal ? Itr.len(signal?.components) : 0;
        let signatureSize = Itr.len(components) + signalLength;
        if (!this.archetypes.has(signatureSize)) {
            this.archetypes.set(signatureSize, []);
        }
        let archetypeGroup = this.archetypes.get(signatureSize);
        let isMatch = (arch: Archetype) => {
            if (signal) {
                return Itr.every(components, Ctor => arch.signature.has(Ctor))
                    && Itr.every(signal.components, Ctor => arch.signature.has(Ctor))
            } else {
                return Itr.every(components, Ctor => arch.signature.has(Ctor))
                    && !arch.isContainSignals
            }
        }

        // let sig: Signature;
        // for (let pair of this.archetypes) {
        //     sig = pair[0];
        //     if (isMatch(sig)) { //signature and achetype must be equal when create new entity
        //         achetype = this.archetypes.get(sig).createEntity(components, init, signal, newEntityID);
        //         //this.idToArchetype[newEntityID] = achetype;
        //         this.idIncrement++;
        //         return;
        //     }
        // }

        //achetypes are devided into group by its size
        for (let archetype of archetypeGroup) {
            if (isMatch(archetype)) { //signature and achetype must be equal when create new entity
                archetype.createEntity(components, init, signal, newEntityID);
                this.idIncrement++;
                return;
            }
        }

        let newType = new Archetype(components, signal?.components, pool);
        this.archetypes.get(signatureSize).push(newType);
        newType.createEntity(components, init, signal, newEntityID);
        //this.idToArchetype[newEntityID] = achetype;
        this.idIncrement++;
        return newEntityID;
    }

    public deleteEntity(entity: number) {
        //this.idToArchetype[entity].deleteEntity(entity);
        //this.idToArchetype[entity] = undefined;
        this._idToArchytype(entity).deleteEntity(entity);
    }

    public recycle<T extends Filter>(entity: number, signature: T, reset: FilterResultHandler<T>, blueprint?: Blueprint<T, any>) {
        //this.idToArchetype[entity].recycle(entity, signature, reset, blueprint);
        //this.idToArchetype[entity] = undefined;
        this._idToArchytype(entity).recycle(entity, signature, reset, blueprint);
    }

    private _idToArchytype(entity: number): Archetype {
        if (this.readingArchetype && this.readingArchetype.hasEntity(entity)) {
            return this.readingArchetype;
        } else {
            this.archetypes.forEach((archetypeGroup, signature) => {
                for (let type of archetypeGroup) {
                    if (type.hasEntity(entity)) {
                        return type;
                    }
                }
            })
        }
    }

    private _query<T extends Filter>(filter: T, mutator: FilterResultHandler<T>, isQueryAll: boolean) {
        if (this.isQueryRunning) {
            throw new Error("[ECS] can not run nested query");
        }
        if (Itr.len(filter) == 0) {
            return;
        }
        let signalAccessor: Sibling;
        let mappedSigs: any = Itr.map(filter, (Ctor: ClassConstructor) => {
            if (this.singletonComponents.has(Ctor)) {
                if (Ctor == Sibling) {
                    signalAccessor = this.singletonComponents.get(Ctor) as Sibling;
                }
                return this.singletonComponents.get(Ctor);
            } else {
                return Ctor;
            }
        })

        if (Itr.every(mappedSigs, Ctor => { return typeof Ctor == 'object' })) {
            mutator(mappedSigs);
            return;
        }

        this.isQueryRunning = true;
        this.archetypes.forEach((archetypeGroup) => {
            for (let type of archetypeGroup) {
                //dont have to be fully matching, just need to contain
                if (!Itr.every(mappedSigs, Ctor => { return typeof Ctor == 'object' ? true : type.signature.has(Ctor) })) {
                    return; // query not contain the signature, nothing to do in this archetype
                }
                if (signalAccessor) {
                    signalAccessor.archetype = type;
                }
                this.readingArchetype = type;
                type.query(mappedSigs as T, mutator, signalAccessor, isQueryAll);
                this.readingArchetype = null;
            }
        })
        this.isQueryRunning = false;
    }

    public queryAll<T extends Filter>(filter: T, mutator: FilterResultHandler<T>) {
        this._query(filter, mutator, true);
    }

    public queryActive<T extends Filter>(filter: T, mutator: FilterResultHandler<T>) {
        this._query(filter, mutator, false);
    }

    public addSingleton<T extends ClassConstructor>(comp: T, init?: (components: InstanceType<T>) => void): InstanceType<T> {
        if (this.singletonComponents.has(comp)) {
            console.warn(`[ECS] Adding singleton ` + comp.name + ' that already existed');
            return;
        }
        let group: Archetype[];
        for (let pair of this.archetypes) {
            group = pair[1];
            for (let type of group) {
                if (type.signature.has(comp)) {
                    throw new Error(`[ECS] Adding singleton ` + comp.name + ' that is used is an entity');
                }
            }
        }

        let instance = new comp();
        this.singletonComponents.set(comp, instance);
        if (init) {
            init(instance as any);
        }
        return instance as any;
    }

    public getSingleton<T extends ClassConstructor>(index: T | string): InstanceType<T> {
        if (typeof index == "string") {
            for (let pair of this.singletonComponents) {
                if (pair[1].constructor.name == index) {
                    return pair[1] as any;
                }
            }
        } else {
            return this.singletonComponents.get(index) as any;
        }
    }

    public addComponents<T extends Filter, K extends Filter>(
        entity: number,
        components: T,
        signals: K,
        initNewComponents?: (components?: FilterToInstanceType<T>, signals?: FilterToInstanceType<K>) => void
    ) {
        if (!components && !signals || Itr.len(components) < 1 && Itr.len(signals) < 1 || entity == null) {
            return;
        }
        let source: Archetype = this._idToArchytype(entity);
        if (Itr.some(components, Ctor => source.signature.has(Ctor))) {
            throw new Error('[ECS] Entity ' + entity + ' already contain adding component(s)');
        }

        let isComponentMatch = () => {
            if (components && Itr.len(components) > 0) {
                return Itr.every(components, Ctor => targetSignature.has(Ctor)) && Utils.isSetContain(targetSignature, source.signature)
            } else {
                return Utils.isSetContain(targetSignature, source.signature);
            }
        }

        let isSignalMatch = (target: Archetype) => {
            if (signals && Itr.len(signals) > 0) {
                return Itr.every(signals, Ctor => target.isContainSignal(Ctor)) && Utils.isSetContain(targetSignature, source.signature)
            } else {
                return Utils.isSetContain(targetSignature, source.signature);
            }
        }

        let target: Archetype;
        let tartgetSignatureSize = source.signature.size + Itr.len(components);
        if (!this.archetypes.has(tartgetSignatureSize)) {
            this.archetypes.set(tartgetSignatureSize, []);
        }
        let targetSignature: Signature;
        let archetypeGroup = this.archetypes.get(tartgetSignatureSize);
        for (let archetype of archetypeGroup) {
            if (source.isContainSignals == archetype.isContainSignals
                && isComponentMatch()
                && isSignalMatch(archetype)) {
                target = archetype;
                break;
            }
        }

        if (!target) {
            let targetCtors: ConstructorArray = [];
            let targetSignals: ConstructorArray = [];
            source.components.forEach((intancePool, Ctor) => {

                if (source.isContainSignal(Ctor)) {
                    targetSignals.push(Ctor)
                } else {
                    targetCtors.push(Ctor)
                }
            });
            Itr.forEach(components, Ctor => { targetCtors.push(Ctor) });
            Itr.forEach(signals, Ctor => { targetSignals.push(Ctor) });
            target = new Archetype(targetCtors, targetSignals, source.poolSize); //need to handle
            this.archetypes.get(tartgetSignatureSize).push(target);
        }

        let addingIntances = target.exchangeComponents(entity, source, components, signals);
        initNewComponents(addingIntances.comps, addingIntances.signals);
        source.exchangeCleanup(entity, target, signals);
        //this.idToArchetype[entity] = target;
    }

    public removeComponents<T extends ConstructorArray, K extends ConstructorArray>(entity: number, components: T, signals: K) {
        if (!components && !signals || Itr.len(components) < 1 && Itr.len(signals) < 1 || entity == null) {
            return;
        }
        let source: Archetype = this._idToArchytype(entity);
        let target: Archetype;
        let tartgetSignatureSize = source.signature.size - Itr.len(components);
        if (tartgetSignatureSize < 1) {
            throw new Error('[ECS] Entity ' + entity + ': can not remove all components');
        }
        let targetSignature = new Set(source.signature);
        Itr.forEach(components, (Ctor) => {
            if (source.signature.has(Ctor)) {
                targetSignature.delete(Ctor);
            } else {
                throw new Error('[ECS] Entity ' + entity + ': removing non-exist component ' + Ctor.name);
            }
        })

        Itr.forEach(signals, (Ctor) => {
            if (source.signature.has(Ctor)) {
                targetSignature.delete(Ctor);
            } else {
                throw new Error('[ECS] Entity ' + entity + ': removing non-exist signal ' + Ctor.name);
            }
        })

        let targetCtors: ConstructorArray = [];
        let targetSignals: ConstructorArray = [];
        source.components.forEach((intancePool, Ctor) => {
            if (source.isContainSignal(Ctor)) {
                if (signals) {
                    if (!signals.includes(Ctor)) targetSignals.push(Ctor)
                } else {
                    targetSignals.push(Ctor)
                }
            } else {
                if (components) {
                    if (!components.includes(Ctor)) targetCtors.push(Ctor);
                } else {
                    targetCtors.push(Ctor);
                }
            }
        });

        let group: Archetype[];
        loop: for (let pair of this.archetypes) {
            group = pair[1];
            for (let type of group) {
                if ((type.isContainSignals == (Itr.len(targetSignals) > 0))
                    && Utils.isSetEqual(type.signature, targetSignature)) {
                    target = type;
                    break loop;
                }
            }
        }

        if (!target) {
            //forEach(components, Ctor => { targetCtors.push(Ctor) });
            //forEach(signals, Ctor => { targetSignals.push(Ctor) });
            target = new Archetype(targetCtors, targetSignals, source.poolSize); //need to handle
            if (!this.archetypes.has(tartgetSignatureSize)) {
                this.archetypes.set(tartgetSignatureSize, []);
            }
            this.archetypes.get(tartgetSignatureSize).push(target);
        }

        target.exchangeComponents(entity, source, null, null);
        source.exchangeCleanup(entity, target);
        //this.idToArchetype[entity] = target;
    }

    public registerSystem<T extends System>(system: T) {
        system.admin = this;
        this.systemList.push(system);
        this.systemSize++;

        system.onRegister();
    }

    // public unregisterSystemm<T extends System>(system: T) {

    // }

    // The only method not mentioned before - in reality, it runs all
    // registered systems on all related archetypes
    systemIdx: number = 0;
    systemSize: number = 0;
    public update(dt: number) {
        this.systemIdx = 0;
        for (this.systemIdx; this.systemIdx < this.systemSize; ++this.systemIdx) {
            this.systemList[this.systemIdx].update(dt);
        }
        this.systemIdx = 0;
        for (this.systemIdx; this.systemIdx < this.systemSize; ++this.systemIdx) {
            this.systemList[this.systemIdx].lateUpdate(dt);
        }
        this.reset();
    }


    //TO DO: iterate through all archetype is ineffection
    private reset() {
        this.archetypes.forEach((archetype) => {
            archetype.forEach((type)=>{
                if (type.isContainSignals) {
                    type.reset();
                }
            })
        })
    }
}
