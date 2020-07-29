/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "facility_id":"",
 "outfit_id":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';
import {PlayerFacilityCapture} from 'ps2census';
import {World} from '../../../constants/world';

@injectable()
export default class PlayerFacilityCaptureEvent {
    public readonly world: World;
    public readonly zone: Zone;
    public readonly timestamp: Date;
    public readonly characterId: string;
    public readonly facilityId: number;
    public readonly outfitId: number;

    constructor(event: PlayerFacilityCapture) {

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'PlayerFacilityCaptureEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        if (isNaN(this.zone)) {
            throw new IllegalArgumentException('zone_id', 'PlayerFacilityCaptureEvent');
        }

        this.timestamp = event.timestamp;

        this.characterId = event.character_id; // This is a string on purpose

        this.facilityId = Parser.parseNumericalArgument(event.facility_id);

        if (isNaN(this.facilityId)) {
            throw new IllegalArgumentException('facility_id', 'PlayerFacilityCaptureEvent');
        }

        this.outfitId = Parser.parseNumericalArgument(event.outfit_id);

        if (isNaN(this.outfitId)) {
            throw new IllegalArgumentException('outfit_id', 'PlayerFacilityCaptureEvent');
        }
    }
}