import {MessageQueueHandlerInterface} from '../../interfaces/MessageQueueHandlerInterface';
import ParsedQueueMessage from '../../data/ParsedQueueMessage';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import {inject, injectable} from 'inversify';
import PS2AlertsMetagameInstance from '../../instances/PS2AlertsMetagameInstance';
import {metagameEventTypeDetailsMap} from '../../constants/metagameEventType';
import EventId from '../../utils/eventId';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';
import AdminWebsocketInstanceStartMessage from '../../data/AdminWebsocket/AdminWebsocketInstanceStartMessage';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import AdminWebsocketInstanceEndMessage from '../../data/AdminWebsocket/AdminWebsocketInstanceEndMessage';

@injectable()
export default class AdminWebsocketMessageHandler implements MessageQueueHandlerInterface<ParsedQueueMessage> {
    private static readonly logger = getLogger('AdminWebsocketMessageHandler');

    private readonly instanceHandler: InstanceHandlerInterface;

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;

    }
    public async handle(message: ParsedQueueMessage): Promise<boolean> {
        switch (message.type) {
            case 'instanceStart':
                return await this.startInstance(message);
            case 'instanceEnd':
                return await this.endInstance(message);
            case 'activeInstances':
                void this.activeInstances();
                return true;
        }

        throw new ApplicationException(`Unknown AdminWebsocket message received: ${jsonLogOutput(message)}`, 'AdminWebsocketMessageHandler');
    }

    // Collect the required information from the message in order to generate an PS2AlertsMetagameInstance, then trigger it.
    private async startInstance(message: ParsedQueueMessage): Promise<boolean> {
        const adminWebsocketInstanceStart = new AdminWebsocketInstanceStartMessage(message.body);

        const censusEventId = EventId.zoneFactionMeltdownToEventId(
            adminWebsocketInstanceStart.zone,
            adminWebsocketInstanceStart.faction,
            adminWebsocketInstanceStart.meltdown,
        );

        const metagameDetails = metagameEventTypeDetailsMap.get(censusEventId);

        if (!metagameDetails) {
            throw new ApplicationException(`Unknown metagame event id ${censusEventId}`, 'AdminWebsocketMessageHandler');
        }

        const instance = new PS2AlertsMetagameInstance(
            adminWebsocketInstanceStart.world,
            new Date(),
            null,
            adminWebsocketInstanceStart.zone,
            adminWebsocketInstanceStart.instanceId,
            censusEventId,
            metagameDetails.duration,
            Ps2alertsEventState.STARTED,
        );

        try {
            return this.instanceHandler.startInstance(instance);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminWebsocketMessageHandler.logger.error(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminWebsocket message! Error: ${e.message}`);
        }

        return false;
    }

    private async endInstance(message: ParsedQueueMessage): Promise<boolean> {
        const websocketMessage = new AdminWebsocketInstanceEndMessage(message.body);
        const instance = this.instanceHandler.getInstance(websocketMessage.instanceId);

        if (!instance) {
            AdminWebsocketMessageHandler.logger.error(`Failed ending instance #${websocketMessage.instanceId} via adminWebsocket message! No instance found!`);
        }

        try {
            return await this.instanceHandler.endInstance(instance);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminWebsocketMessageHandler.logger.error(`Failed ending instance #${websocketMessage.instanceId} via adminWebsocket message! Error: ${e.message}`);
        }

        return false;
    }

    private activeInstances(): void {
        return this.instanceHandler.printActives();
    }
}