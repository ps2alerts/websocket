// CAREFUL modifying this file! The values have to match what the API expects exactly or we will get
// unprocessable messages! This should also match on the API side, so if you change this, update both.
export enum Ps2alertsApiMQEndpoints {
    GLOBAL_CHARACTER_AGGREGATE = 'globalCharacterAggregate',
    GLOBAL_CLASS_AGGREGATE = 'globalClassAggregate',
    GLOBAL_FACILITY_CONTROL_AGGREGATE = 'globalFacilityControlAggregate',
    GLOBAL_FACTION_COMBAT_AGGREGATE = 'globalFactionCombatAggregate',
    GLOBAL_OUTFIT_AGGREGATE = 'globalOutfitAggregate',
    GLOBAL_WEAPON_AGGREGATE = 'globalWeaponAggregate',
    INSTANCE_CHARACTER_AGGREGATE = 'instanceCharacterAggregate',
    INSTANCE_CLASS_AGGREGATE = 'instanceClassAggregate',
    INSTANCE_FACILITY_CONTROL_AGGREGATE = 'instanceFacilityControlAggregate',
    INSTANCE_FACTION_COMBAT_AGGREGATE = 'instanceFactionCombatAggregate',
    INSTANCE_OUTFIT_AGGREGATE = 'instanceOutfitAggregate',
    INSTANCE_POPULATION_AGGREGATE = 'instancePopulationAggregate',
    INSTANCE_WEAPON_AGGREGATE = 'instanceWeaponAggregate',
    INSTANCE_DEATH = 'instanceDeathEvent',
    INSTANCE_FACILITY_CONTROL = 'instanceFacilityControlEvent',
    INSTANCE_METAGAME = 'instanceMetagame',
}