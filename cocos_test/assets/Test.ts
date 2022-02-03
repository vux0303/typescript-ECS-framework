import { clientToServer, ecs } from "@vux0303/ecs-with-replication";
import RepAttachmentComponent from "@vux0303/ecs-with-replication/build/Replication/Components/RepAttachmentComponent";
import ReplicationSystem from "@vux0303/ecs-with-replication/build/Replication/Systems/ReplicationSystem";
import { RepDeBugSystem, RepKeyEncodeSystem } from "./RepConfig";


const { ccclass, property } = cc._decorator;

class Transform extends ecs.Component {
    name: string = '';
    age: string = '';
    prop: string = '';
}

class Sprite extends ecs.Component {
    name: string = '';
    age: string = '';
}

class Anim extends ecs.Component {
    name: string = 'singleton';
    age: string = '';
    anim: string = '';
}

class Character extends ecs.Component {
    @clientToServer({ processors: [RepDeBugSystem, RepKeyEncodeSystem] }, { processors: [RepDeBugSystem] })
    name: string = 'singleton';
    test: number = 4;
}

export class Car extends ecs.Component {
    //@serverToClient({isBroadcast: true, processors: [RepDeBugSystem, RepKeyEncodeSystem] }, { processors: [RepDeBugSystem] })
    @clientToServer({ processors: [RepDeBugSystem, RepKeyEncodeSystem] }, { processors: [RepDeBugSystem] })
    name: string = 'car'

    //@serverToClient({ processors: [RepKeyEncodeSystem, RepDeBugSystem] }, { processors: [RepDeBugSystem,] })
    @clientToServer({ processors: [RepKeyEncodeSystem, RepDeBugSystem] }, { processors: [RepDeBugSystem,] })
    wheels: number = 4;
}

class AddComponent extends ecs.Component {
    addComponentShape: boolean = false;
}

class RemovCopmponent extends ecs.Component {
    removCopmponentShape: boolean = false;
}
@ccclass
export default class Test extends cc.Component {
    admin: ecs.Admin;
    carBluePrint: ecs.Blueprint<[typeof Transform, typeof Sprite], { signals: ecs.Signal<[typeof Car, typeof RepAttachmentComponent]> }>;
    onLoad() {
        cc.debug.setDisplayStats(true);
        this.admin = new ecs.Admin();

        /////////////creation test
        for (let i = 0; i < 16; ++i) {
            this.admin.createEntity([Transform, Sprite],
                ([transform, sprite]) => {
                    transform.name = 'first instance';
                    sprite.name = 'first instance';
                }, { pool: 16 });
        }
        //////////////////////////////////////////////////////////////////////


        ////////////////////deletion test//////////////////////////////////////
        let deleteCount = 0;
        this.admin.queryActive({ t: Transform, s: Sprite },
            ({ t, s }, entityID) => {
                if (Math.random() > 0.5) {
                    if (entityID) {
                        this.admin.deleteEntity(entityID);
                        deleteCount++;
                    }
                }
            })
        console.log('Deleted ' + deleteCount);
        //////////////////////////////////////////////////////////////////////


        ////////////////////recycle test//////////////////////////////////////
        let reusedCount = 0;
        this.admin.queryActive({ t: Transform, s: Sprite },
            ({ t, s }, entityID) => {
                if (Math.random() > 0.5) {
                    if (entityID) {
                        reusedCount++;
                        this.admin.recycle(entityID, [Transform, Sprite], ([t, s]) => {
                            t.name = 'reused instance';
                            s.name = 'reused instance';
                        });
                    }
                }
            })

        for (let i = 0; i < reusedCount; ++i) {
            this.admin.createEntity([Transform, Sprite],
                ([transform, sprite]) => {
                    transform.name = 'second instance';
                    sprite.name = 'second instance';
                });
        }

        // this.admin.createEntity([Transform, Sprite],
        //     ([transform, sprite]) => {
        //     });

        this.admin.queryActive([Transform, Sprite],
            ([t, s], entityID) => {
                if (t.name == 'second instance') {
                    console.log('second instance');
                }
                if (t.name == 'reused instance') {
                    console.log('reuse instance');
                }
            });
        //////////////////////////////////////////////////////////////////////


        ////////////////////singleton test//////////////////////////////////////
        this.admin.addSingleton(Character, (c) => { });
        this.admin.addSingleton(Anim, (a) => { });
        this.admin.queryActive([Transform, Sprite, Character, Anim],
            ([t, s, c, a], entityID) => {
                if (t.name == 'second instance') {
                    console.log(c.name + " " + a.name);
                }
            });
        //console.log(this.admin.getSingleton(" "));
        //this.admin.createEntity([Anim, Character],()=>{});
        //////////////////////////////////////////////////////////////////////

        ////////////////////signal test//////////////////////////////////////
        this.carBluePrint = new ecs.Blueprint([Transform, Sprite],
            ([t, s]) => {

            }, {
            signals: new ecs.Signal([Car, RepAttachmentComponent], ([c, repAttachment]) => {
                console.log('initiate signal Car');
                repAttachment.targetClientID = "thisIsClientID";
                c.name = 'test';
            })
        })

        this.admin.createEntity(this.carBluePrint, {
            overrideSignal: ([c]) => {
                c.name = 'overrided when creating'
            }
        });

        this.admin.queryActive([Transform, Sprite, Car],
            ([t, s, c], entityID) => {
                throw new Error('Incorrect queryActive');
            });

        // this.admin.queryActive([Transform, Sprite, ecs.Sibling],
        //     ([t, s, sibling], entityID) => {
        //         let car = sibling.get(Car);
        //         if (car) {
        //             console.log(car.name);
        //             car.name = 'activeCar';
        //         }
        //     });

        this.admin.queryActive([Transform, Sprite, Car],
            ([t, s, c], entityID) => {
                console.log(c.name);
            });
        //////////////////////////////////////////////////////////////////////


        ////////////////////add component test//////////////////////////////////////
        let isOnce = false;
        this.admin.queryActive([Transform, Sprite],
            ([t, s], entityID) => {
                if (entityID) {
                    if (!isOnce) {
                        this.admin.addComponents(entityID, [AddComponent], undefined, ([comp], undefined) => {
                            comp.addComponentShape = true;
                        })
                        isOnce = true;
                    }
                }
            });

        this.admin.queryActive([Transform, Sprite, AddComponent],
            ([t, s, a], entityID) => {
                console.log(a.addComponentShape);
            });

        // this.admin.queryActive([Transform, Sprite, ecs.SignalAccessor],
        //     ([t, s, accesor], entityID) => {
        //         let addingComponent = accesor.get(AddComponent);
        //         if (addingComponent) {
        //             console.log(addingComponent.addComponentShape);
        //         }
        //     });
        //////////////////////////////////////////////////////////////////////

        ////////////////////remove component test//////////////////////////////////////
        this.admin.queryActive([Transform, Sprite, AddComponent],
            ([t, s, a], entityID) => {
                if (entityID) {
                    //this.admin.removeComponents(entityID, [AddComponent], null);
                };
            })

        this.admin.queryActive([Transform, Sprite, AddComponent],
            ([t, s, a], entityID) => {
                console.log('no more t,s,a');
            })
        //////////////////////////////////////////////////////////////////////

        ////////////////////decorator test//////////////////////////////////////
        this.admin.registerSystem(new ReplicationSystem());
        //////////////////////////////////////////////////////////////////////



        // Reflect.defineMetadata("custom", Transform, Transform);
        // let filter = Reflect.getMetadata("custom", Transform);
        // this.admin.queryActive([filter], ([f])=>{
        //     f['test'].
        // })

        // this.admin.queryAll([Car, ecs.Sibling],
        //     ([c, sibling], entityID) => {
        //         sibling.all().forEach((comp) => {
        //             console.log(comp.constructor.name);
        //         })
        //     });

    }

    frameCounter = 0;
    update(dt) {
        this.frameCounter++;
        if (this.frameCounter == 20) {
            this.admin.queryAll([Car],
                ([c], entityID) => {
                    c.name = "newName";
                    c.wheels = 6
                });

            // this.admin.queryAll([ReceivingMessageComponent], ([receivingMsg]) => {
            //     receivingMsg.content = {
            //         "Car_name/0": "sent to server",
            //         "Car_wheels/0": 111111111,
            //     }
            // })
        }
        // if (this.frameCounter == 21) {
        //     this.admin.queryAll([Car],
        //         ([c], entityID) => {
        //             console.log(c.name, c.wheels);
        //         });
        // }

        if (this.frameCounter == 50) {
            // this.admin.createEntity([Transform, Sprite],
            //     ([t, s]) => {
    
            //     }, {
            //     signals: new ecs.Signal([Car, RepAttachmentComponent], ([c, repAttachment]) => {
            //         console.log('initiate signal Car');
            //         repAttachment.targetClientID = "thisIsClientID";
            //         c.name = 'test';
            //     })
            // })
            let char = this.admin.getSingleton(Character);
            char.name = "udpated";
        }

        this.admin.update(dt);
    }
}

interface exportECS {
    name: string,
    age: number,
}

var obj = {
    name: "asd",
    age: 23,
    more: 21,
}

var obj1: exportECS = {
    name: "asd",
    age: 23,
}

export declare module Express {
    export class QVU {

    }
    class QVU1 {

    }
}