import mongoose from 'mongoose';
import { LoggerService } from './logger.service';

export class DatabaseService {
    private logger = new LoggerService();

    constructor() {
        this.connect();
    }

    private async connect() {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/arbitrage-bot';
        try {
            await mongoose.connect(mongoUri);
            this.logger.log('Connected to MongoDB');
        } catch (error) {
            this.logger.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
}
