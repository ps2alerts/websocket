/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "timestamp":"",
 "world_id":"",
 "old_faction_id":"",
 "outfit_id":"",
 "new_faction_id":"",
 "facility_id":"",
 "duration_held":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import FactionUtils from '../../../utils/FactionUtils';
import {Faction} from '../../../constants/faction';
import {FacilityControl} from 'ps2census';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';
import {FacilityDataInterface} from '../../../interfaces/FacilityDataInterface';

@injectable()
export default class FacilityControlEvent {
    public readonly instance: PS2AlertsInstanceInterface;
    public readonly facility: FacilityDataInterface;
    public readonly timestamp: Date;
    public readonly oldFaction: Faction;
    public readonly newFaction: Faction;
    public readonly durationHeld: number;
    public readonly isDefence: boolean;
    public readonly outfitCaptured: string | null;

    constructor(event: FacilityControl, instance: PS2AlertsInstanceInterface, facility: FacilityDataInterface) {
        this.instance = instance;

        this.facility = facility;

        this.timestamp = event.timestamp;

        this.durationHeld = Parser.parseNumericalArgument(event.duration_held);

        if (isNaN(this.durationHeld)) {
            throw new IllegalArgumentException('durationHeld', 'FacilityControlEvent');
        }

        this.oldFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.old_faction_id));
        this.newFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.new_faction_id));

        this.isDefence = this.oldFaction === this.newFaction;

        this.outfitCaptured = event.outfit_id ? event.outfit_id : null;
    }
}
