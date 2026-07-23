import { ICourierService } from './types';
import { RedXService } from './redx/service';
import { SteadfastService } from './steadfast/service';
import { PathaoService } from './pathao/service';
import Courier from '@/models/Courier';

/**
 * Courier Factory
 * Manages and retrieves courier services based on database configuration.
 */
export class CourierFactory {
    /**
     * Get an active courier service by name
     * @param name Courier name ('redx', 'steadfast', 'pathao')
     * @returns The courier service instance or null if not found or disabled
     */
    static async getService(name: string, ignoreEnabled: boolean = false): Promise<ICourierService | null> {
        const query: any = { name };
        if (!ignoreEnabled) {
            query.isEnabled = true;
        }
        const courier = await Courier.findOne(query);
        if (!courier) return null;

        switch (name) {
            case 'redx':
                return new RedXService({
                    apiKey: courier.config.apiKey,
                    isSandbox: courier.config.isSandbox
                });
            case 'steadfast':
                return new SteadfastService({
                    apiKey: courier.config.apiKey,
                    secretKey: courier.config.secretKey
                });
            case 'pathao':
                return new PathaoService({
                    clientId: courier.config.clientId,
                    clientSecret: courier.config.clientSecret,
                    username: courier.config.username,
                    password: courier.config.password,
                    isSandbox: courier.config.isSandbox
                });
            default:
                return null;
        }
    }

    /**
     * Get all currently enabled courier services
     */
    static async getEnabledServices(): Promise<ICourierService[]> {
        const couriers = await Courier.find({ isEnabled: true });
        const services: ICourierService[] = [];

        for (const courier of couriers) {
            const service = await this.getService(courier.name);
            if (service) services.push(service);
        }

        return services;
    }
}
