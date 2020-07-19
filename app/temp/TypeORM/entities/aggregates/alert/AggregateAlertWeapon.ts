import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../../Alert';
import StaticWeapon from '../../static/StaticWeapon';

@Entity()
export class AggregateAlertWeapon {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticWeapon,
        (weapon) => weapon.id,
        {
            nullable: true,
        },
    )
    @JoinColumn()
    weapon: StaticWeapon;

    // Kills player has made with weapon
    @Column()
    kills: number;

    // Player has died to the same weapon (common pool)
    @Column()
    deaths: number;

    // Teamkills player has made with the weapon
    @Column()
    teamKills: number;

    // Player has killed themselves with the weapon (e.g. C4 gone wrong)
    @Column()
    suicides: number;

    // Headshots player has made with the weapon
    @Column()
    headshots: number;
}