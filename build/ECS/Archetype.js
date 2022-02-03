"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Archetype = void 0;
var Iterator_1 = require("./Iterator");
//signal proxy to check for changing
//be aware that Object.keys don't count uninitiated properties
var signalSetTrap = {
    set: function (obj, prop, value) {
        //let result;
        // if (prop == 'ecsActive') {
        //     obj[prop] = value;
        //     return;
        // }
        if ( /*prop != 'ecsActive' && */prop != 'internal') {
            if (obj.internal.dirtyProperties) {
                if (obj[prop] != value) {
                    obj.internal.dirtyProperties.add(prop);
                    //result = Reflect.set(obj, prop, value); //put here to count uninitiated properties
                    obj[prop] = value;
                    if (obj.internal.dirtyProperties.size == (Object.keys(obj).length - 2)) { //dont count ecsActive and dirtyProperties
                        obj.internal.ecsActive = true;
                        obj.internal.dirtyProperties.clear();
                    }
                }
            }
            else {
                if (obj[prop] != value)
                    obj.internal.ecsActive = true;
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
};
var Archetype = /** @class */ (function () {
    function Archetype(components, signalComponent, initialPoolSize) {
        var _this = this;
        this.isContainSignals = false;
        this.isDirty = false;
        this.ctorBitset = 0x1;
        this.init();
        var narrowedComponents = Iterator_1.Itr.filterToArray(components);
        var narrowedSignalComponents;
        if (signalComponent && Iterator_1.Itr.len(signalComponent) > 0) {
            narrowedSignalComponents = Iterator_1.Itr.filterToArray(signalComponent);
            narrowedSignalComponents.forEach(function (Ctor) {
                narrowedComponents.push(Ctor);
                _this.signalCtorBitmask.set(Ctor, _this.ctorBitset);
                _this.ctorBitset = _this.ctorBitset << 1;
            });
            this.isContainSignals = true;
        }
        this.signature = new Set(narrowedComponents); // calculate the signature
        if (this.signature.size != narrowedComponents.length) {
            throw new Error("[ECS] creating entity with duplicated components");
        }
        // init component pools
        narrowedComponents.forEach(function (Ctor) {
            _this.components.set(Ctor, Array(initialPoolSize)
                .fill(null)
                // This is the reason ClassConstructor matches _only_ classes with, constructors that have no required arguments
                .map(function () {
                if (_this.signalCtorBitmask.has(Ctor)) {
                    return new Proxy(new Ctor, signalSetTrap);
                }
                else {
                    return new Ctor();
                }
            }));
        });
        this.poolSize = initialPoolSize;
        this.entityToRowIndex = new Map();
        this.rowIndexToEntity = [];
        this.nextAvailableRow = 0;
        this.poolLastIndex = this.poolSize - 1;
    }
    Archetype.prototype.isContainSignal = function (Ctor) {
        return this.signalCtorBitmask.has(Ctor);
    };
    Archetype.prototype.init = function () {
        this.components = new Map();
        this.signalCtorBitmask = new Map();
        this.signalQueyCache = new Map();
    };
    Archetype.prototype.createEntity = function (components, init, signal, entityID) {
        var _this = this;
        if (this.nextAvailableRow > this.poolLastIndex) {
            this.resize();
        }
        var newRowIndex = this.nextAvailableRow;
        this.nextAvailableRow++;
        this.entityToRowIndex.set(entityID, newRowIndex);
        this.rowIndexToEntity[newRowIndex] = entityID;
        // initialize the newly 'allocated' components
        var comps;
        comps = Iterator_1.Itr.map(components, function (Ctor) {
            return _this.components.get(Ctor)[newRowIndex];
        });
        init(comps);
        if (signal) {
            var signals = void 0;
            signals = Iterator_1.Itr.map(signal.components, function (Ctor) {
                var comp = _this.components.get(Ctor)[newRowIndex];
                if (signal.isActiveByAll) {
                    comp.internal.dirtyProperties = new Set();
                }
                return comp;
            });
            signal.initChainCB(signals);
            //initiate signals may active them so we need to reset all to inactive
            Iterator_1.Itr.forEach(signal.components, function (Ctor) {
                _this.components.get(Ctor)[newRowIndex].internal.ecsActive = _this.components.get(Ctor)[newRowIndex].activeOnCreation;
            });
            this.recordActiveSignal(newRowIndex);
        }
        return this;
    };
    //double the size of all component pools
    Archetype.prototype.resize = function () {
        var _this = this;
        //is it ok to let this happen somewhere during gameplay?
        this.components.forEach(function (instances, Ctor) {
            instances.push.apply(instances, __spreadArray([], __read(Array(_this.poolSize).fill(null))));
            var i = _this.poolLastIndex + 1;
            var len = instances.length;
            for (i; i < len; ++i) {
                instances[i] = new Ctor();
            }
        });
        this.poolSize *= 2;
        this.poolLastIndex = this.poolSize - 1;
    };
    Archetype.prototype.deleteEntity = function (entity) {
        var _this = this;
        var row = this.entityToRowIndex.get(entity);
        if (row == null || this.nextAvailableRow == 0) {
            return; // nothing was deleted
        }
        this.nextAvailableRow--;
        if (row === this.nextAvailableRow) { //deleting last row
            var temp_1;
            this.components.forEach(function (pool, Ctor) {
                temp_1 = pool[row];
                pool[row] = pool[_this.poolLastIndex]; //swap last row to deleting row
                pool[_this.poolLastIndex] = temp_1;
            });
            delete this.rowIndexToEntity[row];
            this.entityToRowIndex.delete(entity);
        }
        else {
            var temp_2;
            this.components.forEach(function (pool, Ctor) {
                temp_2 = pool[row];
                pool[row] = pool[_this.nextAvailableRow]; //swap last row to deleting row
                pool[_this.nextAvailableRow] = pool[_this.poolLastIndex]; // swap deleting row to last row of the pool
                pool[_this.poolLastIndex] = temp_2;
            });
            // maintain index of the moved entity
            this.rowIndexToEntity[row] = this.rowIndexToEntity[this.nextAvailableRow];
            this.entityToRowIndex.set(this.rowIndexToEntity[row], row);
            // delete the entity from index
            delete this.rowIndexToEntity[this.nextAvailableRow];
            //delete this.entityToRowIndex[entity]
            this.entityToRowIndex.delete(entity);
        }
        this.poolLastIndex--;
    };
    Archetype.prototype.recycle = function (entity, components, reset, blueprint) {
        var _this = this;
        var row = this.entityToRowIndex.get(entity);
        if (row == null || this.nextAvailableRow == 0) {
            return; // nothing was deleted
        }
        this.nextAvailableRow--;
        if (row === this.nextAvailableRow) {
            // if we are deleting the last used row, just delete the entity from index
            delete this.rowIndexToEntity[row];
            this.entityToRowIndex.delete(entity);
        }
        else {
            var temp_3;
            this.components.forEach(function (pool, Ctor) {
                temp_3 = pool[row];
                pool[row] = pool[_this.nextAvailableRow];
                pool[_this.nextAvailableRow] = temp_3;
            });
            // maintain index of the moved entity
            this.rowIndexToEntity[row] = this.rowIndexToEntity[this.nextAvailableRow];
            this.entityToRowIndex.set(this.rowIndexToEntity[row], row);
            // delete the entity from index
            delete this.rowIndexToEntity[this.nextAvailableRow];
            //delete this.entityToRowIndex[entity]
            this.entityToRowIndex.delete(entity);
        }
        var comps;
        if (Iterator_1.Itr.len(components) > 0) {
            //need separated loop to preseve comps order
            comps = Iterator_1.Itr.map(components, function (Ctor) {
                if (_this.components.has(Ctor)) {
                    var comp = _this.components.get(Ctor)[_this.nextAvailableRow];
                    return comp;
                }
                else {
                    throw new Error("[ECS] recycling " + entity + ": can not find component " + Ctor.name);
                }
            });
            reset(comps);
        }
        if (blueprint) {
            comps = Iterator_1.Itr.map(blueprint.filter, function (Ctor) {
                if (_this.components.has(Ctor)) {
                    return _this.components.get(Ctor)[_this.nextAvailableRow];
                }
                else {
                    throw new Error("[ECS] recycling " + entity + ": mismatch blueprint");
                }
            });
            blueprint.initCB(comps);
            if (this.isContainSignals) {
                comps = Iterator_1.Itr.map(blueprint.signals.components, function (Ctor) {
                    if (_this.components.has(Ctor)) {
                        return _this.components.get(Ctor)[_this.nextAvailableRow];
                    }
                    else {
                        throw new Error("[ECS] recycling " + entity + ": mismatch blueprint");
                    }
                });
                blueprint.signals.initCB(comps);
            }
        }
    };
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
    Archetype.prototype.query = function (filter, mutation, signalAccessor, isQueryAll) {
        var _this = this;
        var querySignalBitmask = 0;
        var numCtorContaining = 0;
        Iterator_1.Itr.forEach(filter, function (Ctor) {
            if (_this.signalCtorBitmask.has(Ctor)) {
                querySignalBitmask = querySignalBitmask | _this.signalCtorBitmask.get(Ctor);
            }
            if (_this.components.has(Ctor))
                numCtorContaining++;
        });
        var isQueryMatchEntity = numCtorContaining == this.signature.size;
        if (querySignalBitmask != 0 && !isQueryAll) { //query contain signal
            this.queryWithSignal(filter, mutation, signalAccessor, querySignalBitmask, isQueryMatchEntity);
        }
        else {
            //let sameSize = this.signature.size == length(query);
            var proxy = void 0;
            var _loop_1 = function (i) {
                if (signalAccessor)
                    signalAccessor.readingRowIdx = i;
                proxy = Iterator_1.Itr.map(filter, function (Ctor) {
                    if (typeof Ctor == 'object') {
                        return Ctor;
                    }
                    else {
                        return _this.components.get(Ctor)[i];
                    }
                });
                mutation(proxy, isQueryMatchEntity ? this_1.rowIndexToEntity[i] : null);
                this_1.recordActiveSignal(i);
            };
            var this_1 = this;
            for (var i = 0; i < this.nextAvailableRow; ++i) {
                _loop_1(i);
            }
        }
    };
    Archetype.prototype.queryWithSignal = function (filter, mutation, signalAccessor, querySignalBitmask, isQueryMatchEntity) {
        var _this = this;
        var proxy;
        // if (!this.signalQueyCache.has(querySignalBitmask)) { //cache this quey if this is the first time encounter
        //     this.signalQueyCache.set(querySignalBitmask, []);
        // }
        this.signalQueyCache.forEach(function (activeIdx, cachedQueryMask) {
            if ((cachedQueryMask & querySignalBitmask) == querySignalBitmask) {
                activeIdx.forEach(function (idx) {
                    if (!_this.rowIndexToEntity[idx])
                        return;
                    if (signalAccessor)
                        signalAccessor.readingRowIdx = idx;
                    proxy = Iterator_1.Itr.map(filter, function (Ctor) {
                        if (typeof Ctor == 'object') {
                            return Ctor;
                        }
                        else {
                            return _this.components.get(Ctor)[idx];
                        }
                    });
                    mutation(proxy, isQueryMatchEntity ? _this.rowIndexToEntity[idx] : null);
                    _this.recordActiveSignal(idx);
                });
            }
        });
    };
    Archetype.prototype.recordActiveSignal = function (idx) {
        var _this = this;
        var component;
        var querySignalBitmask = 0;
        this.signalCtorBitmask.forEach(function (bitset, Ctor) {
            component = _this.components.get(Ctor)[idx];
            if (component.ecsActive) { //if the component is activated
                querySignalBitmask = querySignalBitmask | bitset;
            }
        });
        if (querySignalBitmask > 0) {
            if (!this.signalQueyCache.has(querySignalBitmask)) { //cache this quey if this is the first time encounter
                this.signalQueyCache.set(querySignalBitmask, []);
            }
            this.isDirty = true;
        }
        if (this.signalQueyCache.has(querySignalBitmask)) {
            this.signalQueyCache.get(querySignalBitmask).push(idx);
        }
    };
    Archetype.prototype.reset = function () {
        var _this = this;
        if (!this.isDirty) {
            return;
        }
        this.signalQueyCache.forEach(function (activeIdx, cachedQueryMask) {
            activeIdx.forEach(function (idx) {
                _this.signalCtorBitmask.forEach(function (bitset, Ctor) {
                    if ((cachedQueryMask & bitset) == bitset) {
                        _this.components.get(Ctor)[idx].internal.ecsActive = false;
                    }
                });
            });
            _this.signalQueyCache.set(cachedQueryMask, []);
        });
        this.isDirty = false;
    };
    Archetype.prototype.exchangeCleanup = function (entity, target, signals) {
        if (this.signature.size < target.signature.size) { //in case of adding components
            this.recycle(entity, [], null); //swap to last available row;
            if (signals) {
                Iterator_1.Itr.forEach(signals, function (Ctor) { return target.components.get(Ctor)[target.nextAvailableRow - 1].internal.ecsActive = false; });
            }
        }
        else { //in case of removing components
            this.deleteEntity(entity);
        }
    };
    Archetype.prototype.exchangeComponents = function (entityID, source, addingComponents, addingSignals) {
        var _this = this;
        if (this.nextAvailableRow > this.poolLastIndex) {
            this.resize();
        }
        var sourceRowIndex = source.entityToRowIndex.get(entityID);
        var newRowIndex = this.nextAvailableRow;
        this.nextAvailableRow++;
        this.entityToRowIndex.set(entityID, newRowIndex);
        this.rowIndexToEntity[newRowIndex] = entityID;
        var swapTempVar;
        source.components.forEach(function (instancePool, Ctor) {
            if (_this.components.get(Ctor)) { //in case of removing comps, souce have more pools than target
                swapTempVar = instancePool[sourceRowIndex];
                instancePool[sourceRowIndex] = _this.components.get(Ctor)[newRowIndex];
                _this.components.get(Ctor)[newRowIndex] = swapTempVar;
            }
        });
        this.rowIndexToEntity[newRowIndex] = entityID;
        this.entityToRowIndex.set(entityID, newRowIndex);
        if (source.signature.size < this.signature.size) { //adding component case
            var returnIntances = { comps: null, signals: null };
            if (addingComponents) {
                returnIntances.comps = Iterator_1.Itr.map(addingComponents, function (Ctor) {
                    return _this.components.get(Ctor)[newRowIndex];
                });
            }
            if (addingSignals) {
                returnIntances.signals = Iterator_1.Itr.map(addingSignals, function (Ctor) {
                    return _this.components.get(Ctor)[newRowIndex];
                });
            }
            return returnIntances;
        }
    };
    Archetype.prototype.hasEntity = function (entity) {
        return this.entityToRowIndex.has(entity);
    };
    return Archetype;
}());
exports.Archetype = Archetype;
