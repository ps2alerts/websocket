/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "timestamp":"",
 "world_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import {GenericEvent} from '../../../types/censusEventTypes';
import {PlayerLogin} from 'ps2census/dist/client/utils/PS2Events';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';

@injectable()
export default class PlayerLoginEvent {
    public readonly characterId: number;

    public readonly worldId: number;

    constructor(
        event: GenericEvent,
    ) {
        const playerLogin = event as PlayerLogin;
        this.characterId = Parser.parseArgumentAsNumber(playerLogin.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'PlayerLoginEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(playerLogin.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'PlayerLoginEvent');
        }
    }

}
