"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
var Archetype_1 = require("./Archetype");
var BluePrint_1 = require("./BluePrint");
var Iterator_1 = require("./Iterator");
var Sibling_1 = require("./Sibling");
var Utils_1 = require("./Utils");
var Admin = /** @class */ (function () {
    //public context: Context;
    function Admin() {
        this.idIncrement = 1;
        //private idToArchetype: Archetype[] = [];
        this.readingArchetype = null; //is the archetype we querying on
        this.isQueryRunning = false;
        // public unregisterSystemm<T extends System>(system: T) {
        // }
        // The only method not mentioned before - in reality, it runs all
        // registered systems on all related archetypes
        this.systemIdx = 0;
        this.systemSize = 0;
        this.singletonComponents = new Map();
        this.systemList = [];
        this.archetypes = new Map();
        this.addBuildInComponent();
    }
    Admin.prototype.addBuildInComponent = function () {
        this.addSingleton(Sibling_1.Sibling, function () { });
    };
    Admin.prototype.createEntity = function (firstParam, secondParam, opts) {
        if (firstParam instanceof BluePrint_1.Blueprint) {
            var option = secondParam;
            if (option) {
                firstParam.overrideCB = option.overrideComponent;
                firstParam.signals.overrideCB = option.overrideSignal;
            }
            return this._createEntity(firstParam.filter, firstParam.initChainCB.bind(firstParam), firstParam.signals, firstParam.pool);
        }
        else {
            if (Iterator_1.Itr.len(firstParam) < 1 && (!opts || !opts.signals)) {
                console.warn("[ECS] can not create entity without components");
                return;
            }
            return this._createEntity(firstParam, secondParam, opts === null || opts === void 0 ? void 0 : opts.signals, opts === null || opts === void 0 ? void 0 : opts.pool);
        }
    };
    Admin.prototype._createEntity = function (components, init, signal, pool) {
        var e_1, _a;
        var _this = this;
        if (pool === void 0) { pool = 1; }
        if (Iterator_1.Itr.some(components, function (ctor) { return _this.singletonComponents.has(ctor); })) {
            throw new Error("[ECS] Creating entity with a component previously defined as singleton " + components);
        }
        if (pool < 1)
            pool = 1;
        var newEntityID = this.idIncrement;
        var signalLength = signal ? Iterator_1.Itr.len(signal === null || signal === void 0 ? void 0 : signal.components) : 0;
        var signatureSize = Iterator_1.Itr.len(components) + signalLength;
        if (!this.archetypes.has(signatureSize)) {
            this.archetypes.set(signatureSize, []);
        }
        var archetypeGroup = this.archetypes.get(signatureSize);
        var isMatch = function (arch) {
            if (signal) {
                return Iterator_1.Itr.every(components, function (Ctor) { return arch.signature.has(Ctor); })
                    && Iterator_1.Itr.every(signal.components, function (Ctor) { return arch.signature.has(Ctor); });
            }
            else {
                return Iterator_1.Itr.every(components, function (Ctor) { return arch.signature.has(Ctor); })
                    && !arch.isContainSignals;
            }
        };
        try {
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
            for (var archetypeGroup_1 = __values(archetypeGroup), archetypeGroup_1_1 = archetypeGroup_1.next(); !archetypeGroup_1_1.done; archetypeGroup_1_1 = archetypeGroup_1.next()) {
                var archetype = archetypeGroup_1_1.value;
                if (isMatch(archetype)) { //signature and achetype must be equal when create new entity
                    archetype.createEntity(components, init, signal, newEntityID);
                    this.idIncrement++;
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (archetypeGroup_1_1 && !archetypeGroup_1_1.done && (_a = archetypeGroup_1.return)) _a.call(archetypeGroup_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var newType = new Archetype_1.Archetype(components, signal === null || signal === void 0 ? void 0 : signal.components, pool);
        this.archetypes.get(signatureSize).push(newType);
        newType.createEntity(components, init, signal, newEntityID);
        //this.idToArchetype[newEntityID] = achetype;
        this.idIncrement++;
        return newEntityID;
    };
    Admin.prototype.deleteEntity = function (entity) {
        //this.idToArchetype[entity].deleteEntity(entity);
        //this.idToArchetype[entity] = undefined;
        this._idToArchytype(entity).deleteEntity(entity);
    };
    Admin.prototype.recycle = function (entity, signature, reset, blueprint) {
        //this.idToArchetype[entity].recycle(entity, signature, reset, blueprint);
        //this.idToArchetype[entity] = undefined;
        this._idToArchytype(entity).recycle(entity, signature, reset, blueprint);
    };
    Admin.prototype._idToArchytype = function (entity) {
        if (this.readingArchetype && this.readingArchetype.hasEntity(entity)) {
            return this.readingArchetype;
        }
        else {
            this.archetypes.forEach(function (archetypeGroup, signature) {
                var e_2, _a;
                try {
                    for (var archetypeGroup_2 = __values(archetypeGroup), archetypeGroup_2_1 = archetypeGroup_2.next(); !archetypeGroup_2_1.done; archetypeGroup_2_1 = archetypeGroup_2.next()) {
                        var type = archetypeGroup_2_1.value;
                        if (type.hasEntity(entity)) {
                            return type;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (archetypeGroup_2_1 && !archetypeGroup_2_1.done && (_a = archetypeGroup_2.return)) _a.call(archetypeGroup_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            });
        }
    };
    Admin.prototype._query = function (filter, mutator, isQueryAll) {
        var _this = this;
        if (this.isQueryRunning) {
            throw new Error("[ECS] can not run nested query");
        }
        if (Iterator_1.Itr.len(filter) == 0) {
            return;
        }
        var signalAccessor;
        var mappedSigs = Iterator_1.Itr.map(filter, function (Ctor) {
            if (_this.singletonComponents.has(Ctor)) {
                if (Ctor == Sibling_1.Sibling) {
                    signalAccessor = _this.singletonComponents.get(Ctor);
                }
                return _this.singletonComponents.get(Ctor);
            }
            else {
                return Ctor;
            }
        });
        if (Iterator_1.Itr.every(mappedSigs, function (Ctor) { return typeof Ctor == 'object'; })) {
            mutator(mappedSigs);
            return;
        }
        this.isQueryRunning = true;
        this.archetypes.forEach(function (archetypeGroup) {
            var e_3, _a;
            var _loop_1 = function (type) {
                //dont have to be fully matching, just need to contain
                if (!Iterator_1.Itr.every(mappedSigs, function (Ctor) { return typeof Ctor == 'object' ? true : type.signature.has(Ctor); })) {
                    return { value: void 0 };
                }
                if (signalAccessor) {
                    signalAccessor.archetype = type;
                }
                _this.readingArchetype = type;
                type.query(mappedSigs, mutator, signalAccessor, isQueryAll);
                _this.readingArchetype = null;
            };
            try {
                for (var archetypeGroup_3 = __values(archetypeGroup), archetypeGroup_3_1 = archetypeGroup_3.next(); !archetypeGroup_3_1.done; archetypeGroup_3_1 = archetypeGroup_3.next()) {
                    var type = archetypeGroup_3_1.value;
                    var state_1 = _loop_1(type);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (archetypeGroup_3_1 && !archetypeGroup_3_1.done && (_a = archetypeGroup_3.return)) _a.call(archetypeGroup_3);
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
        this.isQueryRunning = false;
    };
    Admin.prototype.queryAll = function (filter, mutator) {
        this._query(filter, mutator, true);
    };
    Admin.prototype.queryActive = function (filter, mutator) {
        this._query(filter, mutator, false);
    };
    Admin.prototype.addSingleton = function (comp, init) {
        var e_4, _a, e_5, _b;
        if (this.singletonComponents.has(comp)) {
            console.warn("[ECS] Adding singleton " + comp.name + ' that already existed');
            return;
        }
        var group;
        try {
            for (var _c = __values(this.archetypes), _d = _c.next(); !_d.done; _d = _c.next()) {
                var pair = _d.value;
                group = pair[1];
                try {
                    for (var group_1 = (e_5 = void 0, __values(group)), group_1_1 = group_1.next(); !group_1_1.done; group_1_1 = group_1.next()) {
                        var type = group_1_1.value;
                        if (type.signature.has(comp)) {
                            throw new Error("[ECS] Adding singleton " + comp.name + ' that is used is an entity');
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (group_1_1 && !group_1_1.done && (_b = group_1.return)) _b.call(group_1);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_4) throw e_4.error; }
        }
        var instance = new comp();
        this.singletonComponents.set(comp, instance);
        if (init) {
            init(instance);
        }
        return instance;
    };
    Admin.prototype.getSingleton = function (index) {
        var e_6, _a;
        if (typeof index == "string") {
            try {
                for (var _b = __values(this.singletonComponents), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var pair = _c.value;
                    if (pair[1].constructor.name == index) {
                        return pair[1];
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        else {
            return this.singletonComponents.get(index);
        }
    };
    Admin.prototype.addComponents = function (entity, components, signals, initNewComponents) {
        var e_7, _a;
        if (!components && !signals || Iterator_1.Itr.len(components) < 1 && Iterator_1.Itr.len(signals) < 1 || entity == null) {
            return;
        }
        var source = this._idToArchytype(entity);
        if (Iterator_1.Itr.some(components, function (Ctor) { return source.signature.has(Ctor); })) {
            throw new Error('[ECS] Entity ' + entity + ' already contain adding component(s)');
        }
        var isComponentMatch = function () {
            if (components && Iterator_1.Itr.len(components) > 0) {
                return Iterator_1.Itr.every(components, function (Ctor) { return targetSignature.has(Ctor); }) && Utils_1.Utils.isSetContain(targetSignature, source.signature);
            }
            else {
                return Utils_1.Utils.isSetContain(targetSignature, source.signature);
            }
        };
        var isSignalMatch = function (target) {
            if (signals && Iterator_1.Itr.len(signals) > 0) {
                return Iterator_1.Itr.every(signals, function (Ctor) { return target.isContainSignal(Ctor); }) && Utils_1.Utils.isSetContain(targetSignature, source.signature);
            }
            else {
                return Utils_1.Utils.isSetContain(targetSignature, source.signature);
            }
        };
        var target;
        var tartgetSignatureSize = source.signature.size + Iterator_1.Itr.len(components);
        if (!this.archetypes.has(tartgetSignatureSize)) {
            this.archetypes.set(tartgetSignatureSize, []);
        }
        var targetSignature;
        var archetypeGroup = this.archetypes.get(tartgetSignatureSize);
        try {
            for (var archetypeGroup_4 = __values(archetypeGroup), archetypeGroup_4_1 = archetypeGroup_4.next(); !archetypeGroup_4_1.done; archetypeGroup_4_1 = archetypeGroup_4.next()) {
                var archetype = archetypeGroup_4_1.value;
                if (source.isContainSignals == archetype.isContainSignals
                    && isComponentMatch()
                    && isSignalMatch(archetype)) {
                    target = archetype;
                    break;
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (archetypeGroup_4_1 && !archetypeGroup_4_1.done && (_a = archetypeGroup_4.return)) _a.call(archetypeGroup_4);
            }
            finally { if (e_7) throw e_7.error; }
        }
        if (!target) {
            var targetCtors_1 = [];
            var targetSignals_1 = [];
            source.components.forEach(function (intancePool, Ctor) {
                if (source.isContainSignal(Ctor)) {
                    targetSignals_1.push(Ctor);
                }
                else {
                    targetCtors_1.push(Ctor);
                }
            });
            Iterator_1.Itr.forEach(components, function (Ctor) { targetCtors_1.push(Ctor); });
            Iterator_1.Itr.forEach(signals, function (Ctor) { targetSignals_1.push(Ctor); });
            target = new Archetype_1.Archetype(targetCtors_1, targetSignals_1, source.poolSize); //need to handle
            this.archetypes.get(tartgetSignatureSize).push(target);
        }
        var addingIntances = target.exchangeComponents(entity, source, components, signals);
        initNewComponents(addingIntances.comps, addingIntances.signals);
        source.exchangeCleanup(entity, target, signals);
        //this.idToArchetype[entity] = target;
    };
    Admin.prototype.removeComponents = function (entity, components, signals) {
        var e_8, _a, e_9, _b;
        if (!components && !signals || Iterator_1.Itr.len(components) < 1 && Iterator_1.Itr.len(signals) < 1 || entity == null) {
            return;
        }
        var source = this._idToArchytype(entity);
        var target;
        var tartgetSignatureSize = source.signature.size - Iterator_1.Itr.len(components);
        if (tartgetSignatureSize < 1) {
            throw new Error('[ECS] Entity ' + entity + ': can not remove all components');
        }
        var targetSignature = new Set(source.signature);
        Iterator_1.Itr.forEach(components, function (Ctor) {
            if (source.signature.has(Ctor)) {
                targetSignature.delete(Ctor);
            }
            else {
                throw new Error('[ECS] Entity ' + entity + ': removing non-exist component ' + Ctor.name);
            }
        });
        Iterator_1.Itr.forEach(signals, function (Ctor) {
            if (source.signature.has(Ctor)) {
                targetSignature.delete(Ctor);
            }
            else {
                throw new Error('[ECS] Entity ' + entity + ': removing non-exist signal ' + Ctor.name);
            }
        });
        var targetCtors = [];
        var targetSignals = [];
        source.components.forEach(function (intancePool, Ctor) {
            if (source.isContainSignal(Ctor)) {
                if (signals) {
                    if (!signals.includes(Ctor))
                        targetSignals.push(Ctor);
                }
                else {
                    targetSignals.push(Ctor);
                }
            }
            else {
                if (components) {
                    if (!components.includes(Ctor))
                        targetCtors.push(Ctor);
                }
                else {
                    targetCtors.push(Ctor);
                }
            }
        });
        var group;
        try {
            loop: for (var _c = __values(this.archetypes), _d = _c.next(); !_d.done; _d = _c.next()) {
                var pair = _d.value;
                group = pair[1];
                try {
                    for (var group_2 = (e_9 = void 0, __values(group)), group_2_1 = group_2.next(); !group_2_1.done; group_2_1 = group_2.next()) {
                        var type = group_2_1.value;
                        if ((type.isContainSignals == (Iterator_1.Itr.len(targetSignals) > 0))
                            && Utils_1.Utils.isSetEqual(type.signature, targetSignature)) {
                            target = type;
                            break loop;
                        }
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (group_2_1 && !group_2_1.done && (_b = group_2.return)) _b.call(group_2);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_8) throw e_8.error; }
        }
        if (!target) {
            //forEach(components, Ctor => { targetCtors.push(Ctor) });
            //forEach(signals, Ctor => { targetSignals.push(Ctor) });
            target = new Archetype_1.Archetype(targetCtors, targetSignals, source.poolSize); //need to handle
            if (!this.archetypes.has(tartgetSignatureSize)) {
                this.archetypes.set(tartgetSignatureSize, []);
            }
            this.archetypes.get(tartgetSignatureSize).push(target);
        }
        target.exchangeComponents(entity, source, null, null);
        source.exchangeCleanup(entity, target);
        //this.idToArchetype[entity] = target;
    };
    Admin.prototype.registerSystem = function (system) {
        system.admin = this;
        this.systemList.push(system);
        this.systemSize++;
        system.onRegister();
    };
    Admin.prototype.update = function (dt) {
        this.systemIdx = 0;
        for (this.systemIdx; this.systemIdx < this.systemSize; ++this.systemIdx) {
            this.systemList[this.systemIdx].update(dt);
        }
        this.systemIdx = 0;
        for (this.systemIdx; this.systemIdx < this.systemSize; ++this.systemIdx) {
            this.systemList[this.systemIdx].lateUpdate(dt);
        }
        this.reset();
    };
    //TO DO: iterate through all archetype is ineffection
    Admin.prototype.reset = function () {
        this.archetypes.forEach(function (archetype) {
            archetype.forEach(function (type) {
                if (type.isContainSignals) {
                    type.reset();
                }
            });
        });
    };
    return Admin;
}());
exports.Admin = Admin;
