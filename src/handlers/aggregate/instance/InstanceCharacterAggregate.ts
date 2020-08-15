import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstanceCharacterAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceCharacterAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceCharacterAggregate');

    private readonly factory: MongooseModelFactory<InstanceCharacterAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceCharacterAggregateFactory) factory: MongooseModelFactory<InstanceCharacterAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceCharacterAggregate.logger.debug('InstanceCharacterAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal) {
            attackerDocs.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            attackerDocs.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide) {
            // Attacker and victim are the same here, so it doesn't matter which
            victimDocs.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        attackerDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    character: event.attackerCharacter.id,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceCharacterAggregate.logger.error(`Updating InstanceCharacterAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    character: event.character.id,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceCharacterAggregate.logger.error(`Updating InstanceCharacterAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }
}