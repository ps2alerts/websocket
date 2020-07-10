import WorldValidator from '../../validators/WorldValidator';
import {injectable} from 'inversify';
import DeathEventHandler from './DeathEventHandler';
import {getLogger} from '../../logger';
import config from '../../config';
import MetagameEventEventHandler from './MetagameEventEventHandler';
import PlayerLoginEventHandler from './PlayerLoginEventHandler';
import PlayerLogoutEventHandler from './PlayerLogoutEventHandler';
import ContinentLockEventHandler from './ContinentLockEventHandler';
import FacilityControlEventHandler from './FacilityControlEventHandler';
import GainExperienceEventHandler from './GainExperienceEventHandler';
import {PlayerLogin, PS2Event} from 'ps2census';
import AchievementEarnedHandler from './AchievementEarnedHandler';
import BattleRankUpHandler from './BattleRankUpHandler';
import PlayerFacilityCaptureHandler from './PlayerFacilityCaptureHandler';
import PlayerFacilityDefendHandler from './PlayerFacilityDefendHandler';
import ContinentUnlockHandler from './ContinentUnlockHandler';

@injectable()
export default class CensusProxy {
    private static readonly logger = getLogger('CensusProxy');

    private readonly worldCheck: WorldValidator;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly playerLoginEventHandler: PlayerLoginEventHandler;
    private readonly playerLogoutEventHandler: PlayerLogoutEventHandler;
    private readonly continentLockHandler: ContinentLockEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly achievementEarnedHandler: AchievementEarnedHandler;
    private readonly battleRankUpHandler: BattleRankUpHandler;
    private readonly playerFacilityCapture: PlayerFacilityCaptureHandler;
    private readonly playerFacilityDefend: PlayerFacilityDefendHandler;
    private readonly coninentUnlockHandler: ContinentUnlockHandler;

    constructor(
        // TODO: make this into a single object parameter
        worldCheck: WorldValidator,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        playerLoginEventHandler: PlayerLoginEventHandler,
        playerLogoutEventHandler: PlayerLogoutEventHandler,
        continentLockHandler: ContinentLockEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        achievementEarnedHandler: AchievementEarnedHandler,
        battleRankUpHandler: BattleRankUpHandler,
        playerFacilityCapture: PlayerFacilityCaptureHandler,
        playerFacilityDefend: PlayerFacilityDefendHandler,
        continentUnlockHandler: ContinentUnlockHandler,
    ) {
        this.worldCheck = worldCheck;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.playerLoginEventHandler = playerLoginEventHandler;
        this.playerLogoutEventHandler = playerLogoutEventHandler;
        this.continentLockHandler = continentLockHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.achievementEarnedHandler = achievementEarnedHandler;
        this.battleRankUpHandler = battleRankUpHandler;
        this.playerFacilityCapture = playerFacilityCapture;
        this.playerFacilityDefend = playerFacilityDefend;
        this.coninentUnlockHandler = continentUnlockHandler;
    }

    public handle(event: PS2Event): boolean {
        if (config.features.logging.censusIncomingEvents) {
            CensusProxy.logger.debug(`INCOMING EVENT ${event.event_name}`);
        }

        // if (!this.worldCheck.validate(parseInt(event.world_id, 10))) {
        //    return false;
        // }

        switch (event.event_name) {
            case 'AchievementEarned':
                this.achievementEarnedHandler.handle(event);
                break;
            case 'BattleRankUp':
                this.battleRankUpHandler.handle(event);
                break;
            case 'Death':
                this.deathEventHandler.handle(event);
                break;
            case 'FacilityControl':
                this.facilityControlEventHandler.handle(event);
                break;
            case 'GainExperience':
                this.gainExperienceEventHandler.handle(event);
                break;
            case 'ItemAdded':
                // eventStore.storeItemAdded(payload);
                break;
            case 'MetagameEvent':
                this.metagameEventEventHandler.handle(event);
                break;
            case 'PlayerFacilityCapture':
                this.playerFacilityCapture.handle(event);
                break;
            case 'PlayerFacilityDefend':
                this.playerFacilityDefend.handle(event);
                break;
            case 'PlayerLogin':
                this.playerLoginEventHandler.handle(event);
                break;
            case 'PlayerLogout':
                this.playerLogoutEventHandler.handle(event);
                break;
            case 'SkillAdded':
                // eventStore.storeSkillAdded(payload);
                break;
            case 'VehicleDestroy':
                // eventStore.storeVehicleDestroy(payload);
                break;
            case 'ContinentLock':
                this.continentLockHandler.handle(event);
                break;
            case 'ContinentUnlock':
                this.coninentUnlockHandler.handle(event);
                break;
            default:
                return false;
        }

        return true;
    }
}
