import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import {World} from '../constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Zone} from '../constants/zone';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {remove} from 'lodash';
import {jsonLogOutput} from '../utils/json';
import InstanceActionFactory from '../factories/InstanceActionFactory';
import {CensusEnvironment} from '../types/CensusEnvironment';

@injectable()
export default class InstanceAuthority {
    private static readonly logger = getLogger('InstanceAuthority');
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];
    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly instanceActionFactory: InstanceActionFactory;
    private activeTimer?: NodeJS.Timeout;
    private initialized = false;

    constructor(
    @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject(TYPES.instanceActionFactory) instanceActionFactory: InstanceActionFactory,
    ) {
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.instanceActionFactory = instanceActionFactory;
    }

    public getInstance(instanceId: string): PS2AlertsInstanceInterface {
        InstanceAuthority.logger.debug(`Attempting to find an instance with ID: "${instanceId}"...`);

        const instance = this.currentInstances.find((i) => {
            return i.instanceId === instanceId;
        });

        if (!instance) {
            throw new ApplicationException(`Unable to find InstanceID "${instanceId}"!`, 'InstanceAuthority');
        }

        InstanceAuthority.logger.debug(`Found instance with ID: "${instanceId}"!`);
        InstanceAuthority.logger.debug(`${jsonLogOutput(instance)}`);

        return instance;
    }

    public getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.match(world, zone) && instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public async startInstance(instance: PS2AlertsInstanceInterface, environment: CensusEnvironment): Promise<boolean> {
        InstanceAuthority.logger.info(`================== STARTING INSTANCE ON WORLD ${instance.world}! ==================`);

        if (instance instanceof MetagameTerritoryInstance) {
            try {
                const row = await this.instanceMetagameModelFactory.model.create({
                    instanceId: instance.instanceId,
                    world: instance.world,
                    timeStarted: instance.timeStarted,
                    timeEnded: null,
                    result: null,
                    zone: instance.zone,
                    censusInstanceId: instance.censusInstanceId,
                    censusMetagameEventType: instance.censusMetagameEventType,
                    duration: instance.duration,
                    state: instance.state,
                    bracket: null,
                });
                InstanceAuthority.logger.info(`================ INSERTED NEW INSTANCE ${row.instanceId} ================`);

                // Execute start actions
                await this.instanceActionFactory.buildStart(instance, environment).execute().catch(async (e) => {
                    // End early if instance failed to insert so we don't add a instance to the list of actives.
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                    InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${e.message}`);

                    await this.trashInstance(instance);
                    return false;
                });

                this.currentInstances.push(instance); // Add instance to the in-memory data so it can be called upon rapidly without polling DB
                this.printActives(); // Show currently running alerts in console / log

                return true;
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`[${instance.instanceId}] Unable to insert instance into DB! ${err}`, 'InstanceAuthority');
            }
        }

        throw new ApplicationException(`[${instance.instanceId}] Start instance ended unexpectedly!`, 'InstanceAuthority');
    }

    public async endInstance(instance: PS2AlertsInstanceInterface, environment: CensusEnvironment): Promise<boolean> {
        InstanceAuthority.logger.info(`================== ENDING INSTANCE "${instance.instanceId}" ==================`);

        // Set instance state immediately to ended so no further stats will process
        instance.state = Ps2alertsEventState.ENDED;
        InstanceAuthority.logger.debug(`[${instance.instanceId}] marked as ended`);

        const done = false;

        // Find Instance and update
        try {
            await this.instanceActionFactory.buildEnd(instance, environment).execute();

            // Since for some reason the connection manager doesn't throw anything when timing out, handle it here.
            const timeout = new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);

                    if (!done) {
                        reject(new Error(`[${instance.instanceId}] Instance end timeout!`));
                    } else {
                        resolve(true);
                    }
                }, 5000);
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const promise = this.instanceMetagameModelFactory.model.updateOne(
                {instanceId: instance.instanceId},
                {
                    state: Ps2alertsEventState.ENDED,
                    timeEnded: new Date(),
                },
            );

            await Promise.race([
                promise,
                timeout,
            ]).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                throw new ApplicationException(err.message);
            });

            remove(this.currentInstances, (i) => {
                return i.instanceId === instance.instanceId;
            });

            InstanceAuthority.logger.info(`================ SUCCESSFULLY ENDED INSTANCE "${instance.instanceId}" ================`);
            this.printActives();
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to end instance correctly! E: ${err}`, 'InstanceAuthority');
        }
    }

    public async init(): Promise<boolean> {
        InstanceAuthority.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceAuthority was called to be initialized more than once!', 'InstanceAuthority');
        }

        let rows: InstanceMetagameTerritorySchemaInterface[] = [];

        try {
            rows = await this.instanceMetagameModelFactory.model.find({
                state: Ps2alertsEventState.STARTED,
            }).exec();
        } catch (err) {
            throw new ApplicationException('Unable to retrieve active instances!', 'InstanceAuthority');
        }

        if (!rows.length) {
            InstanceAuthority.logger.warn('No active instances were detected in the database! This could be entirely normal however.');
        } else {
            rows.forEach((i) => {
                const instance = new MetagameTerritoryInstance(
                    i.world,
                    i.timeStarted,
                    null,
                    i.result,
                    i.zone,
                    i.censusInstanceId,
                    i.censusMetagameEventType,
                    i.duration,
                    i.state,
                    i.bracket ?? undefined,
                );
                this.currentInstances.push(instance);
            });
        }

        // Set timer for instances display
        this.activeTimer = setInterval(() => {
            this.printActives();
        }, 60000);

        this.printActives();
        InstanceAuthority.logger.debug('Initializing ActiveInstances FINISHED');
        this.initialized = true;
        return true;
    }

    public printActives(): void {
        InstanceAuthority.logger.info('==== Current actives =====');
        const date = new Date();
        this.currentInstances.forEach((instance: PS2AlertsInstanceInterface) => {
            let output = `I: ${instance.instanceId} | W: ${instance.world}`;

            if (instance instanceof MetagameTerritoryInstance) {
                output = `${output} | Z: ${instance.zone}`;
            }

            // Display expected time left
            const endTime = instance.timeStarted.getTime() + instance.duration;
            const remaining = (endTime - date.getTime()) / 1000;
            const displayDate = new Date(0);
            displayDate.setSeconds(remaining);
            output = `${output} | ${displayDate.toISOString().substr(11, 8)} remaining`;

            InstanceAuthority.logger.info(output);
        });

        InstanceAuthority.logger.info('==== Current actives end =====');
    }

    private async trashInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.instanceMetagameModelFactory.model.deleteOne({
            instanceId: instance.instanceId,
        }).catch((e: Error) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] UNABLE TO DELETE INSTANCE! E: ${e.message}`, 'InstanceAuthority');
        });

        InstanceAuthority.logger.error(`================ [${instance.instanceId}] INSTANCE DELETED! ================`);
    }
}