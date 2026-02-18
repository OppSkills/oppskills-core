import { Injectable } from '@nestjs/common';
import { Logger } from '../../_utils/logger';

@Injectable()
export class AdminFeaturesService {
    private logger = new Logger('AdminFeaturesService');

    async listAllFestivals() {
        this.logger.log('listAllFestivals called');
    }

    async listAllHackathons() {
        this.logger.log('listAllHackathons called');
    }

    async listAllEvents() {
        this.logger.log('listAllEvents called');
    }

    async listAllUserAccounts() {
        this.logger.log('listAllUserAccounts called');
    }

    async listAllColleges() {
        this.logger.log('listAllColleges called');
    }

    async listAllMedia() {
        this.logger.log('listAllMedia called');
    }

    async searchFestivals() {
        this.logger.log('searchFestivals called');
    }

    async searchHackathons() {
        this.logger.log('searchHackathons called');
    }

    async searchEvents() {
        this.logger.log('searchEvents called');
    }

    async searchUserAccounts() {
        this.logger.log('searchUserAccounts called');
    }

    async searchColleges() {
        this.logger.log('searchColleges called');
    }
}
