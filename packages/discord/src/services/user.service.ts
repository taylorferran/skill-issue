import { promises as fs } from 'fs';
import path from 'path';
import { UserMapping } from '../types';

class UserService {
  private mappings: Map<string, string> = new Map(); // discordUserId -> backendUserId
  private mappingsFile = path.join(__dirname, '../../data/user-mappings.json');
  private isLoaded = false;

  async initialize(): Promise<void> {
    await this.loadMappings();
    this.isLoaded = true;
  }

  private async loadMappings(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.mappingsFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing mappings
      const data = await fs.readFile(this.mappingsFile, 'utf-8');
      const mappings: UserMapping[] = JSON.parse(data);

      for (const mapping of mappings) {
        this.mappings.set(mapping.discordUserId, mapping.backendUserId);
      }

      console.log(`📚 Loaded ${this.mappings.size} user mappings`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('📚 No existing user mappings found, starting fresh');
      } else {
        console.error('Error loading user mappings:', error);
      }
    }
  }

  private async saveMappings(): Promise<void> {
    try {
      const mappings: UserMapping[] = Array.from(this.mappings.entries()).map(
        ([discordUserId, backendUserId]) => ({ discordUserId, backendUserId })
      );

      await fs.writeFile(this.mappingsFile, JSON.stringify(mappings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving user mappings:', error);
    }
  }

  async getBackendUserId(discordUserId: string): Promise<string | null> {
    if (!this.isLoaded) {
      await this.initialize();
    }
    return this.mappings.get(discordUserId) || null;
  }

  async createMapping(discordUserId: string, backendUserId: string): Promise<void> {
    this.mappings.set(discordUserId, backendUserId);
    await this.saveMappings();
  }

  async isUserRegistered(discordUserId: string): Promise<boolean> {
    if (!this.isLoaded) {
      await this.initialize();
    }
    return this.mappings.has(discordUserId);
  }

  async deleteMapping(discordUserId: string): Promise<void> {
    this.mappings.delete(discordUserId);
    await this.saveMappings();
  }

  // Helper to get backend user ID and throw error if not registered
  async requireBackendUserId(discordUserId: string): Promise<string> {
    const backendUserId = await this.getBackendUserId(discordUserId);
    if (!backendUserId) {
      throw new Error('USER_NOT_REGISTERED');
    }
    return backendUserId;
  }
}

export const userService = new UserService();
