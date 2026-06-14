import { _decorator, Button, Color, Component, director, Graphics, Label, Node, quat, UITransform, v3, tween, Tween, UIOpacity, Vec3, v2 } from 'cc';
import { GlobalTmpData } from '../../../Init/Config/GlobalTmpData';
import { GlobalEnum } from '../../../Init/Config/GlobalEnum';
import EventManager from '../../../Init/Managers/EventManager';
import { EventTypes } from '../../../Init/Managers/EventTypes';
import { StorageSystem } from '../../../Init/SystemStorage/StorageSystem';
import { LevelDataTmp } from '../../../Init/SystemStorage/StorageTemp';
import { UIEnum } from '../../../Init/SystemUI/UIEnum';
import { UISystem } from '../../../Init/SystemUI/UISystem';
import { EffectLayer } from '../Common/EffectLayer';
import { BasicLayer } from './Basic/BasicLayer';
import { BasicMountLayer } from './Basic/BasicMountLayer';
import { AudioSystem } from '../../../Init/SystemAudio/AudioSystem';
import { AudioEnum } from '../../../Init/SystemAudio/AudioEnum';
import { MergeEffectLayer } from '../Custom/mergeEffect/MergeEffectLayer';
import { RoleLayer } from '../Custom/RoleLayer';
import { RoadLayer } from '../Custom/road/RoadLayer';
import { CollisionManager } from './VertCollison/CollisionManager';
import { PropsLayer } from '../Custom/prop/PropsLayer';
import GlobalPool from '../../../Init/Tools/GlobalPool';
const { ccclass, property } = _decorator;

type LivePayload = {
    viewerId?: string;
    userId?: string;
    openId?: string;
    secUid?: string;
    nickName?: string;
    nickname?: string;
    userName?: string;
    avatarUrl?: string;
    avatar?: string;
    content?: string;
    count?: number;
    num?: number;
    repeatCount?: number;
    soldierCount?: number;
    giftId?: string;
    giftName?: string;
    giftType?: string;
    id?: string;
};

type LiveCloudEvent = {
    seq?: number;
    msgType?: string;
    type?: string;
    msgId?: string;
    openId?: string;
    viewerId?: string;
    userId?: string;
    secUid?: string;
    nickName?: string;
    nickname?: string;
    avatarUrl?: string;
    avatar?: string;
    count?: number;
    giftId?: string;
    giftName?: string;
    giftType?: string;
    comment?: string;
    content?: string;
};

@ccclass('LevelManager')
export class LevelManager extends Component {
    @property(Node)
    private layerNodeArr: Node[] = []; //需要继承 BasicMountLayer

    @property(Node)
    private perfabsLayer: Node = null; //用于存放游戏当前关卡场景中所有的物体


    private _isPause = false;
    private _isOver = false;
    //记录关卡数据
    private _lvData: LevelDataTmp = null;
    //记录是否运行游戏
    private _isRun = false;
    private readonly longLevelStageCount = 15;

    // #region -------------------生命周期---------------
    protected onLoad() {
        this.onEvents();
        this.initLayers();
        this.initCustomLayers();
        this.initLiveGmPanel();
        this.initLiveInteractionBridge();
    }

    protected onEvents() {
        EventManager.on(EventTypes.GameEvents.GamePause, this.onGamePause, this);
        EventManager.on(EventTypes.GameEvents.GameResume, this.onGameResume, this);
        EventManager.on(EventTypes.GameEvents.GameRun, this.onGameRun, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
        EventManager.on(EventTypes.GameEvents.SetGameTimeScale, this.onSetGameTimeScale, this);
        EventManager.on(EventTypes.GameEvents.GameLoadFinish, this.onGameLoadFinish, this);
        //
        EventManager.on(EventTypes.TouchEvents.TouchStart, this.onTouchStart, this);
    }

    protected onEnable() {
        this.reset();
        this.startRecord();
        this.setData();
    }

    protected start() {

    }

    protected onDisable() {
        this.resetLayers();
        this.resetCustomLayers();
    }

    /**重置状态 */
    protected reset() {
        this._isPause = false;
        this._isOver = false;
        this._isRun = false;
        GlobalTmpData.timeScale = 1.0;
        GlobalTmpData.reset();

        this.resetLayers();
    }

    protected setData() {

        this._lvData = this.buildLongLevelData(StorageSystem.getLvData());
        this.setLayersData(this._lvData);
        this.setCustomLayersData(this._lvData);
    }

    private buildLongLevelData(baseData: LevelDataTmp) {
        const storage = StorageSystem.getData();
        const startLv = storage.levelAssets.curLv;
        const longData = new LevelDataTmp();
        longData.lv = baseData.lv;

        const appendMiddle = (data: LevelDataTmp, sourceLv: number) => {
            if (!data || !data.path || data.path.length <= 0) return;
            const start = longData.path.length <= 0 ? 0 : 1;
            const end = Math.max(start, data.path.length - 1);
            for (let i = start; i < end; i++) {
                longData.path.push(data.path[i]);
                longData.enemy.push(data.enemy && data.enemy[i] ? data.enemy[i] : null);
                longData.enemyLv.push(sourceLv);
                longData.prop.push(data.prop && data.prop[i] ? data.prop[i] : null);
            }
        };

        appendMiddle(baseData, startLv);
        for (let i = 1; i < this.longLevelStageCount; i++) {
            appendMiddle(StorageSystem.getLvData(startLv + i), startLv + i);
        }

        const endData = StorageSystem.getLvData(startLv + this.longLevelStageCount - 1);
        const endIndex = endData && endData.path ? endData.path.length - 1 : -1;
        if (endIndex >= 0) {
            longData.path.push(endData.path[endIndex]);
            longData.enemy.push(endData.enemy && endData.enemy[endIndex] ? endData.enemy[endIndex] : null);
            longData.enemyLv.push(startLv + this.longLevelStageCount - 1);
            longData.prop.push(endData.prop && endData.prop[endIndex] ? endData.prop[endIndex] : null);
        }

        console.log('Long level data:', startLv, 'stages=', this.longLevelStageCount, 'paths=', longData.path.length);
        return longData;
    }

    protected update(dt) {
        this.updateLiveGmPanelOrder();
        this.updateLiveCloudPolling(dt);
        this.updateRunRecord(dt);
        if (this._isPause || this._isOver) return;
        this.updateGameRecord(dt);
        let ft = dt * GlobalTmpData.timeScale;
        this.updateLayers(ft);
        this.updateCustomLayers(ft)
    }
    protected lateUpdate(dt) {
        if (this._isPause || this._isOver) return;
        let ft = dt * GlobalTmpData.timeScale;
        this.lateUpdateLayers(ft);
        this.lateUpdateCustomLayers(ft);
    }
    // #endregion

    // #region -------------------数据统计-----------
    /**数据统计开始 */
    private startRecord() {
        GlobalTmpData.Game.startTime = Date.now();
        GlobalTmpData.Game.totalTime = 0;
        GlobalTmpData.Game.endTime = 0;
    }
    //记录游戏运行时长(包括暂停)
    private updateRunRecord(dt) {
        GlobalTmpData.Game.totalTime += dt;
    }
    //记录游戏时长(不包括暂停)
    private updateGameRecord(dt) {
        if (this._isOver) return;
        GlobalTmpData.Game.gameTime += dt;
    }
    private stopRecord() {
        GlobalTmpData.Game.endTime = Date.now();
    }

    // #endregion

    // #region -------------------挂载层级管理--------------
    //挂载的层级组件
    private mountLayers: BasicMountLayer[] = [];

    /**初始化层级数据 */
    protected initLayers() {
        for (let i = 0; i < this.layerNodeArr.length; i++) {
            const e = this.layerNodeArr[i];
            const cmp = e.getComponent(BasicMountLayer);
            this.mountLayers.push(cmp);
            cmp.initLayer();
        }
    }
    /**重置层级数据 */
    protected resetLayers() {
        for (let i = 0; i < this.mountLayers.length; i++) {
            this.mountLayers[i].reset();
        }
    }
    /**设定层级数据 */
    protected setLayersData(d) {
        for (let i = 0; i < this.mountLayers.length; i++) {
            this.mountLayers[i].setData(d);
        }
    }
    /**更新层级数据 */
    protected updateLayers(dt) {
        for (let i = 0; i < this.mountLayers.length; i++) {
            this.mountLayers[i].customUpdate(dt);
        }
    }
    /**更新层级数据 */
    protected lateUpdateLayers(dt) {
        for (let i = 0; i < this.mountLayers.length; i++) {
            this.mountLayers[i].customLateUpdate(dt);
        }
    }

    // #endregion

    // #region -------------------自定义层级管理--------------
    //自定义的层级组件
    private customLayers: BasicLayer[] = [];
    protected initCustomLayers() {
        /**添加自定义的管理层级 */
        this.customLayers.push(new RoadLayer(this.perfabsLayer));
        this.customLayers.push(new PropsLayer(this.perfabsLayer));
        this.customLayers.push(new CollisionManager(this.perfabsLayer));
        this.customLayers.push(new EffectLayer(this.perfabsLayer));
        this.customLayers.push(new MergeEffectLayer(this.perfabsLayer));
        this.customLayers.push(new RoleLayer(this.perfabsLayer));

        for (let i = 0; i < this.customLayers.length; i++) {
            this.customLayers[i].initLayer();
        }
    }
    protected resetCustomLayers() {
        for (let i = 0; i < this.customLayers.length; i++) {
            this.customLayers[i].reset();
        }
        GlobalPool.putAllChildren(this.perfabsLayer); //test

    }
    protected setCustomLayersData(d?) {
        for (let i = 0; i < this.customLayers.length; i++) {
            this.customLayers[i].setData(d);
        }
    }
    protected updateCustomLayers(dt) {
        for (let i = 0; i < this.customLayers.length; i++) {
            this.customLayers[i].customUpdate(dt);
        }
    }
    protected lateUpdateCustomLayers(dt) {
        for (let i = 0; i < this.customLayers.length; i++) {
            this.customLayers[i].customLateUpdate(dt);
        }
    }
    // #endregion

    // #region -------------------私有方法------

    //运行游戏
    private liveGmPanel: Node = null;
    private liveGmPanelBody: Node = null;
    private liveGmPanelTrans: UITransform = null;
    private liveGmPanelBg: Graphics = null;
    private liveGmToggleButton: Node = null;
    private liveGmToggleLabel: Label = null;
    private liveGmCollapsed = false;
    private liveGmTipLabel: Label = null;
    private liveGiftBanner: Node = null;
    private liveGiftTitleLabel: Label = null;
    private liveGiftDescLabel: Label = null;
    private liveGiftFeedbackSeq = 0;
    private liveGmPropIndex = 0;
    private liveGmViewerIndex = 0;
    private liveLikeCounter: { [viewerId: string]: number } = {};
    private readonly defaultLiveCloudBaseUrl = 'https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run';
    private liveCloudBaseUrl = '';
    private liveCloudEventSeq = 0;
    private liveCloudPollElapsed = 0;
    private liveCloudPollInterval = 1.0;
    private liveCloudPolling = false;
    private liveCloudSynced = false;

    private initLiveGmPanel() {
        if (this.liveGmPanel) return;

        const scene = director.getScene();
        const canvas = scene && scene.getChildByName('Canvas');
        const parent = canvas && (canvas.getChildByName('UILayer') || canvas);
        if (!parent) {
            console.warn('Live GM panel parent not found.');
            return;
        }

        const panel = new Node('LiveGmPanel');
        panel.parent = parent;
        panel.layer = parent.layer;
        panel.setSiblingIndex(parent.children.length - 1);
        panel.setPosition(-165, 120, 0);

        const panelTrans = panel.addComponent(UITransform);
        this.liveGmPanelTrans = panelTrans;
        const panelBg = panel.addComponent(Graphics);
        this.liveGmPanelBg = panelBg;
        this.drawLiveGmPanelBg(166, 360);

        this.liveGmToggleButton = this.createLiveGmButton(panel, 'LIVE GM -', v3(0, 166, 0), () => this.toggleLiveGmPanel(), 144, 26);
        this.liveGmToggleLabel = this.liveGmToggleButton.getChildByName('Label').getComponent(Label);

        const body = new Node('LiveGmBody');
        body.parent = panel;
        body.layer = panel.layer;
        this.liveGmPanelBody = body;

        const actions: { text: string, cb: () => void }[] = [
            { text: '礼物普通10', cb: () => this.gmGiftSoldiers('gift-normal', '普通兵', 10, GlobalEnum.WeaponType.Pistol) },
            { text: '礼物短枪10', cb: () => this.gmGiftSoldiers('gift-shotgun', '短枪兵', 10, GlobalEnum.WeaponType.Shotgun) },
            { text: '礼物机关10', cb: () => this.gmGiftSoldiers('gift-heavy', '机关枪兵', 10, GlobalEnum.WeaponType.MachineGun) },
            { text: '礼物巨人10', cb: () => this.gmGiftSoldiers('gift-giant', '巨人兵', 10, GlobalEnum.WeaponType.Pistol, true, 3) },
            { text: '模拟评论', cb: () => this.onLiveComment({ viewerId: `gm-comment-${++this.liveGmViewerIndex}`, nickName: `评论${this.liveGmViewerIndex}` }) },
            { text: '点赞x10', cb: () => this.onLiveLike({ viewerId: `gm-like-${++this.liveGmViewerIndex}`, nickName: `点赞${this.liveGmViewerIndex}`, count: 10 }) },
            { text: '观众加入', cb: () => this.gmAddViewerRoles(1, false, undefined, `gm-viewer-${++this.liveGmViewerIndex}`, { sourceType: 'viewer_join', reservePriority: 5, bypassActiveCap: true }) },
            { text: '观众x200', cb: () => this.gmAddViewerRoles(200, false, GlobalEnum.WeaponType.Pistol, 'gm-gift-viewer', { sourceType: 'viewer_gift', reservePriority: 0 }) },
            { text: '杀1兵', cb: () => this.gmKillRoles(1) },
            { text: '当前出敌', cb: () => this.gmCreateStageEnemies() },
            { text: '胜利', cb: () => this.gmWin() },
        ];

        this.createLiveGmLabel(body, 'Live Gift Test', v3(-38, 140, 0), 13, new Color(220, 230, 240, 255));

        for (let i = 0; i < actions.length; i++) {
            this.createLiveGmButton(body, actions[i].text, v3(0, 110 - i * 28, 0), actions[i].cb);
        }

        const tipNode = new Node('LiveGmTip');
        tipNode.parent = body;
        tipNode.layer = panel.layer;
        tipNode.setPosition(0, -154, 0);
        const tipTrans = tipNode.addComponent(UITransform);
        tipTrans.setContentSize(150, 24);
        const tipLabel = tipNode.addComponent(Label);
        tipLabel.fontSize = 13;
        tipLabel.color = new Color(255, 245, 130, 255);
        tipLabel.string = 'GM ready';
        this.liveGmTipLabel = tipLabel;

        this.liveGmPanel = panel;
        this.setLiveGmCollapsed(this.liveGmCollapsed, false);
        this.initLiveGiftBanner(parent);
    }

    private drawLiveGmPanelBg(width: number, height: number) {
        if (this.liveGmPanelTrans) {
            this.liveGmPanelTrans.setContentSize(width, height);
        }
        if (!this.liveGmPanelBg) return;
        this.liveGmPanelBg.clear();
        this.liveGmPanelBg.fillColor = new Color(22, 28, 36, 175);
        this.liveGmPanelBg.roundRect(-width * 0.5, -height * 0.5, width, height, 6);
        this.liveGmPanelBg.fill();
    }

    private updateLiveGmPanelOrder() {
        if (this.liveGmPanel && this.liveGmPanel.parent) {
            this.liveGmPanel.setSiblingIndex(this.liveGmPanel.parent.children.length - 1);
        }
        if (this.liveGmToggleButton && this.liveGmToggleButton.parent) {
            this.liveGmToggleButton.setSiblingIndex(this.liveGmToggleButton.parent.children.length - 1);
        }
        if (this.liveGiftBanner && this.liveGiftBanner.parent && this.liveGiftBanner.active) {
            this.liveGiftBanner.setSiblingIndex(this.liveGiftBanner.parent.children.length - 1);
        }
    }

    private toggleLiveGmPanel() {
        this.setLiveGmCollapsed(!this.liveGmCollapsed);
    }

    private setLiveGmCollapsed(isCollapsed: boolean, showTip = true) {
        this.liveGmCollapsed = isCollapsed;
        if (this.liveGmPanel) {
            this.liveGmPanel.active = true;
            this.liveGmPanel.setPosition(isCollapsed ? v3(-285, 310, 0) : v3(-165, 120, 0));
        }
        if (this.liveGmPanelBody) {
            this.liveGmPanelBody.active = !isCollapsed;
        }
        if (this.liveGmToggleLabel) {
            this.liveGmToggleLabel.string = isCollapsed ? 'LIVE GM +' : 'LIVE GM -';
        }
        if (this.liveGmToggleButton) {
            this.liveGmToggleButton.setPosition(isCollapsed ? v3(0, 0, 0) : v3(0, 166, 0));
        }
        this.drawLiveGmPanelBg(isCollapsed ? 150 : 166, isCollapsed ? 32 : 360);
        if (showTip) {
            EventManager.emit(EventTypes.GameEvents.ShowTips, isCollapsed ? 'GM 已隐藏' : 'GM 已展开');
        }
    }

    private initLiveGiftBanner(parent: Node) {
        if (this.liveGiftBanner) return;

        const banner = new Node('LiveGiftBanner');
        banner.parent = parent;
        banner.layer = parent.layer;
        banner.setPosition(0, 250, 0);
        banner.setScale(0.94, 0.94, 1);
        banner.active = false;

        const trans = banner.addComponent(UITransform);
        trans.setContentSize(430, 88);
        const opacity = banner.addComponent(UIOpacity);
        opacity.opacity = 0;

        const bg = banner.addComponent(Graphics);
        bg.fillColor = new Color(18, 28, 42, 232);
        bg.strokeColor = new Color(255, 214, 85, 255);
        bg.lineWidth = 3;
        bg.roundRect(-215, -44, 430, 88, 10);
        bg.fill();
        bg.stroke();

        const titleNode = new Node('GiftTitle');
        titleNode.parent = banner;
        titleNode.layer = banner.layer;
        titleNode.setPosition(0, 14, 0);
        const titleTrans = titleNode.addComponent(UITransform);
        titleTrans.setContentSize(400, 34);
        const title = titleNode.addComponent(Label);
        title.fontSize = 24;
        title.color = Color.WHITE;
        title.horizontalAlign = Label.HorizontalAlign.CENTER;
        title.verticalAlign = Label.VerticalAlign.CENTER;
        title.overflow = Label.Overflow.SHRINK;
        title.enableWrapText = false;
        title.string = '送礼增援';
        this.liveGiftTitleLabel = title;

        const descNode = new Node('GiftDesc');
        descNode.parent = banner;
        descNode.layer = banner.layer;
        descNode.setPosition(0, -22, 0);
        const descTrans = descNode.addComponent(UITransform);
        descTrans.setContentSize(400, 28);
        const desc = descNode.addComponent(Label);
        desc.fontSize = 18;
        desc.color = new Color(125, 235, 255, 255);
        desc.horizontalAlign = Label.HorizontalAlign.CENTER;
        desc.verticalAlign = Label.VerticalAlign.CENTER;
        desc.overflow = Label.Overflow.SHRINK;
        desc.enableWrapText = false;
        desc.string = '';
        this.liveGiftDescLabel = desc;

        this.liveGiftBanner = banner;
    }

    private createLiveGmLabel(parent: Node, text: string, pos: Vec3, fontSize: number, color: Color) {
        const labelNode = new Node(text);
        labelNode.parent = parent;
        labelNode.layer = parent.layer;
        labelNode.setPosition(pos);
        const labelTrans = labelNode.addComponent(UITransform);
        labelTrans.setContentSize(150, 22);
        const label = labelNode.addComponent(Label);
        label.fontSize = fontSize;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.string = text;
    }

    private createLiveGmButton(parent: Node, text: string, pos: Vec3, cb: () => void, width = 130, height = 24) {
        const btnNode = new Node(text);
        btnNode.parent = parent;
        btnNode.layer = parent.layer;
        btnNode.setPosition(pos);
        const trans = btnNode.addComponent(UITransform);
        trans.setContentSize(width, height);
        const bg = btnNode.addComponent(Graphics);
        bg.fillColor = new Color(35, 42, 48, 215);
        bg.strokeColor = new Color(210, 220, 225, 130);
        bg.lineWidth = 1;
        bg.roundRect(-width * 0.5, -height * 0.5, width, height, 5);
        bg.fill();
        bg.stroke();
        btnNode.addComponent(Button);
        btnNode.on(Button.EventType.CLICK, cb, this);

        const labelNode = new Node('Label');
        labelNode.parent = btnNode;
        labelNode.layer = btnNode.layer;
        labelNode.setPosition(0, 0, 0);
        const labelTrans = labelNode.addComponent(UITransform);
        labelTrans.setContentSize(width - 4, height - 2);
        const label = labelNode.addComponent(Label);
        label.fontSize = 14;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = false;
        label.string = text;
        return btnNode;
    }

    private gmAddRoles(num: number) {
        EventManager.emit(EventTypes.RoleEvents.AddRoles, GlobalEnum.IncreaseType.symbol_Add, num);
        this.showLiveGmTip(`GM: +${num}兵`);
    }

    private gmMulRoles(num: number) {
        EventManager.emit(EventTypes.RoleEvents.AddRoles, GlobalEnum.IncreaseType.symbol_Multip, num);
        this.showLiveGmTip(`GM: x${num}兵`);
    }

    private gmAddViewerRoles(num: number, isGiant = false, weaponType?: GlobalEnum.WeaponType, viewerId?: string, options: { sourceType?: 'viewer_join' | 'viewer_gift' | 'free', reservePriority?: number, bypassActiveCap?: boolean } = {}) {
        const data: { count: number, isGiant: boolean, giantLv: number, weaponType?: GlobalEnum.WeaponType, viewerId?: string, nickName?: string, sourceType?: 'viewer_join' | 'viewer_gift' | 'free', reservePriority?: number, bypassActiveCap?: boolean } = {
            count: num,
            isGiant,
            giantLv: isGiant ? 3 : 1,
            sourceType: options.sourceType || 'viewer_join',
            reservePriority: options.reservePriority,
            bypassActiveCap: !!options.bypassActiveCap,
        };
        if (viewerId) {
            data.viewerId = viewerId;
            data.nickName = viewerId == 'gm-gift-viewer' ? 'GiftViewer' : viewerId == 'gm-giant-viewer' ? 'GiantViewer' : `GM${this.liveGmViewerIndex}`;
        }
        if (weaponType !== undefined) {
            data.weaponType = weaponType;
        }
        EventManager.emit(EventTypes.RoleEvents.AddViewerRoles, data);
        this.showLiveGmTip(isGiant ? `GM: 观众巨人x${num} 备${GlobalTmpData.reserveRoleNum}` : `GM: 观众x${num} 备${GlobalTmpData.reserveRoleNum}`);
    }

    private gmGiftSoldiers(giftId: string, label: string, count: number, weaponType: GlobalEnum.WeaponType, isGiant = false, giantLv = 1) {
        const viewerNo = ++this.liveGmViewerIndex;
        const viewerId = `gm-${giftId}-${Date.now()}-${viewerNo}`;
        const nickName = `GM${viewerNo}`;
        EventManager.emit(EventTypes.RoleEvents.AddViewerRoles, {
            count,
            viewerId,
            nickName,
            isGiant,
            giantLv,
            weaponType,
            sourceType: 'viewer_gift',
            reservePriority: 0,
            bypassActiveCap: false,
        });
        setTimeout(() => {
            this.showLiveGmTip(`GM: ${label}x${count} 备${GlobalTmpData.reserveRoleNum}`);
            this.showLiveGiftBanner(nickName, label, count);
        }, 100);
    }

    private gmKillRoles(num: number) {
        EventManager.emit(EventTypes.RoleEvents.AddRoles, GlobalEnum.IncreaseType.symbol_Reduce, num);
        setTimeout(() => {
            this.showLiveGmTip(`GM: 杀${num}兵 备${GlobalTmpData.reserveRoleNum}`);
        }, 200);
    }

    private gmCreateDrone() {
        EventManager.emit(EventTypes.CurLevelEvents.CreateDrones);
        this.showLiveGmTip('GM: 无人机');
    }

    private gmCreateStageEnemies() {
        EventManager.emit(EventTypes.EnemyEvents.CreateGmStageEnemys);
        this.showLiveGmTip('GM: \u51fa\u654c');
    }

    private gmCreateWeapon() {
        const weaponType = Math.floor(Math.random() * 6);
        this.gmCreateProp('WeaponProp', `武器${weaponType}`, { weaponType, weaponId: Date.now() });
    }

    private gmCreateProp(prefabName: string, label: string, d: any) {
        const spawn = this.getLiveGmSpawnPoint();
        EventManager.emit(EventTypes.CurLevelEvents.CreateProps, prefabName, {
            p: spawn,
            r: quat(),
            d,
        });
        this.showLiveGmTip(`GM: ${label}`);
    }

    private gmWin() {
        EventManager.emit(EventTypes.GameEvents.GameOver, true);
        this.showLiveGmTip('GM: \u80dc\u5229');
    }

    private getLiveGmSpawnPoint() {
        const spawn = v3(GlobalTmpData.Player.wpos);
        const forward = v3(GlobalTmpData.Player.lineVec);
        if (forward.lengthSqr() < 0.01) {
            forward.set(0, 0, 1);
        } else {
            forward.normalize();
        }
        const side = v3(forward.z, 0, -forward.x);
        const offset = ((this.liveGmPropIndex % 5) - 2) * 1.8;
        this.liveGmPropIndex++;
        spawn.add(forward.multiplyScalar(8)).add(side.multiplyScalar(offset));
        spawn.y = 0;
        return spawn;
    }

    private showLiveGmTip(tip: string) {
        if (this.liveGmTipLabel) {
            this.liveGmTipLabel.string = tip;
        }
        EventManager.emit(EventTypes.GameEvents.ShowTips, tip);
        console.log(tip);
    }

    private initLiveInteractionBridge() {
        const g: any = typeof globalThis !== 'undefined' ? globalThis : null;
        if (!g) return;

        const bridge = {
            comment: (payload?: LivePayload) => this.onLiveComment(payload || {}),
            join: (payload?: LivePayload) => this.onLiveComment(payload || {}),
            like: (payload?: LivePayload) => this.onLiveLike(payload || {}),
            gift: (payload?: LivePayload) => this.onLiveGift(payload || {}),
            state: () => ({
                active: GlobalTmpData.normalRoleNum,
                reserve: GlobalTmpData.reserveRoleNum,
                level: GlobalTmpData.currentStageLv,
            }),
            setCloudUrl: (url: string) => this.setLiveCloudBaseUrl(url),
            pollCloud: () => this.requestLiveCloudEvents(),
        };

        g.__JZTW_LIVE__ = bridge;
        g.__DY_LIVE_GAME__ = bridge;
        this.tryBindDouyinLiveApis(g, bridge);
        this.initLiveCloudPolling(g);
        console.log('Live interaction bridge ready: window.__JZTW_LIVE__.comment/like/gift');
    }

    private initLiveCloudPolling(g: any) {
        const url = this.findLiveCloudBaseUrl(g);
        if (!url) return;
        this.setLiveCloudBaseUrl(url);
        this.requestLiveCloudEvents(true);
    }

    private findLiveCloudBaseUrl(g: any) {
        const candidates: string[] = [];
        if (g) {
            candidates.push(g.__JZTW_LIVE_CLOUD_URL__, g.__DY_LIVE_CLOUD_URL__);
            candidates.push(this.getQueryValue(g, ['liveCloudUrl', 'jztwCloudUrl', 'cloudUrl']));
            try {
                if (g.localStorage) {
                    candidates.push(g.localStorage.getItem('JZTW_LIVE_CLOUD_URL'));
                    candidates.push(g.localStorage.getItem('DY_LIVE_CLOUD_URL'));
                }
            } catch (e) {
                console.warn('Live cloud localStorage read failed', e);
            }
        }
        candidates.push(this.defaultLiveCloudBaseUrl);
        return candidates.map(v => String(v || '').trim()).find(v => !!v) || '';
    }

    private getQueryValue(g: any, keys: string[]) {
        const search = g && g.location && g.location.search ? String(g.location.search).replace(/^\?/, '') : '';
        if (!search) return '';
        const parts = search.split('&');
        for (let i = 0; i < parts.length; i++) {
            const pair = parts[i].split('=');
            const key = decodeURIComponent(pair[0] || '');
            if (keys.indexOf(key) >= 0) {
                return decodeURIComponent(pair.slice(1).join('=') || '');
            }
        }
        return '';
    }

    private setLiveCloudBaseUrl(url: string) {
        const nextUrl = String(url || '').trim().replace(/\/+$/, '');
        if (!nextUrl || nextUrl == this.liveCloudBaseUrl) return;
        this.liveCloudBaseUrl = nextUrl;
        this.liveCloudEventSeq = 0;
        this.liveCloudPollElapsed = this.liveCloudPollInterval;
        this.liveCloudSynced = false;
        this.showLiveGmTip(`云服务已连接: ${nextUrl}`);
    }

    private updateLiveCloudPolling(dt: number) {
        if (!this.liveCloudBaseUrl) return;
        this.liveCloudPollElapsed += dt;
        if (this.liveCloudPollElapsed < this.liveCloudPollInterval) return;
        this.liveCloudPollElapsed = 0;
        this.requestLiveCloudEvents();
    }

    private requestLiveCloudEvents(syncOnly = false) {
        if (!this.liveCloudBaseUrl || this.liveCloudPolling) return;
        this.liveCloudPolling = true;
        const url = `${this.liveCloudBaseUrl}/api/live/events?after=${this.liveCloudEventSeq}`;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 5000;
        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            this.liveCloudPolling = false;
            if (xhr.status < 200 || xhr.status >= 300) {
                console.warn(`Live cloud poll failed: ${xhr.status}`);
                return;
            }
            try {
                const body = JSON.parse(xhr.responseText || '{}');
                const data = body && body.data ? body.data : body;
                const events: LiveCloudEvent[] = data && data.events ? data.events : [];
                if (syncOnly && !this.liveCloudSynced) {
                    this.liveCloudEventSeq = Math.max(Number(data.latestSeq || 0), this.getMaxLiveCloudSeq(events));
                    this.liveCloudSynced = true;
                    console.log(`Live cloud synced at seq ${this.liveCloudEventSeq}`);
                    return;
                }
                this.dispatchLiveCloudEvents(events);
                this.liveCloudSynced = true;
                if (data && Number(data.latestSeq || 0) > this.liveCloudEventSeq) {
                    this.liveCloudEventSeq = Number(data.latestSeq);
                }
            } catch (e) {
                console.warn('Live cloud poll parse failed', e);
            }
        };
        xhr.onerror = () => {
            this.liveCloudPolling = false;
            console.warn('Live cloud poll network error');
        };
        xhr.ontimeout = () => {
            this.liveCloudPolling = false;
            console.warn('Live cloud poll timeout');
        };
        xhr.send();
    }

    private getMaxLiveCloudSeq(events: LiveCloudEvent[]) {
        let seq = 0;
        for (let i = 0; i < events.length; i++) {
            seq = Math.max(seq, Number(events[i].seq || 0));
        }
        return seq;
    }

    private dispatchLiveCloudEvents(events: LiveCloudEvent[]) {
        if (!events || events.length <= 0) return;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const seq = Number(event.seq || 0);
            if (seq > 0 && seq <= this.liveCloudEventSeq) continue;
            this.liveCloudEventSeq = Math.max(this.liveCloudEventSeq, seq);
            const msgType = String(event.msgType || event.type || '').toLowerCase();
            const payload = this.toLivePayload(event);
            if (msgType.indexOf('gift') >= 0) {
                this.onLiveGift(payload);
            } else if (msgType.indexOf('like') >= 0) {
                this.onLiveLike(payload);
            } else if (msgType.indexOf('comment') >= 0) {
                this.onLiveComment(payload);
            }
        }
    }

    private toLivePayload(event: LiveCloudEvent): LivePayload {
        const viewerId = String(event.viewerId || event.userId || event.openId || event.secUid || event.msgId || `cloud-${event.seq || ++this.liveGmViewerIndex}`);
        return {
            viewerId,
            userId: event.userId,
            openId: event.openId,
            secUid: event.secUid,
            nickName: event.nickName || event.nickname || viewerId,
            nickname: event.nickname,
            avatarUrl: event.avatarUrl,
            avatar: event.avatar,
            content: event.comment || event.content,
            count: Math.max(1, Math.floor(Number(event.count || 1))),
            giftId: event.giftId,
            giftName: event.giftName,
            giftType: event.giftType,
        };
    }

    private tryBindDouyinLiveApis(g: any, bridge: any) {
        const tt = g && g.tt;
        if (!tt) return;
        this.tryBindLiveApi(tt, 'onLiveComment', bridge.comment);
        this.tryBindLiveApi(tt, 'onLiveLike', bridge.like);
        this.tryBindLiveApi(tt, 'onLiveGift', bridge.gift);
        this.tryBindLiveApi(tt, 'onComment', bridge.comment);
        this.tryBindLiveApi(tt, 'onLike', bridge.like);
        this.tryBindLiveApi(tt, 'onGift', bridge.gift);
    }

    private tryBindLiveApi(target: any, apiName: string, cb: (payload?: LivePayload) => void) {
        if (!target || typeof target[apiName] != 'function') return;
        try {
            target[apiName]((payload: LivePayload) => cb(payload || {}));
            console.log(`Douyin live api bound: ${apiName}`);
        } catch (e) {
            console.warn(`Douyin live api bind failed: ${apiName}`, e);
        }
    }

    private normalizeLivePayload(payload: LivePayload = {}) {
        const count = Math.max(1, Math.floor(Number(payload.count || payload.num || payload.repeatCount || 1)));
        const viewerId = String(payload.viewerId || payload.userId || payload.openId || payload.secUid || `live-viewer-${++this.liveGmViewerIndex}`);
        const nickName = String(payload.nickName || payload.nickname || payload.userName || viewerId);
        return {
            viewerId,
            nickName,
            avatarUrl: payload.avatarUrl || payload.avatar || '',
            count,
            giftKey: String(payload.giftId || payload.giftType || payload.id || payload.giftName || '').toLowerCase(),
            giftName: String(payload.giftName || payload.giftId || payload.giftType || payload.id || ''),
        };
    }

    private onLiveComment(payload: LivePayload = {}) {
        const d = this.normalizeLivePayload(payload);
        EventManager.emit(EventTypes.RoleEvents.AddViewerRoles, {
            count: 1,
            viewerId: d.viewerId,
            nickName: d.nickName,
            avatarUrl: d.avatarUrl,
            isGiant: false,
            giantLv: 1,
            weaponType: GlobalEnum.WeaponType.Pistol,
            sourceType: 'viewer_join',
            reservePriority: 5,
            bypassActiveCap: true,
        });
        this.showLiveGmTip(`评论加入: ${d.nickName}`);
    }

    private onLiveLike(payload: LivePayload = {}) {
        const d = this.normalizeLivePayload(payload);
        const total = (this.liveLikeCounter[d.viewerId] || 0) + d.count;
        const addCount = Math.floor(total / 10);
        this.liveLikeCounter[d.viewerId] = total % 10;
        if (addCount <= 0) {
            this.showLiveGmTip(`点赞+${d.count}: ${d.nickName}`);
            return;
        }

        EventManager.emit(EventTypes.RoleEvents.AddViewerRoles, {
            count: addCount,
            viewerId: d.viewerId,
            nickName: d.nickName,
            avatarUrl: d.avatarUrl,
            isGiant: false,
            giantLv: 1,
            weaponType: GlobalEnum.WeaponType.Pistol,
            sourceType: 'viewer_join',
            reservePriority: 10,
            bypassActiveCap: false,
        });
        this.showLiveGmTip(`点赞出兵: ${d.nickName}x${addCount}`);
    }

    private onLiveGift(payload: LivePayload = {}) {
        const d = this.normalizeLivePayload(payload);
        const giftCfg = this.getLiveGiftSoldierConfig(d.giftKey || d.giftName);
        const soldierCount = Math.max(1, Math.floor(Number(payload.soldierCount || giftCfg.count * d.count)));

        EventManager.emit(EventTypes.RoleEvents.AddViewerRoles, {
            count: soldierCount,
            viewerId: d.viewerId,
            nickName: d.nickName,
            avatarUrl: d.avatarUrl,
            isGiant: giftCfg.isGiant,
            giantLv: giftCfg.giantLv,
            weaponType: giftCfg.weaponType,
            sourceType: 'viewer_gift',
            reservePriority: 0,
            bypassActiveCap: false,
        });
        setTimeout(() => {
            this.showLiveGmTip(`礼物出兵: ${d.nickName} ${giftCfg.label}x${soldierCount}`);
            this.showLiveGiftBanner(d.nickName, giftCfg.label, soldierCount);
        }, 100);
    }

    private getLiveGiftSoldierConfig(giftKey: string) {
        if (giftKey.indexOf('giant') >= 0 || giftKey.indexOf('巨人') >= 0 || giftKey.indexOf('最高') >= 0) {
            return { label: '巨人兵', count: 10, weaponType: GlobalEnum.WeaponType.Pistol, isGiant: true, giantLv: 3 };
        }
        if (giftKey.indexOf('heavy') >= 0 || giftKey.indexOf('machine') >= 0 || giftKey.indexOf('机关') >= 0 || giftKey.indexOf('高级') >= 0) {
            return { label: '机关枪兵', count: 10, weaponType: GlobalEnum.WeaponType.MachineGun, isGiant: false, giantLv: 1 };
        }
        if (giftKey.indexOf('shotgun') >= 0 || giftKey.indexOf('短枪') >= 0 || giftKey.indexOf('中级') >= 0) {
            return { label: '短枪兵', count: 10, weaponType: GlobalEnum.WeaponType.Shotgun, isGiant: false, giantLv: 1 };
        }
        return { label: '普通兵', count: 10, weaponType: GlobalEnum.WeaponType.Pistol, isGiant: false, giantLv: 1 };
    }

    private showLiveGiftBanner(nickName: string, giftLabel: string, count: number) {
        if (!this.liveGiftBanner || !this.liveGiftTitleLabel || !this.liveGiftDescLabel) return;

        const seq = ++this.liveGiftFeedbackSeq;
        const opacity = this.liveGiftBanner.getComponent(UIOpacity);
        Tween.stopAllByTarget(this.liveGiftBanner);
        if (opacity) {
            Tween.stopAllByTarget(opacity);
            opacity.opacity = 0;
        }

        this.liveGiftTitleLabel.string = `${nickName} 送出 ${giftLabel}`;
        this.liveGiftDescLabel.string = `新增 ${count} 兵 | 场上 ${GlobalTmpData.normalRoleNum} | 备用 ${GlobalTmpData.reserveRoleNum}`;
        this.liveGiftBanner.active = true;
        this.liveGiftBanner.setSiblingIndex(this.liveGiftBanner.parent.children.length - 1);
        this.liveGiftBanner.setPosition(0, 250, 0);
        this.liveGiftBanner.setScale(0.86, 0.86, 1);

        tween(this.liveGiftBanner)
            .to(0.12, { scale: v3(1.04, 1.04, 1) }, { easing: 'backOut' })
            .to(0.08, { scale: v3(1, 1, 1) })
            .delay(1.7)
            .to(0.18, { position: v3(0, 275, 0) })
            .call(() => {
                if (seq == this.liveGiftFeedbackSeq) {
                    this.liveGiftBanner.active = false;
                }
            })
            .start();

        if (opacity) {
            tween(opacity)
                .to(0.1, { opacity: 255 })
                .delay(1.75)
                .to(0.2, { opacity: 0 })
                .start();
        }
    }

    private runGame() {
        if (this._isRun) return;
        this._isRun = true;
        // UISystem.hideUI(UIEnum.HomeUI);
        // EventManager.emit(EventTypes.GameEvents.GameRun);
        // EventManager.emit(EventTypes.GuideEvents.ShowGuideAnim);
        // EventManager.emit(EventTypes.TouchEvents.SetTouchEnable);

        // AudioSystem.playBGM(AudioEnum.lvBgm);
    }


    // #endregion

    // #region -----------------对外方法--------

    // #endregion

    // #region -------------------事件------------

    protected onGameLoadFinish() {
        // this.runGame();

        return;
    }

    protected onTouchStart() {

    }

    /**暂停 */
    protected onGamePause() {
        this._isPause = true;
        GlobalTmpData.Game.isPause = true;
    }
    /**继续 */
    protected onGameResume() {
        this._isPause = false;
        GlobalTmpData.Game.isPause = false;
        this.hidePreviewAdBlocks();
    }
    protected onSetGameTimeScale(n) {
        if (undefined !== n) {
            GlobalTmpData.timeScale = n;
        }
    }

    /**结束 */
    protected onGameOver(isWin?: boolean) {
        if (this._isOver) return;
        GlobalTmpData.Game.isGameOver = true;
        this._isOver = true;

        this.hidePreviewAdBlocks();
        this.stopRecord();
    }

    protected onGameRun() {
        GlobalTmpData.Game.isGameRun = true;
        this.hidePreviewAdBlocks();
        console.log('# Game Run #')
    }

    private hidePreviewAdBlocks() {
        UISystem.hideUI(UIEnum.FakeLevelAdUI);
        UISystem.hideUI(UIEnum.CustomAdUI);
        EventManager.emit(EventTypes.SDKEvents.HideBanner);
        for (let i = 0; i <= 6; i++) {
            EventManager.emit(EventTypes.SDKEvents.HideCustomAd, i);
        }
    }
    // #endregion
}

