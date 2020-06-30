export default {
    ACCEPT_ADMIN_CONNECTION: true,
    DB_DEBUG: true,
    EVENTS: {
        AchievementEarned: true,
        BattleRankUp: true,
        ContinentLock: true,
        ContinentUnlock: true,
        Death: true,
        FacilityControl: true,
        GainExperience: false,
        ItemAdded: false,
        MetagameEvent: true,
        PlayerFacilityCapture: true,
        PlayerFacilityDefend: true,
        PlayerLogin: true,
        PlayerLogout: true,
        SkillAdded: true,
        VehicleDestroy: true,
    },
    LOGGING: {
        VALIDATION_REJECTS: true,
    },
    MONITORED_SERVERS: new Set([1,9,11,10,13,17,18,19,25,40,1000,1001]),
    MONITORED_ZONES: new Set([2,4,6,8]),
    VALIDATION_DEBUG: true,
};
