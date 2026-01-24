import { promises as fs } from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

import { userService } from '../../src/services/user.service';

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should load existing mappings from file', async () => {
      const mockMappings = [
        { discordUserId: 'discord123', backendUserId: 'backend456' },
        { discordUserId: 'discord789', backendUserId: 'backend101' },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMappings));

      await userService.initialize();

      const backendId = await userService.getBackendUserId('discord123');
      expect(backendId).toBe('backend456');
    });

    it('should handle missing file gracefully', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (fs.readFile as jest.Mock).mockRejectedValue(error);

      await expect(userService.initialize()).resolves.not.toThrow();
    });
  });

  describe('getBackendUserId', () => {
    it('should return backend user ID for known Discord user', async () => {
      const mockMappings = [
        { discordUserId: 'discord123', backendUserId: 'backend456' },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMappings));
      await userService.initialize();

      const backendId = await userService.getBackendUserId('discord123');
      expect(backendId).toBe('backend456');
    });

    it('should return null for unknown Discord user', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      await userService.initialize();

      const backendId = await userService.getBackendUserId('unknown');
      expect(backendId).toBeNull();
    });
  });

  describe('createMapping', () => {
    it('should create new mapping and save to file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      await userService.initialize();

      await userService.createMapping('discord123', 'backend456');

      expect(fs.writeFile).toHaveBeenCalled();
      const backendId = await userService.getBackendUserId('discord123');
      expect(backendId).toBe('backend456');
    });
  });

  describe('isUserRegistered', () => {
    it('should return true for registered user', async () => {
      const mockMappings = [
        { discordUserId: 'discord123', backendUserId: 'backend456' },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMappings));
      await userService.initialize();

      const isRegistered = await userService.isUserRegistered('discord123');
      expect(isRegistered).toBe(true);
    });

    it('should return false for unregistered user', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      await userService.initialize();

      const isRegistered = await userService.isUserRegistered('unknown');
      expect(isRegistered).toBe(false);
    });
  });

  describe('deleteMapping', () => {
    it('should delete mapping and save to file', async () => {
      const mockMappings = [
        { discordUserId: 'discord123', backendUserId: 'backend456' },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMappings));
      await userService.initialize();

      await userService.deleteMapping('discord123');

      expect(fs.writeFile).toHaveBeenCalled();
      const backendId = await userService.getBackendUserId('discord123');
      expect(backendId).toBeNull();
    });
  });

  describe('requireBackendUserId', () => {
    it('should return backend user ID for registered user', async () => {
      const mockMappings = [
        { discordUserId: 'discord123', backendUserId: 'backend456' },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMappings));
      await userService.initialize();

      const backendId = await userService.requireBackendUserId('discord123');
      expect(backendId).toBe('backend456');
    });

    it('should throw error for unregistered user', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));
      await userService.initialize();

      await expect(userService.requireBackendUserId('unknown')).rejects.toThrow('USER_NOT_REGISTERED');
    });
  });
});
