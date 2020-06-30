import config from '../config';
import { injectable } from 'inversify';
import { getLogger } from '../logger';

@injectable()
export default class worldValidator {
    private static readonly logger = getLogger('WorldValidator');

    public validate(world: number): boolean {
        if (!config.features.MONITORED_SERVERS.has(world)) {
            if (config.features.LOGGING.VALIDATION_REJECTS) {
                worldValidator.logger.warn(`Got event from world ${world}, which we don't monitor!`);
            }
            return false;
        }

        return true;
        // TODO: Perform checks for active alert worlds
    }
}