import { _decorator, assetManager, Camera, Color, Component, director, Graphics, ImageAsset, Label, Mask, Node, Sprite, SpriteFrame, Texture2D, UITransform, Vec2, v3, clamp, Vec3, clamp01 } from 'cc';
import { GlobalConfig, WeaponCfg } from '../../../Init/Config/GlobalConfig';
import GlobalData from '../../../Init/Config/GlobalData';
import { GlobalEnum } from '../../../Init/Config/GlobalEnum';
import { GlobalTmpData } from '../../../Init/Config/GlobalTmpData';
import { EventTypes } from '../../../Init/Managers/EventTypes';
import { AudioEnum } from '../../../Init/SystemAudio/AudioEnum';
import { AudioSystem } from '../../../Init/SystemAudio/AudioSystem';
import { StorageSystem } from '../../../Init/SystemStorage/StorageSystem';
import { LevelDataTmp } from '../../../Init/SystemStorage/StorageTemp';
import { UIEnum } from '../../../Init/SystemUI/UIEnum';
import { UISystem } from '../../../Init/SystemUI/UISystem';
import GlobalPool from '../../../Init/Tools/GlobalPool';
import { BasicLayer } from '../Common/Basic/BasicLayer';
import { HorizonTouch } from '../Common/Touch/HorizonTouch';
import { Enemy } from './Enemy';
import { EnemyBomb } from './EnemyBomb';
import { EnemyStateType } from './EnemyStates';
import { Role, ViewerRoleData } from './Role';
import { RoleGiant } from './RoleGiant';
import { RoleStateType } from './RoleStates';
const { ccclass, property } = _decorator;

type ViewerProfileData = {
    viewerId: string;
    nickName: string;
    avatarIndex: number;
    avatarUrl?: string;
    job: string;
    weaponType: GlobalEnum.WeaponType;
    totalSoldiers: number;
    activeSoldiers: number;
    reserveSoldiers: number;
    damageDealt: number;
    damageTaken: number;
};

type AddViewerRolesData = {
    count: number;
    viewerId?: string;
    nickName?: string;
    avatarIndex?: number;
    avatarUrl?: string;
    job?: string;
    isGiant?: boolean;
    giantLv?: number;
    weaponType?: GlobalEnum.WeaponType;
    sourceType?: 'viewer_join' | 'viewer_gift' | 'free';
    reservePriority?: number;
    bypassActiveCap?: boolean;
};

@ccclass('RoleLayer')
export class RoleLayer extends BasicLayer {
    lvData: LevelDataTmp = null;

    // #region -------------------------------层级生命周期------------
    /**初始化 只执行一次*/
    protected init() {
        this.initTouch();

    };
    /**注册通过自定义事件管理器管理的事件  */
    protected onEvents() {
        this.on(EventTypes.GameEvents.GameRun, this.onGameRun, this);
        this.on(EventTypes.EnemyEvents.CreateEnemys, this.onCreateEnemys, this);
        this.on(EventTypes.EnemyEvents.CreateGmStageEnemys, this.onCreateGmStageEnemys, this);
        this.on(EventTypes.RoleEvents.SetWeapon, this.onSetWeapon, this);
        this.on(EventTypes.RoleEvents.Death, this.onRoleDeath, this);
        this.on(EventTypes.RoleEvents.AddRoles, this.onAddRoles, this);
        this.on(EventTypes.RoleEvents.AddViewerRoles, this.onAddViewerRoles, this);
        this.on(EventTypes.RoleEvents.ViewerDamageDealt, this.onViewerDamageDealt, this);
        this.on(EventTypes.RoleEvents.ViewerDamageTaken, this.onViewerDamageTaken, this);
        this.on(EventTypes.RoleEvents.LvupGaint, this.onLvupGaint, this);
        this.on(EventTypes.CurLevelEvents.ShowHomeCamera, this.onShowHomeCamera, this);
        this.on(EventTypes.RoleEvents.Resurgence, this.onResurgence, this);
        this.on(EventTypes.RoleEvents.CanceResurgence, this.onCanceResurgence, this);
    };
    /**设置状态、数据等, */
    public setData(d?: LevelDataTmp) {
        this.lvData = d;
        this.setRoles(d);
        this.setEnemys(d);
        this.setRoleCenter(d);
        this.updateCurrentStageLv();
        this.setCameraPos();
        this.setPreCreateData(d);
        this.initLiveRankPanel();
        this.updateLiveRankPanel(true);

    };
    /**重置状态、数据等，子类实现 ,注销事件*/
    public reset() {
        this.resetRoles();
        this.resetReserveRoles();
        this.resetViewerAvatars();
        this.resetLiveRankPanel();
        this.resetEnemys();
        this.resetTouch();
        this.resetRoleCenter();
        this.resetCameraPos();
        this.resetWinEffects();
    }
    //游戏中 update
    public customUpdate(dt: number) {
        this.updateTouch(dt);
        this.updateRoleCenter(dt);
        this.updateRoles(dt);
        this.updateEnemys(dt);
        this.updateCameraPos(dt);
        this.updateViewerAvatars();
        this.updateLiveRankPanel(false, dt);
        this.updateCreateData(dt);
        this.updateAudio(dt);
    }
    public customLateUpdate(dt: number) {
        this.lateUpdateRoles(dt);
        this.lateUpdateEnemys(dt);
    }
    // #endregion

    //#region -----------------------------触摸-----------------------
    protected touchObj: HorizonTouch = null;
    protected pathWidth = GlobalConfig.RoadWidth * 0.5;

    protected initTouch() {
        this.touchObj = new HorizonTouch(v3(), -this.pathWidth, this.pathWidth);
    }
    protected resetTouch() {
        this.touchObj.reset();
    }
    protected updateTouch(dt) {
        if (!GlobalTmpData.Game.isGameRun) return;
        this.touchObj.update(dt);

        //根据最大数量限制可移动半径
        const formation = GlobalTmpData.Player.formation;
        this.touchObj.fitMaxX = this.pathWidth - clamp(formation.maxX, 0, this.pathWidth);
        this.touchObj.fitMinX = -this.pathWidth - clamp(formation.minX, -this.pathWidth, 0);
    }

    //#endregion

    //#region ----------------------------玩家角色中心点移动----------------------
    /**当前角色中心点位置-只会在路径中心*/
    protected followPos = GlobalTmpData.Player.wpos;
    protected pathLineVec = v3();   //当前路段的速度
    protected pathIndex = 0;        //当前角色所在的路段 PathInfo 索引-默认从0开始
    protected pathSubIndex = 0;     //当前角色所在路段中 PathInfo.path 数组的索引

    protected isRotPath = false;
    protected isPathEnd = false;
    protected isEndMark = false;

    protected setRoleCenter(d) {
        //跟随路径移动 
        this.pathIndex = 0;
        this.pathSubIndex = 0;
    }

    protected resetRoleCenter() {
        this.isPathEnd = false;
        this.isEndMark = false;
        this.isRotPath = false;
        this.pathLineVec.set(0, 0, 0);
        this.followPos.set(0, 0, 0);
        GlobalTmpData.Player.wrotY = 0;
        GlobalTmpData.Player.offset = v3();
        GlobalTmpData.Player.lineVec.set(0);
    }

    protected updateRoleCenter(dt) {
        this.calPathLineVec();
        this.updateCurrentStageLv();
        this.checkEndMark();
        this.moveFollowPos(dt);
    }

    tmpP = v3();
    tmpO = v3();
    tmpV = v3();
    tmpC = v3();
    //计算当前所处路段的速度
    protected calPathLineVec() {
        if (this.isPathEnd) return;
        let info = GlobalTmpData.PathInfo[this.pathIndex];
        if (!info || info.path.length == 0) {
            // this.pathLineVec.set(0, 0, 0);
            this.pathFinished();
            this.isPathEnd = true;
            return;
        };

        let prePos = info.path[this.pathSubIndex];
        let nexSubId = clamp(0, this.pathSubIndex + 1, info.path.length - 1);
        let nextPos = info.path[nexSubId];
        let maxLen = this.tmpP.set(prePos).subtract(nextPos).lengthSqr();

        this.tmpP.set(this.followPos).subtract(prePos);
        let curLen = this.tmpP.lengthSqr();
        if (curLen >= maxLen) {
            //切换路线索引
            this.pathSubIndex++;
            // console.log('# subIndex: ', this.pathSubIndex, ' pathLineVec: ', this.pathLineVec);
            if (this.pathSubIndex >= info.path.length - 1) {
                //切换路段
                this.pathIndex++;
                this.pathSubIndex = 0;
                info = GlobalTmpData.PathInfo[this.pathIndex];
                console.log('# path : ', this.pathIndex);
            }

            if (!info || info.path.length == 0) {
                // this.pathLineVec.set(0, 0, 0);
                this.pathFinished();
                this.isPathEnd = true;
                console.log('Path End');
                return;
            };

            prePos = info.path[this.pathSubIndex];
            nexSubId = clamp(0, this.pathSubIndex + 1, info.path.length - 1);
            nextPos = info.path[nexSubId];
        }

        //转折路段-速度恒定的圆周运动
        if (Math.abs(prePos.x - nextPos.x) > 0.01 && Math.abs(prePos.z - nextPos.z) > 0.01) {
            //--弧形速度
            //圆心位置判断
            let prePreIndex = clamp(this.pathSubIndex - 1, 0, info.path.length - 1);
            let prePrePos = info.path[prePreIndex];
            let rotRadian = 1.5705;
            //若上一个路径点与当前点成垂直线 
            if (prePrePos.x == prePos.x) {
                //圆心在垂线两侧
                this.tmpC.set(nextPos.x, 0, prePos.z);
                rotRadian *= prePos.x < nextPos.x ? -1 : 1;
            } else {
                //圆心在垂线上
                this.tmpC.set(prePos.x, 0, nextPos.z);
                rotRadian *= prePos.x > nextPos.x ? -1 : 1;
            }

            //计算切线方向
            this.tmpV.set(this.tmpC).subtract(this.followPos).normalize();

            Vec3.rotateY(this.tmpV, this.tmpV, Vec3.ZERO, rotRadian);
            //
            this.pathLineVec.set(this.tmpV).multiplyScalar(GlobalConfig.Player.moveSpd);

            this.isRotPath = true;
        } else {
            this.isRotPath = false;
            //--线性速度
            this.pathLineVec.set(nextPos).subtract(prePos).normalize().
                multiplyScalar(GlobalConfig.Player.moveSpd);
        }
        //记录
        GlobalTmpData.Player.lineVec.set(this.pathLineVec);
    }

    //检测终点
    protected checkEndMark() {
        if (this.isEndMark) return;
        const pathInfo = GlobalTmpData.PathInfo;
        const playerInfo = GlobalTmpData.Player;

        if (this.pathIndex >= pathInfo.length - 1 &&
            playerInfo.endMarkPos.z <= playerInfo.formation.maxZ + playerInfo.wpos.z) {

            this.isEndMark = true;
            let data = { num: Object.keys(this.allRoles).length, outPaths: [], outFormation: [] };

            this.emit(EventTypes.CurLevelEvents.GetEndPathInfo, data);

            //切换角色状态
            let n = 0;
            for (const key in this.allRoles) {
                const role = this.allRoles[key];
                if (role && role.node.active && role.hp > 0) {
                    let endPath = [];
                    endPath.push(v3(role.curPos));
                    data.outPaths.forEach(p => {
                        endPath.push(v3(p));
                    })
                    endPath.push(v3(data.outFormation[n]));
                    role.changeState(RoleStateType.Pass, { endPath: endPath, endRecIndex: n });
                    GlobalTmpData.endFormationRec[n] = { p: data.outFormation[n], role: role };
                    n++;
                }
            }

        }
    }

    protected pathFinished() {
        if (this.isPathEnd) return;
    }

    //移动中心点
    protected moveFollowPos(dt) {
        if (this.isPathEnd) return;

        dt *= GlobalTmpData.Game.isGameRun ? 1 : 0;
        this.tmpP.set(this.pathLineVec).multiplyScalar(dt);

        this.followPos.add(this.tmpP);
        if (!this.isPathEnd) {
            //计算当前速度下的旋转角度-弧度
            GlobalTmpData.Player.wrotY = Math.atan2(-this.pathLineVec.z, this.pathLineVec.x);
            //计算当前速度方向下 与速度垂直方向的偏移
            Vec3.rotateY(this.tmpV, this.pathLineVec, Vec3.ZERO, 1.5703); //默认视为x轴正方向
            this.tmpV.normalize().multiplyScalar(this.touchObj.ctrlPos.x);
            GlobalTmpData.Player.offset.set(this.tmpV);
        }
    }
    //#endregion

    //#region ----------------------------镜头------------------------------
    cameraPos = v3(0, 0, 0);
    homeCameraPos = v3(0, 0, 12);
    cameraRot = v3(-45, 0, 0);
    initCameraRot = v3(-45, 0, 0);
    homeCameraRot = v3(-30, 0, 0);

    cameraOffset = v3(0, 18, 18);       //初始偏移
    homeCameraOffset = v3(0, 10, 10);     //主页偏移

    curCameraOffset = v3();
    cameraAddOffset = v3();
    cameraTurnOffset = v3();
    cameraEndOffset = v3();
    tmpR = v3();
    curRot = v3();
    isCloseCamera = false; //拉近镜头

    setCameraPos() {
        this.isCloseCamera = false;
        if (GlobalConfig.ShowDebugCamera) {
            this.cameraPos.x = this.followPos.x;
            this.cameraPos.z = this.followPos.z;
            this.cameraPos.y = GlobalConfig.DebugCameraHeight;
        } else {
            this.cameraPos.set(this.followPos);
            this.cameraRot.set(this.initCameraRot);
        }

        this.curCameraOffset.set(this.cameraOffset);
        this.curRot.set(0, 0, 0);
        this.cameraAddOffset.set(0, 0, 0);
        this.cameraTurnOffset.set(this.cameraOffset).normalize().multiplyScalar(15); //转弯时额外偏移
        this.cameraEndOffset.set(this.cameraOffset).normalize().multiplyScalar(10);  //结束时额外偏移

        this.emit(EventTypes.CameraEvents.SetFollowPos, this.cameraPos);
        this.emit(EventTypes.CameraEvents.SetCameraSelfOffset, this.curCameraOffset);
    }

    resetCameraPos() {
    }

    updateCameraPos(dt) {
        if (GlobalConfig.ShowDebugCamera) {
            //调试视角
            this.cameraPos.x = this.followPos.x;
            this.cameraPos.z = this.followPos.z;
            return;
        };

        this.tmpP.set(this.followPos);
        if (this.isCloseCamera) {
            this.tmpP.z += this.homeCameraPos.z;
        }

        this.cameraPos.set(this.tmpP);

        if (!this.isPathEnd) {
            //计算方向-相机默认朝向-90度
            let rotY = GlobalTmpData.Player.wrotY + 1.5703;
            this.curRot.y += (rotY - this.curRot.y) * 0.2 * dt * 60;
            this.cameraRot.y = this.curRot.y * 57.3;

            //X轴旋转
            let toRotX = this.isCloseCamera ? this.homeCameraRot.x : this.initCameraRot.x;

            this.curRot.x += (toRotX - this.curRot.x) * 0.15 * dt * 60;
            this.cameraRot.x = this.curRot.x;

            this.emit(EventTypes.CameraEvents.SetCameraSelfRot, this.cameraRot);

            //计算相对初始偏移旋转后的偏移
            this.tmpP.set(0, 0, 0);
            if (this.isRotPath) {
                this.tmpP.set(this.cameraTurnOffset);
            }
            this.cameraAddOffset.lerp(this.tmpP, 0.03 * dt * 60);
            //默认偏移+额外偏移
            this.tmpP.set(this.isCloseCamera ? this.homeCameraOffset : this.cameraOffset)
            this.tmpP.add(this.cameraAddOffset);

            Vec3.rotateY(this.tmpP, this.tmpP, Vec3.ZERO, this.curRot.y);

            if (GlobalTmpData.Game.isGameRun) {
                this.curCameraOffset.set(this.tmpP);
            } else {
                this.curCameraOffset.lerp(this.tmpP, 0.1 * dt * 60);
            }
            this.emit(EventTypes.CameraEvents.SetCameraSelfOffset, this.curCameraOffset);
        } else if (GlobalTmpData.Game.isGameRun) {
            //镜头拉高
            this.cameraAddOffset.lerp(this.cameraEndOffset, 0.03 * dt * 60);
            this.tmpP.set(this.cameraOffset).add(this.cameraAddOffset);

            this.curCameraOffset.lerp(this.tmpP, 0.1 * dt * 60);
            this.emit(EventTypes.CameraEvents.SetCameraSelfOffset, this.curCameraOffset);
        }
    }

    //#endregion

    //#region -----------------------------玩家角色-----------------------
    allRoles: { [uuid: string]: Role } = {};
    roleSumCount = 0;   //总数
    normalRoleNum = 0;  //小兵
    curWeapon: GlobalEnum.WeaponType = GlobalEnum.WeaponType.Pistol;      //当前武器
    reserveRoleQueue: ViewerRoleData[] = [];
    pendingReserveRelease = 0;
    viewerRoleSeed = 0;
    viewerProfileSeed = 0;
    viewerProfiles: { [viewerId: string]: ViewerProfileData } = {};
    viewerAvatarLayer: Node = null;
    viewerAvatarCamera: Camera = null;
    viewerAvatarRecs: { [uuid: string]: { node: Node, role: Role } } = {};
    viewerAvatarFrameCache: { [url: string]: SpriteFrame } = {};
    viewerAvatarFrameLoading: { [url: string]: ((frame: SpriteFrame) => void)[] } = {};
    liveRankPanel: Node = null;
    liveDamageRankLabels: Label[] = [];
    liveTakenRankLabels: Label[] = [];
    liveRankRefreshT = 0;
    viewerAvatarColors = [
        new Color(80, 220, 180, 230),
        new Color(90, 170, 255, 230),
        new Color(255, 200, 70, 230),
        new Color(230, 110, 255, 230),
        new Color(255, 120, 120, 230),
    ];
    viewerJobs = ['Assault', 'Guard', 'Scout', 'Heavy', 'Medic'];
    viewerWeapons = [
        GlobalEnum.WeaponType.Pistol,
        GlobalEnum.WeaponType.Shotgun,
        GlobalEnum.WeaponType.FireGun,
        GlobalEnum.WeaponType.MachineGun,
        GlobalEnum.WeaponType.Grenades,
    ];
    private readonly maxActiveRoleCount = 50;
    //最终阵型完成
    isRoleAllStand = false;

    setRoles(d?) {
        this.roleSumCount = 0;
        this.normalRoleNum = 0;
        //创建初始数量
        let asset = StorageSystem.getData().userAssets;
        this.curWeapon = asset.chooseWeapon;
        //满级巨人
        let giantLv = asset.props.GiantLv - 1;
        let maxLvGiantNum = Math.floor(giantLv / 3);
        //未满级的巨人的等级
        let lastGiantLv = giantLv % 3;
        let hasUnMaxLvGiant = lastGiantLv != 0;

        //小兵数量
        let roleNum = asset.props.RoleNumLv;
        //小兵
        this.createRoles(roleNum);
        //满级巨人
        this.createRoles(maxLvGiantNum, true, 3);
        //未满级巨人
        if (hasUnMaxLvGiant) {
            this.createRoles(1, true, lastGiantLv);
        }
    }

    resetRoles() {
        for (const key in this.allRoles) {
            const e = this.allRoles[key];
            e.reset();
        }
        this.allRoles = {};
        this.roleSumCount = 0;
        this.normalRoleNum = 0;
        this._isOffsetReady = true;
        this.isRoleAllStand = false;
    }
    private resetReserveRoles() {
        this.reserveRoleQueue = [];
        this.pendingReserveRelease = 0;
        this.viewerProfiles = {};
        GlobalTmpData.reserveRoleNum = 0;
    }

    private getOrCreateViewerProfile(d: AddViewerRolesData, weaponType?: GlobalEnum.WeaponType): ViewerProfileData {
        const viewerId = d && d.viewerId ? d.viewerId : `viewer-${++this.viewerProfileSeed}`;
        let profile = this.viewerProfiles[viewerId];
        if (!profile) {
            const avatarIndex = d && d.avatarIndex ? d.avatarIndex : (this.viewerProfileSeed % 99) + 1;
            profile = {
                viewerId,
                nickName: d && d.nickName ? d.nickName : `V${avatarIndex}`,
                avatarIndex,
                avatarUrl: d && d.avatarUrl ? d.avatarUrl : '',
                job: d && d.job ? d.job : this.viewerJobs[Math.floor(Math.random() * this.viewerJobs.length)],
                weaponType: weaponType ?? this.viewerWeapons[Math.floor(Math.random() * this.viewerWeapons.length)],
                totalSoldiers: 0,
                activeSoldiers: 0,
                reserveSoldiers: 0,
                damageDealt: 0,
                damageTaken: 0,
            };
            this.viewerProfiles[viewerId] = profile;
        } else if (weaponType !== undefined) {
            profile.weaponType = weaponType;
        }
        if (d && d.avatarUrl) {
            profile.avatarUrl = d.avatarUrl;
        }
        return profile;
    }

    private createViewerRoleData(profile: ViewerProfileData, isGiant = false, giantLv = 1, d?: AddViewerRolesData): ViewerRoleData {
        this.viewerRoleSeed++;
        const soldierIndex = ++profile.totalSoldiers;
        const sourceType = d && d.sourceType ? d.sourceType : 'viewer_join';
        return {
            viewerId: profile.viewerId,
            soldierId: `${profile.viewerId}-soldier-${soldierIndex}`,
            soldierIndex,
            nickName: profile.nickName,
            avatarIndex: profile.avatarIndex,
            avatarUrl: profile.avatarUrl,
            job: profile.job,
            weaponType: profile.weaponType,
            isGiant,
            giantLv,
            isViewer: true,
            sourceType,
            reservePriority: d && d.reservePriority !== undefined ? d.reservePriority : (sourceType == 'viewer_gift' ? 0 : 5),
            bypassActiveCap: !!(d && d.bypassActiveCap),
        };
    }

    private createReserveRoleData(isGiant = false, giantLv = 1): ViewerRoleData {
        this.viewerRoleSeed++;
        const avatarIndex = (this.viewerRoleSeed % 99) + 1;
        return {
            viewerId: `reserve-${Date.now()}-${this.viewerRoleSeed}`,
            nickName: `R${avatarIndex}`,
            avatarIndex,
            job: 'Reserve',
            weaponType: this.curWeapon,
            isGiant,
            giantLv,
            isViewer: false,
            sourceType: 'free',
            reservePriority: 20,
            bypassActiveCap: false,
        };
    }

    private getReservePriority(d: ViewerRoleData) {
        return d && d.reservePriority !== undefined ? d.reservePriority : 10;
    }

    private pushReserveRole(d: ViewerRoleData) {
        const priority = this.getReservePriority(d);
        const insertIndex = this.reserveRoleQueue.findIndex((item) => this.getReservePriority(item) > priority);
        if (insertIndex < 0) {
            this.reserveRoleQueue.push(d);
        } else {
            this.reserveRoleQueue.splice(insertIndex, 0, d);
        }
        this.updateViewerSoldierCounts(d, 0, 1);
        GlobalTmpData.reserveRoleNum = this.reserveRoleQueue.length;
    }

    private updateViewerSoldierCounts(d: ViewerRoleData, activeDelta: number, reserveDelta: number) {
        if (!d || !d.isViewer || !d.viewerId) return;
        const profile = this.viewerProfiles[d.viewerId];
        if (!profile) return;
        profile.activeSoldiers = Math.max(0, profile.activeSoldiers + activeDelta);
        profile.reserveSoldiers = Math.max(0, profile.reserveSoldiers + reserveDelta);
    }

    //创建角色
    private getMaxActiveRoleCount() {
        return Math.min(this.maxActiveRoleCount, GlobalConfig.Formation.length);
    }

    createRoles(n: number, isGiant = false, GaintLv = 1, viewerDatas: ViewerRoleData[] = null) {
        let maxLen = this.getMaxActiveRoleCount();
        const formationMaxLen = GlobalConfig.Formation.length;
        let offset = v3();
        let initPos = v3(this.followPos).add(GlobalTmpData.Player.offset);
        let name = isGiant ? 'playerGiant' : 'player';
        for (let i = 0; i < n; i++) {
            const viewerData = viewerDatas && viewerDatas[i] ? viewerDatas[i] : null;
            const canBypassActiveCap = !!(viewerData && viewerData.bypassActiveCap);
            if (this.roleSumCount >= formationMaxLen || (!canBypassActiveCap && this.roleSumCount >= maxLen)) {
                this.pushReserveRole(viewerData || this.createReserveRoleData(isGiant, GaintLv));
                console.warn('玩家已达最大数量，进入备用池:', maxLen, this.reserveRoleQueue.length);
                continue;
            }
            let e = GlobalPool.get(name);
            e.setPosition(Vec3.ZERO);
            e.parent = this.node;
            //获取阵型位置
            const p = GlobalConfig.Formation[this.roleSumCount];
            offset.set(p.x * GlobalConfig.Scale2DTo3D, 0, - p.y * GlobalConfig.Scale2DTo3D).multiplyScalar(GlobalConfig.FormationScale);

            let role = isGiant ? new RoleGiant() : new Role();
            role.init(e, initPos, offset, this.pathLineVec, isGiant);
            role.setWeapon(this.curWeapon);
            if (isGiant) {
                role.setGiantLv(GaintLv);
            }
            if (viewerData) {
                role.setViewerData(viewerData);
                this.updateViewerSoldierCounts(viewerData, 1, 0);
                if (viewerData.isGiant) {
                    role.setGiantLv(viewerData.giantLv);
                }
                this.createViewerAvatar(role);
            }
            this.allRoles[e.uuid] = role;

            this.roleSumCount++;
            if (!isGiant) {
                this.normalRoleNum++;
            }
        }
        GlobalTmpData.normalRoleNum = this.roleSumCount;
        GlobalTmpData.reserveRoleNum = this.reserveRoleQueue.length;
    }

    private ensureViewerAvatarLayer() {
        if (this.viewerAvatarLayer && this.viewerAvatarLayer.isValid) return true;
        const scene = director.getScene();
        const canvas = scene && scene.getChildByName('Canvas');
        const parent = canvas && (canvas.getChildByName('UILayer') || canvas);
        if (!parent) return false;

        const layer = new Node('ViewerAvatarLayer');
        layer.parent = parent;
        layer.layer = parent.layer;
        layer.setSiblingIndex(0);
        const trans = layer.addComponent(UITransform);
        trans.setContentSize(720, 1280);
        this.viewerAvatarLayer = layer;
        this.viewerAvatarCamera = GlobalData.get(GlobalEnum.GlobalDataType.Camera3D);
        return true;
    }

    private createViewerAvatar(role: Role) {
        if (!role || !role.viewerData || !role.viewerData.isViewer) return;
        if (!this.ensureViewerAvatarLayer()) return;

        const node = new Node(`Avatar_${role.viewerData.nickName}`);
        node.parent = this.viewerAvatarLayer;
        node.layer = this.viewerAvatarLayer.layer;
        const avatarSize = role.viewerData.isGiant ? 22 : 18;
        const fallbackSize = avatarSize + 3;
        const trans = node.addComponent(UITransform);
        trans.setContentSize(fallbackSize, fallbackSize);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = this.viewerAvatarColors[role.viewerData.avatarIndex % this.viewerAvatarColors.length];
        graphics.circle(0, 0, fallbackSize * 0.5);
        graphics.fill();

        const labelNode = new Node('Label');
        labelNode.parent = node;
        labelNode.layer = node.layer;
        labelNode.setPosition(0, 0, 0);
        const labelTrans = labelNode.addComponent(UITransform);
        labelTrans.setContentSize(fallbackSize, fallbackSize);
        const label = labelNode.addComponent(Label);
        label.fontSize = role.viewerData.isGiant ? 13 : 10;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = false;
        label.string = role.viewerData.isGiant ? 'G' : role.viewerData.job.charAt(0);

        this.applyViewerAvatarImage(node, labelNode, role.viewerData.avatarUrl, avatarSize);
        this.viewerAvatarRecs[role.node.uuid] = { node, role };
    }

    private applyViewerAvatarImage(node: Node, labelNode: Node, avatarUrl: string, avatarSize: number) {
        const url = this.normalizeAvatarUrl(avatarUrl);
        if (!url) return;

        const clipNode = new Node('AvatarClip');
        clipNode.parent = node;
        clipNode.layer = node.layer;
        clipNode.setPosition(0, 0, 0);
        const clipTrans = clipNode.addComponent(UITransform);
        clipTrans.setContentSize(avatarSize, avatarSize);
        const mask = clipNode.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_ELLIPSE;
        mask.segments = 24;

        const imageNode = new Node('AvatarImage');
        imageNode.parent = clipNode;
        imageNode.layer = clipNode.layer;
        imageNode.setPosition(0, 0, 0);
        const imageTrans = imageNode.addComponent(UITransform);
        imageTrans.setContentSize(avatarSize, avatarSize);
        const sprite = imageNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        this.loadViewerAvatarFrame(url, (frame) => {
            if (!frame || !node.isValid || !clipNode.isValid || !imageNode.isValid || !sprite.isValid) return;
            sprite.spriteFrame = frame;
            if (labelNode && labelNode.isValid) {
                labelNode.active = false;
            }
        });
    }

    private normalizeAvatarUrl(url?: string) {
        const value = String(url || '').trim();
        if (!value) return '';
        return value.replace(/^http:\/\//, 'https://');
    }

    private loadViewerAvatarFrame(url: string, cb: (frame: SpriteFrame) => void) {
        const cached = this.viewerAvatarFrameCache[url];
        if (cached) {
            cb(cached);
            return;
        }
        if (this.viewerAvatarFrameLoading[url]) {
            this.viewerAvatarFrameLoading[url].push(cb);
            return;
        }
        this.viewerAvatarFrameLoading[url] = [cb];
        assetManager.loadRemote<ImageAsset>(url, { ext: this.getAvatarImageExt(url) }, (err, imageAsset) => {
            let frame: SpriteFrame = null;
            if (err || !imageAsset) {
                console.warn('Viewer avatar load failed:', url, err);
            } else {
                const texture = new Texture2D();
                texture.image = imageAsset;
                frame = new SpriteFrame();
                frame.texture = texture;
                this.viewerAvatarFrameCache[url] = frame;
            }
            const callbacks = this.viewerAvatarFrameLoading[url] || [];
            delete this.viewerAvatarFrameLoading[url];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](frame);
            }
        });
    }

    private getAvatarImageExt(url: string) {
        const clean = url.split('?')[0].toLowerCase();
        if (clean.indexOf('.png') >= 0) return '.png';
        if (clean.indexOf('.webp') >= 0) return '.webp';
        return '.jpg';
    }

    private removeViewerAvatar(uuid: string) {
        const rec = this.viewerAvatarRecs[uuid];
        if (rec && rec.node && rec.node.isValid) {
            rec.node.destroy();
        }
        delete this.viewerAvatarRecs[uuid];
    }

    private resetViewerAvatars() {
        for (const key in this.viewerAvatarRecs) {
            this.removeViewerAvatar(key);
        }
        this.viewerAvatarRecs = {};
        if (this.viewerAvatarLayer && this.viewerAvatarLayer.isValid) {
            this.viewerAvatarLayer.destroy();
        }
        this.viewerAvatarLayer = null;
        this.viewerAvatarCamera = null;
    }

    private avatarWorldPos = v3();
    private avatarUiPos = v3();
    private updateViewerAvatars() {
        if (!this.viewerAvatarLayer || !this.viewerAvatarCamera) return;
        for (const key in this.viewerAvatarRecs) {
            const rec = this.viewerAvatarRecs[key];
            if (!rec || !rec.role || !rec.role.node || !rec.role.node.active || rec.role._curState == RoleStateType.Death) {
                this.removeViewerAvatar(key);
                continue;
            }
            this.avatarWorldPos.set(rec.role.curPos);
            this.avatarWorldPos.y += rec.role.isGiant ? 2.4 : 1.45;
            this.viewerAvatarCamera.convertToUINode(this.avatarWorldPos, this.viewerAvatarLayer, this.avatarUiPos);
            rec.node.setPosition(this.avatarUiPos);
        }
    }

    private initLiveRankPanel() {
        if (this.liveRankPanel && this.liveRankPanel.isValid) return;
        const scene = director.getScene();
        const canvas = scene && scene.getChildByName('Canvas');
        const parent = canvas && (canvas.getChildByName('UILayer') || canvas);
        if (!parent) return;

        const panel = new Node('LiveBattleRankPanel');
        panel.parent = parent;
        panel.layer = parent.layer;
        panel.setPosition(205, 268, 0);
        panel.setSiblingIndex(parent.children.length - 1);

        const trans = panel.addComponent(UITransform);
        trans.setContentSize(260, 178);
        const bg = panel.addComponent(Graphics);
        bg.fillColor = new Color(18, 24, 32, 170);
        bg.strokeColor = new Color(125, 235, 255, 180);
        bg.lineWidth = 1;
        bg.roundRect(-130, -89, 260, 178, 6);
        bg.fill();
        bg.stroke();
        bg.moveTo(0, 54);
        bg.lineTo(0, -72);
        bg.stroke();

        this.createLiveRankLabel(panel, '伤害榜', v3(-65, 62, 0), 16, new Color(255, 228, 85, 255), 112, 24);
        this.createLiveRankLabel(panel, '承伤榜', v3(65, 62, 0), 16, new Color(125, 235, 255, 255), 112, 24);
        this.liveDamageRankLabels = [];
        this.liveTakenRankLabels = [];
        for (let i = 0; i < 3; i++) {
            this.liveDamageRankLabels.push(this.createLiveRankLabel(panel, '', v3(-65, 30 - i * 34, 0), 13, Color.WHITE, 112, 28));
            this.liveTakenRankLabels.push(this.createLiveRankLabel(panel, '', v3(65, 30 - i * 34, 0), 13, Color.WHITE, 112, 28));
        }

        this.liveRankPanel = panel;
    }

    private createLiveRankLabel(parent: Node, text: string, pos: Vec3, fontSize: number, color: Color, width: number, height: number) {
        const node = new Node('RankLabel');
        node.parent = parent;
        node.layer = parent.layer;
        node.setPosition(pos);
        const trans = node.addComponent(UITransform);
        trans.setContentSize(width, height);
        const label = node.addComponent(Label);
        label.fontSize = fontSize;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        label.enableWrapText = false;
        label.string = text;
        return label;
    }

    private resetLiveRankPanel() {
        if (this.liveRankPanel && this.liveRankPanel.isValid) {
            this.liveRankPanel.destroy();
        }
        this.liveRankPanel = null;
        this.liveDamageRankLabels = [];
        this.liveTakenRankLabels = [];
        this.liveRankRefreshT = 0;
    }

    private updateLiveRankPanel(force = false, dt = 0) {
        if (!this.liveRankPanel || !this.liveRankPanel.isValid) {
            this.initLiveRankPanel();
        }
        if (!this.liveRankPanel) return;
        this.liveRankRefreshT += dt;
        if (!force && this.liveRankRefreshT < 0.25) return;
        this.liveRankRefreshT = 0;
        this.liveRankPanel.setSiblingIndex(this.liveRankPanel.parent.children.length - 1);

        const profiles = Object.keys(this.viewerProfiles).map((key) => this.viewerProfiles[key]);
        const damageRank = profiles.filter((item) => item.damageDealt > 0).sort((a, b) => b.damageDealt - a.damageDealt).slice(0, 3);
        const takenRank = profiles.filter((item) => item.damageTaken > 0).sort((a, b) => b.damageTaken - a.damageTaken).slice(0, 3);
        this.setLiveRankTexts(this.liveDamageRankLabels, damageRank, 'damageDealt');
        this.setLiveRankTexts(this.liveTakenRankLabels, takenRank, 'damageTaken');
    }

    private setLiveRankTexts(labels: Label[], rank: ViewerProfileData[], key: 'damageDealt' | 'damageTaken') {
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            if (!label) continue;
            const item = rank[i];
            label.string = item ? `${i + 1}.${item.nickName} ${Math.floor(item[key])}` : (i == 0 ? '暂无数据' : '');
        }
    }

    private addViewerBattleValue(d: ViewerRoleData, key: 'damageDealt' | 'damageTaken', value: number) {
        if (!d || !d.isViewer || !d.viewerId || value <= 0) return;
        const profile = this.viewerProfiles[d.viewerId];
        if (!profile) return;
        profile[key] += value;
    }

    private releaseReserveRoles(count: number) {
        let releaseCount = 0;
        while (count > 0 && this.reserveRoleQueue.length > 0 && this.roleSumCount < this.getMaxActiveRoleCount()) {
            const d = this.reserveRoleQueue.shift();
            this.updateViewerSoldierCounts(d, 0, -1);
            this.createRoles(1, d.isGiant, d.giantLv, [d]);
            releaseCount++;
            count--;
        }
        GlobalTmpData.reserveRoleNum = this.reserveRoleQueue.length;
        return releaseCount;
    }

    private createViewerRoles(d: AddViewerRolesData) {
        const count = Math.max(1, d && d.count ? d.count : 1);
        const isGiant = !!(d && d.isGiant);
        const giantLv = d && d.giantLv ? d.giantLv : 1;
        const profile = this.getOrCreateViewerProfile(d, d && d.weaponType);
        const roles: ViewerRoleData[] = [];
        for (let i = 0; i < count; i++) {
            roles.push(this.createViewerRoleData(profile, isGiant, giantLv, d));
        }
        this.createRoles(count, isGiant, giantLv, roles);
        if (roles.length > 0) {
            const sample = roles[0];
            console.log(`viewer join ${profile.viewerId} x${count}`, sample.nickName, sample.job, GlobalEnum.WeaponType[sample.weaponType], `active=${profile.activeSoldiers}`, `reserve=${profile.reserveSoldiers}`);
        }
    }
    //减少普通角色
    reduceNormalRoles(n: number) {
        let sum = 0;
        for (const key in this.allRoles) {
            if (sum >= n) break;
            const e = this.allRoles[key];
            if (e && e.node && e.node.active &&
                e._curState != RoleStateType.Death &&
                !e.isGiant) {
                e.byHit(e.hp);
                sum++;
            }
        }
    }


    _offsetCd = 1;
    _curOffsetTime = 0;
    _isOffsetReady = false;
    //更新偏移切换时间
    updateOffset(dt) {
        if (!this._isOffsetReady) {
            this._curOffsetTime += dt;
            if (this._curOffsetTime >= this._offsetCd) {
                this._curOffsetTime = 0;
                this._isOffsetReady = true;
            }
        }
    }

    updateRoles(dt) {
        this.isRoleAllStand = this.isEndMark;
        this.updateOffset(dt);
        let isOffsetReady = false;
        if (this._isOffsetReady) {
            this._isOffsetReady = false;
            isOffsetReady = true;
        }
        const offsetArr = GlobalConfig.Formation;

        let i = 0;
        const formation = GlobalTmpData.Player.formation;
        formation.minX = 9999;
        formation.minZ = 9999;
        formation.maxX = -9999;
        formation.maxZ = -9999;

        for (const key in this.allRoles) {
            const e = this.allRoles[key];
            if (e.node && e.node.active && e._curState != RoleStateType.Death) {
                //判断最后阵型是否完成
                if (e._curState != RoleStateType.StandShoot) {
                    this.isRoleAllStand = false;
                }

                //切换偏移
                if (isOffsetReady && e._curState != RoleStateType.Pass) {
                    const p = offsetArr[i];
                    this.tmpP.set(p.x, p.y, p.z);
                    this.tmpP.set(p.x * GlobalConfig.Scale2DTo3D, 0, - p.y * GlobalConfig.Scale2DTo3D);
                    this.tmpP.multiplyScalar(GlobalConfig.FormationScale);
                    e.setOffset(this.tmpP);
                }
                //计算当前阵型下的长宽
                this.tmpP.set(e.offset);
                formation.maxX = Math.max(this.tmpP.x, formation.maxX);
                formation.minX = Math.min(this.tmpP.x, formation.minX);
                formation.maxZ = Math.max(this.tmpP.z, formation.maxZ);
                formation.minZ = Math.min(this.tmpP.z, formation.minZ);
                //更新
                e.update(dt);
                i++;
            } else {
                this.removeViewerAvatar(key);
                GlobalPool.put(e.node);
                e.reset();
                delete this.allRoles[key];
            }
        }

        if (this.pendingReserveRelease > 0) {
            const released = this.releaseReserveRoles(this.pendingReserveRelease);
            this.pendingReserveRelease = Math.max(0, this.pendingReserveRelease - released);
            if (this.reserveRoleQueue.length <= 0 || this.roleSumCount >= this.getMaxActiveRoleCount()) {
                this.pendingReserveRelease = 0;
            }
        }

        //同步数量
        GlobalTmpData.normalRoleNum = this.roleSumCount;
        GlobalTmpData.reserveRoleNum = this.reserveRoleQueue.length;
        GlobalTmpData.Player.isPathEnd = this.isPathEnd;
    }
    lateUpdateRoles(dt) {
        for (const key in this.allRoles) {
            const e = this.allRoles[key];
            if (e.node && e.node.active) {
                e.lateUpdate(dt);
            } else {
                this.removeViewerAvatar(key);
                e.reset();
                delete this.allRoles[key];
            }
        }
    }

    //#endregion

    //#region -----------------------------敌人角色-----------------------
    allEnemys: { [uuid: string]: Enemy } = {};
    delayCreateRecs: { centerPath: Vec3[], type: GlobalEnum.EnemyType, num: number, followOnSpawn?: boolean, sourceLv?: number }[] = [];
    isEnemyAllDeath = false;
    endlessEndEnemyTimer = 0;
    endlessEndEnemyCd = 1.2;
    endlessEndEnemyBatch = 40;
    endlessEndEnemyMaxAlive = 260;
    endlessEndEnemyEnabled = true;

    setEnemys(d) {
        this.isEnemyAllDeath = false;
        this.hasDelayCreate = false;
        this.endlessEndEnemyTimer = this.endlessEndEnemyCd;
    }

    resetEnemys() {
        for (const key in this.allEnemys) {
            const e = this.allEnemys[key];
            e.reset();
        }
        this.allEnemys = {};
        this.delayCreateRecs = [];
        this.endlessEndEnemyTimer = 0;
    }

    tmpPrePre = v3();
    tmpPre = v3();
    tmpNex = v3();
    lerp0 = v3();
    lerp1 = v3();
    lerp2 = v3();

    //当前生成点的中心路径
    getEnemyCenterPath(initPathIndex: number, initPath: Vec3[], out: Vec3[]) {
        let centerPath = [];
        for (let i = 0; i < initPath.length; i++) {
            const p = initPath[i];
            centerPath.push(v3(p));
        }

        const pathInfo = GlobalTmpData.PathInfo;
        for (let i = initPathIndex + 1; i < pathInfo.length; i++) {
            const info = pathInfo[i];
            for (let n = 1; n < info.path.length; n++) {
                const p = info.path[n];
                centerPath.push(v3(p));
            }
        }
        //
        const _cw = 5;
        const count = 20;
        this.tmpV.set(centerPath[1]).subtract(centerPath[0]).normalize().multiplyScalar(_cw);

        for (let i = 0; i < centerPath.length; i++) {
            this.tmpPre.set(centerPath[i]);
            Vec3.round(this.tmpPre, this.tmpPre);

            if (i > 1 && i < centerPath.length - 1) {
                this.tmpNex.set(centerPath[i + 1]);
                Vec3.round(this.tmpNex, this.tmpNex);
                //判断转折点
                if (this.tmpPre.x != this.tmpNex.x &&
                    this.tmpPre.z != this.tmpNex.z) {
                    //计算贝塞尔参考点
                    this.tmpPrePre.set(centerPath[i - 1]);
                    this.tmpV.set(this.tmpPre).subtract(this.tmpPrePre).normalize().multiplyScalar(_cw);
                    this.tmpC.set(this.tmpPre).add(this.tmpV);

                    //计算贝塞尔位置
                    this.lerp0.set(this.tmpPre);
                    this.lerp1.set(this.tmpC);
                    this.lerp2.set(this.lerp0);

                    for (let n = 1; n < count; n++) {
                        let r = clamp(n / count, 0.1, 0.99);
                        this.lerp0.lerp(this.tmpC, r);
                        this.lerp1.lerp(this.tmpNex, r);
                        this.lerp2.set(this.lerp0).lerp(this.lerp1, r);
                        out.push(v3(this.lerp2));
                    }
                } else {
                    out.push(v3(this.tmpPre));
                }
            } else {
                out.push(v3(this.tmpPre));
            }
        }
    }

    //根据中心路径获取敌人单独的路径
    getEnemySinglePath(centerPath: Vec3[], offset: Vec3, out: Vec3[]) {
        for (let i = 0; i < centerPath.length; i++) {
            this.tmpPre.set(centerPath[i]);
            this.tmpP.set(this.tmpPre).add(offset);
            out.push(v3(this.tmpP));
        }
    }

    //创建敌人
    createEnemys(d: { type: GlobalEnum.EnemyType, count: number, initPathIndex: number, initPath: Vec3[], sourceLv?: number }) {

        let centerPath = [];
        this.getEnemyCenterPath(d.initPathIndex, d.initPath, centerPath);

        this.delayCreateRecs.push({ centerPath: centerPath, type: d.type, num: d.count, sourceLv: d.sourceLv });

    }

    getCurrentEnemySourceLv() {
        const enemyLv = this.lvData && this.lvData.enemyLv;
        if (enemyLv && enemyLv.length > 0) {
            const idx = clamp(this.pathIndex, 0, enemyLv.length - 1);
            if (enemyLv[idx]) return enemyLv[idx];
            for (let i = idx; i >= 0; i--) {
                if (enemyLv[i]) return enemyLv[i];
            }
            for (let i = idx + 1; i < enemyLv.length; i++) {
                if (enemyLv[i]) return enemyLv[i];
            }
        }
        return this.lvData ? this.lvData.lv : undefined;
    }

    updateCurrentStageLv() {
        GlobalTmpData.currentStageLv = this.getCurrentEnemySourceLv() || GlobalTmpData.currentStageLv || 1;
    }

    updateEndlessEndEnemys(dt: number) {
        if (!this.endlessEndEnemyEnabled || !this.isRoleAllStand) return;
        const aliveNum = Object.keys(this.allEnemys).length;
        if (aliveNum >= this.endlessEndEnemyMaxAlive) return;
        this.endlessEndEnemyTimer += dt;
        if (this.endlessEndEnemyTimer < this.endlessEndEnemyCd) return;
        this.endlessEndEnemyTimer = 0;
        this.createEndlessEndEnemyBatch();
    }

    createEndlessEndEnemyBatch() {
        const forward = v3(GlobalTmpData.Player.lineVec);
        if (forward.lengthSqr() < 0.01) {
            forward.set(0, 0, 1);
        } else {
            forward.normalize();
        }

        const spawn = v3(this.followPos).subtract(forward.clone().multiplyScalar(18));
        const target = v3(this.followPos).add(forward.clone().multiplyScalar(4));
        spawn.y = 0;
        target.y = 0;
        this.delayCreateRecs.push({
            centerPath: [spawn, target],
            type: GlobalEnum.EnemyType.Normal,
            num: this.endlessEndEnemyBatch,
            sourceLv: this.getCurrentEnemySourceLv(),
        });
        this.hasDelayCreate = true;
        console.log('Endless end enemies:', this.endlessEndEnemyBatch);
    }

    getGmStageEnemyData() {
        const enemy = this.lvData && this.lvData.enemy;
        if (!enemy || enemy.length <= 0) return null;
        const enemyLv = this.lvData && this.lvData.enemyLv;

        const idx = clamp(this.pathIndex, 0, enemy.length - 1);
        for (let i = idx; i >= 0; i--) {
            if (enemy[i] && enemy[i].length > 0) return { data: enemy[i], sourceLv: enemyLv && enemyLv[i] ? enemyLv[i] : this.getCurrentEnemySourceLv() };
        }
        for (let i = idx + 1; i < enemy.length; i++) {
            if (enemy[i] && enemy[i].length > 0) return { data: enemy[i], sourceLv: enemyLv && enemyLv[i] ? enemyLv[i] : this.getCurrentEnemySourceLv() };
        }
        return null;
    }

    createGmTopEnemyBatch(type: GlobalEnum.EnemyType, count: number, sourceLv?: number) {
        const forward = v3(GlobalTmpData.Player.lineVec);
        if (forward.lengthSqr() < 0.01) {
            forward.set(0, 0, 1);
        } else {
            forward.normalize();
        }

        const spawn = v3(this.followPos).subtract(forward.clone().multiplyScalar(16));
        const target = v3(this.followPos).add(forward.clone().multiplyScalar(6));
        spawn.y = 0;
        target.y = 0;
        this.delayCreateRecs.push({
            centerPath: [spawn, target],
            type,
            num: count,
            followOnSpawn: true,
            sourceLv,
        });
        this.hasDelayCreate = true;
    }

    createGmStageEnemies() {
        const stageData = this.getGmStageEnemyData();
        const data = stageData && stageData.data;
        const sourceLv = stageData && stageData.sourceLv ? stageData.sourceLv : this.getCurrentEnemySourceLv();
        let total = 0;

        if (data) {
            for (let i = 0; i < data.length; i++) {
                const str = data[i] as string;
                const arr = str.split(',');
                const enemyIdStr = arr[1] || '0';
                const max = Number(arr[3]);
                const count = Math.max(80, Math.ceil((Number.isFinite(max) ? max : 20) * 4));
                for (let m = 0; m < enemyIdStr.length; m++) {
                    const enemyType = Number(enemyIdStr[m]) as GlobalEnum.EnemyType;
                    if (GlobalEnum.EnemyType[enemyType] == null) continue;
                    this.createGmTopEnemyBatch(enemyType, count, sourceLv);
                    total += count;
                }
            }
        }

        if (total <= 0) {
            total = 120;
            this.createGmTopEnemyBatch(GlobalEnum.EnemyType.Normal, total, sourceLv);
        }

        console.log('GM stage enemies:', total, 'pathIndex:', this.pathIndex, 'sourceLv:', sourceLv);
    }
    hasDelayCreate = false;
    delayCurt = 0;
    delayCd = 0.016;
    delayCreateNum = 1;
    //延迟创建敌人
    delayCreateEnemy(dt) {
        this.delayCurt += dt;
        if (this.delayCurt >= this.delayCd) {
            this.delayCurt = 0;

            const _size = GlobalConfig.EnemyCfg.creatSize;
            this.hasDelayCreate = false;
            for (let i = this.delayCreateRecs.length - 1; i >= 0; i--) {
                const rec = this.delayCreateRecs[i];
                if (rec.num > 0) {
                    let n = rec.num > this.delayCreateNum ? this.delayCreateNum : rec.num;
                    rec.num -= this.delayCreateNum;
                    const _name = GlobalEnum.EnemyPrefabs[GlobalEnum.EnemyType[rec.type]];

                    for (let k = 0; k < n; k++) {
                        //出生点
                        this.tmpP.set(rec.centerPath[0]);
                        let offsetX = (2 * Math.random() - 1) * _size.x;
                        let offsetZ = (2 * Math.random() - 1) * _size.y;
                        this.tmpO.set(offsetX, 0, offsetZ);
                        let allPath = [];
                        this.getEnemySinglePath(rec.centerPath, this.tmpO, allPath);
                        let e = GlobalPool.get(_name);
                        e.setPosition(Vec3.ZERO);
                        e.parent = this.node;

                        let cmp;
                        switch (rec.type) {
                            case GlobalEnum.EnemyType.Bomb:
                                cmp = new EnemyBomb();
                                break;
                            default:
                                cmp = new Enemy();
                                break;
                        }
                        cmp.init(e, rec.type, allPath, rec.sourceLv);
                        if (rec.followOnSpawn) {
                            cmp.ignoreEndMark = true;
                            cmp.changeState(EnemyStateType.Follow, null, true);
                        }
                        this.allEnemys[e.uuid] = cmp;
                    }
                    this.hasDelayCreate = true;
                } else {
                    this.delayCreateRecs.splice(i, 1);
                }
            }
        }

    }
    updateEnemys(dt) {
        for (const key in this.allEnemys) {
            const e = this.allEnemys[key];
            if (e.node && e.node.active) {
                e.update(dt);
            } else {
                e.reset();
                delete this.allEnemys[key];
            }
        }

        this.delayCreateEnemy(dt);
        GlobalTmpData.EnemyNum = Object.keys(this.allEnemys).length;
        this.updateEndlessEndEnemys(dt);

        this.checkEndPathEnemyNum(dt);
    }
    lateUpdateEnemys(dt) {
        for (const key in this.allEnemys) {
            const e = this.allEnemys[key];
            if (e.node && e.node.active) {
                e.lateUpdate(dt);
            } else {
                e.reset();
                delete this.allEnemys[key];
            }
        }
    }
    //检测敌人数量
    checkEndPathEnemyNum(dt) {
        if (this.endlessEndEnemyEnabled && this.isRoleAllStand) return;
        if (!this.isRoleAllStand || this.isEnemyAllDeath || this.hasDelayCreate) return;
        this.isEnemyAllDeath = true;
        for (const key in this.allEnemys) {
            const e = this.allEnemys[key];
            if (e && e.curPos.z <= this.followPos.z + 15) {
                this.isEnemyAllDeath = false;
            }
        }

        if (this.isEnemyAllDeath) {
            this.onEnemyAllDeath();
        }
    }
    onEnemyAllDeath() {
        //胜利
        this.emit(EventTypes.GameEvents.GameOver, true);

        this.showWinEffects();
    }

    killAllEnemys() {
        for (const key in this.allEnemys) {
            const e = this.allEnemys[key];
            e && e.byHit(e.hp);
        }
    }

    //#endregion

    //#region -----------------------------延迟创建预制体--------------
    //记录已创建的数量
    _prefabRecs: { [name: string]: number } = {};
    //预先创建设定的最大数量-非实际数量
    _preMaxCfg: { [name: string]: number } = {
        'player': 50,
        'enemyNormal': 100,
        'enemyGiant': 100,
        'enemyBomb': 100,
        'enemyNinja': 100,
        'enemyBoss': 100,
    }
    setPreCreateData(d: LevelDataTmp) {
        for (let i = 0; i < d.enemy.length; i++) {
            const arr = d.enemy[i];
            if (arr) {
                const t = arr[1];
                let _name = GlobalEnum.EnemyPrefabs[GlobalEnum.EnemyType[t]];
                if (!this._prefabRecs[_name]) {
                    this._prefabRecs[_name] = 0;
                }
            }
        }
    }
    createCurt = 0;
    createCd = 0.05;
    updateCreateData(dt) {
        //每种类型 创建一个
        this.createCurt += dt;
        if (this.createCurt >= this.createCd) {
            this.createCurt = 0;
            for (const key in this._prefabRecs) {
                if (this._preMaxCfg[key] && this._prefabRecs[key] < this._preMaxCfg[key]) {
                    let e = GlobalPool.get(key);
                    GlobalPool.put(e);
                    this._prefabRecs[key]++;
                }
            }
        }
    }

    //#endregion

    //#region ------------------------------事件-----------------------
    //复活
    onResurgence() {
        //恢复初始数量 + 10
        this.setRoles();
        this.createRoles(10, false);
        //同时清空敌人
        this.killAllEnemys();

        this.emit(EventTypes.GameEvents.GameResume);
    }
    //取消复活
    onCanceResurgence() {
        this.emit(EventTypes.GameEvents.GameOver, false);
    }

    //主页镜头
    onShowHomeCamera(isShow) {
        this.isCloseCamera = isShow;
    }

    //运行
    onGameRun() {
        for (const key in this.allRoles) {
            const e = this.allRoles[key];
            if (e && e._curState == RoleStateType.Idle) {
                e.changeState(RoleStateType.Move);
            }
        }
        this.isCloseCamera = false;
    }
    /**升级巨人 */
    onLvupGaint() {
        let hasUnMaxLvGiant = false;
        for (const key in this.allRoles) {
            const role = this.allRoles[key];
            if (role && role.isGiant &&
                role.node.active && role._curState != RoleStateType.Death &&
                role.curGiantLv < 3) {
                role.setGiantLv(role.curGiantLv + 1);
                hasUnMaxLvGiant = true;
                break;
            }
        }

        if (!hasUnMaxLvGiant) {
            //创建新的巨人
            this.createRoles(1, true, 1);
        }
    }

    symbolArr = ['+', '-', 'x', '/']
    //增加普通角色的人数
    onAddRoles(t: GlobalEnum.IncreaseType, n: number) {
        if (this.roleSumCount <= 0) return;
        let sum = n;
        switch (t) {
            case GlobalEnum.IncreaseType.symbol_Add: //+
                this.createRoles(n, false);
                AudioSystem.playEffect(AudioEnum.addRole);
                break;

            case GlobalEnum.IncreaseType.symbol_Reduce: //-
                this.reduceNormalRoles(n);
                break;

            case GlobalEnum.IncreaseType.symbol_Multip: //x
                n = n < 1 ? 1 : n;
                sum = this.normalRoleNum * (n - 1);
                this.createRoles(sum, false);
                AudioSystem.playEffect(AudioEnum.addRole);

                break;
            case GlobalEnum.IncreaseType.symbol_Division: // /
                sum = Math.ceil(this.normalRoleNum / n);
                this.reduceNormalRoles(sum);
                break;
            default:
                break;
        }
        console.log(this.symbolArr[t], n);
    }

    onAddViewerRoles(d: AddViewerRolesData) {
        this.createViewerRoles(d);
        AudioSystem.playEffect(AudioEnum.addRole);
    }

    onViewerDamageDealt(d: ViewerRoleData, damage: number) {
        this.addViewerBattleValue(d, 'damageDealt', damage);
    }

    onViewerDamageTaken(d: ViewerRoleData, damage: number) {
        this.addViewerBattleValue(d, 'damageTaken', damage);
    }

    /**角色死亡 */
    onRoleDeath(uuid: string) {
        if (this.allRoles[uuid]) {
            this.updateViewerSoldierCounts(this.allRoles[uuid].viewerData, -1, 0);
            this.roleSumCount = Math.max(0, this.roleSumCount - 1);
            if (!this.allRoles[uuid].isGiant) {
                this.normalRoleNum = Math.max(0, this.normalRoleNum - 1);
            }
            if (this.reserveRoleQueue.length > 0) {
                this.pendingReserveRelease++;
            }
        }
        if (this.roleSumCount == 0) {
            if (this.reserveRoleQueue.length > 0) {
                this.pendingReserveRelease = Math.max(this.pendingReserveRelease, 1);
                return;
            }
            setTimeout(() => {
                if (this.isRoleAllStand) {
                    this.emit(EventTypes.GameEvents.GameOver, false);
                } else {
                    this.emit(EventTypes.GameEvents.GamePause);
                    UISystem.showUI(UIEnum.ResurgenceUI);
                }
            }, 1000);
        }
    }

    /**创建敌人 */
    onCreateEnemys(d: { type: GlobalEnum.EnemyType, count: number, initPathIndex: number, initPath: Vec3[], sourceLv?: number }) {
        this.createEnemys(d);

    }
    /**切换玩家武器 */
    onCreateGmStageEnemys() {
        this.createGmStageEnemies();
    }

    onSetWeapon(t) {
        this.curWeapon = t;
        for (const key in this.allRoles) {
            const e = this.allRoles[key];
            e && !e.viewerData && e.setWeapon(t);
        }
    }
    //#endregion

    //#region ------------------------------音效---------
    _audioCdMin = 1 / 10;
    _curAudioCd = 0;
    _audioTime = 0;

    updateAudio(dt) {
        if (!GlobalTmpData.Game.isGameRun || this.roleSumCount == 0) return;
        this._audioTime += dt;
        let spd = WeaponCfg[this.curWeapon].atkSpd;
        this._curAudioCd = clamp(1 / (this.roleSumCount * spd), this._audioCdMin, 10);

        if (this._audioTime >= this._curAudioCd) {
            this._audioTime = 0;
            switch (this.curWeapon) {
                case GlobalEnum.WeaponType.FireGun:
                    AudioSystem.playEffect(AudioEnum.FireGun);
                    break;
                case GlobalEnum.WeaponType.Shotgun:
                    AudioSystem.playEffect(AudioEnum.shotGun);
                    break;
                case GlobalEnum.WeaponType.MachineGun:
                    AudioSystem.playEffect(AudioEnum.MachineGun);
                    break;
                case GlobalEnum.WeaponType.Pistol:
                    AudioSystem.playEffect(AudioEnum.Pistol);
                    break;
                    case GlobalEnum.WeaponType.Grenades:
                    AudioSystem.playEffect(AudioEnum.ShouLiu);
                    break;
                default:
                    break;
            }
        }

    }

    //#endregion

    //#region ------------------------------胜利焰火3D---------
    intervalId = null;
    resetWinEffects() {
        clearInterval(this.intervalId);
    }

    showWinEffects() {
        return;
        this.intervalId = setInterval(() => { this.showEffect() }, 200);
    }
    tmpData = { p: v3(), s: 1 };
    showEffect() {
        let p = v3(GlobalTmpData.Player.wpos);
        p.z -= 5;
        let n = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < n; i++) {
            this.tmpData.p.set(p);
            this.tmpData.p.x += (Math.random() * 2 - 1) * 4;
            this.tmpData.p.z += (Math.random() * 2 - 1) * 4;
            this.tmpData.s = Math.random() * 2 + 1;
            this.tmpData.p.y += Math.random() * 4 + 1;
            this.emit(EventTypes.EffectEvents.showObjs, GlobalEnum.Effect3dType.fireWork, this.tmpData);
        }

    }

    //#endregion
}


