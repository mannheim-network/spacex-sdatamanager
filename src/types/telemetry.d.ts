import { GroupInfo } from './context';
import { NormalizedSchedulerConfig } from './sdatamanager-config';

export interface TelemetryData {
  chainAccount: string;
  smangerInfo: SMangerInfo;
  pinStats: PinStats;
  storage: StorageStats | null;
  queueStats: QueueInfo;
  cleanupStats: CleanupStats;
  groupInfo: GroupInfo;
  hasSealCoordinator: boolean;
}

export interface StorageStats {
  files: {
    lost: {
      num: number;
      size: number;
    };
    pending: {
      num: number;
      size: number;
    };
    valid: {
      num: number;
      size: number;
    };
  };
  srd: {
    srd_complete: number;
    srd_remaining_task: number;
    disk_available_for_srd: number;
    disk_available: number;
    disk_volume: number;
    sys_disk_available: number;
    srd_volumn_count: number;
  };
}

export interface SDataManagerInfo {
  version: string;
  uptime: number; // uptime in seconds
  schedulerConfig: NormalizedSchedulerConfig;
}

export interface QueueInfo {
  pendingCount: number;
  pendingSizeTotal: number; // in MB
}

export interface PinStats {
  sealingCount: number;
  failedCount: number;
  sealedCount: number;
  sealedSize: number; // in MB
}

export interface CleanupStats {
  deletedCount: number;
}
