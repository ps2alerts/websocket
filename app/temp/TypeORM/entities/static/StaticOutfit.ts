import {Entity, Column} from 'typeorm';
import {World} from '../../../../src/constants/world';
import {Faction} from '../../../../src/constants/faction';

@Entity()
export default class StaticOutfit {

    // Maps to ingame outfit ID
    @Column()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: World,
    })
    server: World;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    faction: Faction;
}