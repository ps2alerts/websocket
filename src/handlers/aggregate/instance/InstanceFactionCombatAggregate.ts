import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstanceFactionCombatAggregateSchemaInterface, InstanceFactionCombatAggregateSubSchemaInterface} from '../../../models/aggregate/instance/InstanceFactionCombatAggregateModel';
import ApplicationException from '../../../exceptions/ApplicationException';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceFactionCombatAggregate');

    private readonly factory: MongooseModelFactory<InstanceFactionCombatAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceFactionCombatAggregateFactory) factory: MongooseModelFactory<InstanceFactionCombatAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceFactionCombatAggregate.logger.debug('InstanceFactionCombatAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            instance: event.instance.instanceId,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        // Increment attacker faction kills
        if (event.killType === Kill.Normal) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.kills`;
            documents.push(
                {$inc: {[attackerKillKey]: 1}},
                {$inc: {['totals.kills']: 1}},
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
        const victimDeathKey = `${FactionUtils.parseFactionIdToShortName(event.characterFaction)}.deaths`;
        documents.push(
            {$inc: {[victimDeathKey]: 1}},
            {$inc: {['totals.deaths']: 1}},
        );

        if (event.killType === Kill.TeamKill) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const teamKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.teamKills`;
            documents.push(
                {$inc: {[teamKillKey]: 1}},
                {$inc: {['totals.teamKills']: 1}},
            );
        }

        if (event.killType === Kill.Suicide) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${FactionUtils.parseFactionIdToShortName(event.characterFaction)}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        if (event.isHeadshot) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerHeadshotKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.headshots`;
            documents.push(
                {$inc: {[attackerHeadshotKey]: 1}},
                {$inc: {['totals.headshots']: 1}},
            );
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {instance: event.instance.instanceId},
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceFactionCombatAggregate.logger.error(`Updating InstanceFactionCombatAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: DeathEvent): Promise<boolean> {
        InstanceFactionCombatAggregate.logger.debug('Adding Initial InstanceFactionCombatAggregate Record');

        const injectArgs = (): InstanceFactionCombatAggregateSubSchemaInterface => ({
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        });
        const data = {
            instance: event.instance.instanceId,
            vs: injectArgs(),
            nc: injectArgs(),
            tr: injectArgs(),
            nso: injectArgs(),
            totals: injectArgs(),
        };

        try {
            const row = await this.factory.model.create(data);
            InstanceFactionCombatAggregate.logger.debug(`Inserted initial InstanceFactionCombatAggregate record for Instance: ${row.instance}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial InstanceFactionCombatAggregate record into DB! ${err}`, 'InstanceFactionCombatAggregate');
            }
        }

        return false;
    }
}
