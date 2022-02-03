
import { ecs } from "@vux0303/ecs-with-replication";
import { findPrimeNumber } from "./Update";



const { ccclass, property } = cc._decorator;

class ecsUpdate extends ecs.Component {
    prime: number;
}

@ccclass
export default class PerfTest extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Prefab)
    entity: cc.Prefab = null;

    @property(Number)
    numEntity: Number = 0;



    //label: cc.Label;

    entityFrameLimit: number = 20;

    numCurrent: number = 0;

    admin: ecs.Admin;

    //per: Performance;//

    onLoad() {
        //this.per = new Performance();
        //this.label = this.labelNode.getComponent(cc.Label);
        //cc.game.setFrameRate(500);
        this.admin = new ecs.Admin();
        for (let i = 0; i < 2000; ++i) {
            this.admin.createEntity([ecsUpdate],
                ([u]) => {
                }, { pool: 2000 });
        }
    }
    perTs = 0;

    labelUpdateInterval = 10;
    update(dt) {
        // if (this.numCurrent == this.numEntity) return;
        // for (let i = 0; i < this.entityFrameLimit; ++i) {
        //     let node = cc.instantiate(this.entity);
        //     this.node.addChild(node);
        //     this.numCurrent++;
        //     if (this.numCurrent == this.numEntity) {
        //         console.log("finish");
        //         break;
        //     }
        // }

        this.perTs = performance.now();

        this.admin.queryActive([ecsUpdate], ([u]) => {
            u.prime = findPrimeNumber(10);
        })
        this.perTs = performance.now() - this.perTs;

        this.labelUpdateInterval--;
        if (this.labelUpdateInterval < 0) {
            this.labelUpdateInterval = 10
            this.label.string = this.perTs.toFixed(2).toString();
        }
    }
}
