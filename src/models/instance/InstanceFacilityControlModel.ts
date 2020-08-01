import {Document, Schema} from 'mongoose';
import {Faction, factionArray} from '../../constants/faction';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

export interface InstanceFacilityControlInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    facility: number;
    timestamp: Date;
    oldFaction: Faction;
    newFaction: Faction;
    durationHeld: number;
    isDefence: boolean;
    outfitCaptured: string|null;
}

export const instanceFacilityControlSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    facility: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    oldFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    newFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    durationHeld: {
        type: Number,
        default: 0,
    },
    isDefence: {
        type: Boolean,
        required: true,
    },
    outfitCaptured: {
        type: String,
        default: null,
    },
}).index(
    {instance: 1, facility: 1, timestamp: 1},
    {unique: true},
);