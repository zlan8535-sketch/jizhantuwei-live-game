import { _decorator, Color, Component, Node, Camera, Label, v3 } from 'cc';
import GlobalData from '../../Init/Config/GlobalData';
import { GlobalEnum } from '../../Init/Config/GlobalEnum';
import { GlobalTmpData } from '../../Init/Config/GlobalTmpData';
const { ccclass, property } = _decorator;

@ccclass('RoleInfoCmp')
export class RoleInfoCmp extends Component {
    cameraUI: Camera = null;
    @property(Label)
    roleLabel: Label = null;
    private reserveLabel: Label = null;

    onEnable() {
        this.cameraUI = GlobalData.get(GlobalEnum.GlobalDataType.Camera3D);
        this.ensureReserveLabel();

    }

    update(dt) {
        this.updateTopOrder();
        this.setRoleInfo();
    }
    tmpP = v3();
    private updateTopOrder() {
        if (this.node && this.node.parent) {
            this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }
        if (this.roleLabel && this.roleLabel.node && this.roleLabel.node.parent) {
            this.roleLabel.node.setSiblingIndex(this.roleLabel.node.parent.children.length - 1);
        }
        if (this.reserveLabel && this.reserveLabel.node && this.reserveLabel.node.parent) {
            this.reserveLabel.node.setSiblingIndex(this.reserveLabel.node.parent.children.length - 1);
        }
    }

    private ensureReserveLabel() {
        if (this.reserveLabel || !this.roleLabel) return;
        const node = new Node('reserveRoleLabel');
        node.parent = this.roleLabel.node.parent;
        node.layer = this.roleLabel.node.layer;
        this.reserveLabel = node.addComponent(Label);
        this.reserveLabel.font = null;
        this.reserveLabel.fontSize = 28;
        this.reserveLabel.lineHeight = 30;
        this.reserveLabel.horizontalAlign = this.roleLabel.horizontalAlign;
        this.reserveLabel.verticalAlign = this.roleLabel.verticalAlign;
        this.reserveLabel.overflow = this.roleLabel.overflow;
        this.reserveLabel.enableWrapText = false;
        this.reserveLabel.color = new Color(120, 230, 255, 255);
        node.active = false;
    }

    setRoleInfo() {
        this.ensureReserveLabel();
        if (GlobalTmpData.Player.isPathEnd) {
            this.tmpP.set(GlobalTmpData.Player.wpos);
        } else {
            this.tmpP.set(GlobalTmpData.Player.wpos).add(GlobalTmpData.Player.offset);
        }

        this.tmpP.y += 3;
        this.cameraUI.convertToUINode(this.tmpP, this.node, this.tmpP);
        const reserveNum = GlobalTmpData.reserveRoleNum || 0;
        this.roleLabel.string = GlobalTmpData.normalRoleNum.toFixed(0);
        this.roleLabel.node.setPosition(this.tmpP.x, this.tmpP.y + (reserveNum > 0 ? 14 : 0), this.tmpP.z);
        if (this.reserveLabel) {
            this.reserveLabel.node.active = reserveNum > 0;
            this.reserveLabel.string = `备${reserveNum.toFixed(0)}`;
            this.reserveLabel.node.setPosition(this.tmpP.x, this.tmpP.y - 20, this.tmpP.z);
        }
    }

}

