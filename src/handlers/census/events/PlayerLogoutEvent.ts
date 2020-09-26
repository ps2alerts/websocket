/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "timestamp":"",
 "world_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import {PlayerLogout} from 'ps2census';
import {World} from '../../../constants/world';
import Character from '../../../data/Character';

@injectable()
export default class PlayerLogoutEvent {
    public readonly character: Character;

    public readonly world: World;

    constructor(event: PlayerLogout, character: Character) {
        this.character = character;

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'PlayerLogoutEvent');
        }
    }
}