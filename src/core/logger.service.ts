export class LoggerService {
    log(message: string) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    error(message: string, error?: any) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
}
