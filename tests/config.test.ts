
import { ConfigService } from '../src/services/config.js';
import * as fs from 'fs';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';


describe('ConfigService', () => {
    let existsSyncSpy: any;
    let readFileSyncSpy: any;
    let writeFileSyncSpy: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup spies
        existsSyncSpy = jest.spyOn(fs, 'existsSync');
        readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
        writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should load config from file', () => {
        existsSyncSpy.mockReturnValue(true);
        readFileSyncSpy.mockReturnValue(JSON.stringify({ openaiApiKey: 'test-key' }));

        const configService = new ConfigService();
        expect(configService.get('openaiApiKey')).toBe('test-key');
    });

    it('should return undefined for missing key', () => {
        existsSyncSpy.mockReturnValue(false);
        const configService = new ConfigService();
        expect(configService.get('openaiApiKey')).toBeUndefined();
    });

    it('should save config', () => {
        existsSyncSpy.mockReturnValue(false);
        const configService = new ConfigService();
        configService.set('provider', 'anthropic');
        
        expect(writeFileSyncSpy).toHaveBeenCalled();
    });
});
