import {ContainerModule} from 'inversify';
import {get} from '../utils/env';

export default class App {
    public readonly environment: string = get('NODE_ENV');

    public readonly version: string = get('VERSION');

    /**
     * @return {ContainerModule[]} Modules used by the app
     */
    get modules(): ContainerModule[] {
        /* eslint-disable */
        return [
            require('../services/census').default,
            require('../handlers').default,
            require('../services/mongo').default,
            require('../services/subscribers').default,
            require('../authorities').default,
            require('../handlers/aggregate').default,
        ];
        /* eslint-enable */
    }
}