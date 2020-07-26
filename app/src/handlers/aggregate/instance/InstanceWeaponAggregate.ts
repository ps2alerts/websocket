import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import {InstanceWeaponAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceWeaponAggregateModel';

@injectable()
export default class InstanceWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceWeaponAggregate');

    private readonly factory: MongooseModelFactory<InstanceWeaponAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceWeaponAggregateFactory) factory: MongooseModelFactory<InstanceWeaponAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.debug('InstanceWeaponAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            instance: event.instance.instanceId,
            weapon: event.attackerWeaponId,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        if (!event.isTeamkill && !event.isSuicide) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.isTeamkill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.isSuicide) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            documents.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    weapon: event.attackerWeaponId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceWeaponAggregate.logger.error(`Updating InstanceWeaponAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.debug('Adding Initial InstanceWeaponAggregate Record');
        const data = {
            instance: event.instance.instanceId,
            weapon: event.attackerWeaponId,
            kills: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(data);
            InstanceWeaponAggregate.logger.debug(`Inserted initial InstanceWeaponAggregate record for Instance: ${row.instance} | Weapon: ${row.weapon}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial InstanceWeaponAggregate record into DB! ${err}`, 'InstanceWeaponAggregate');
        }
    }
}