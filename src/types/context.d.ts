import { Dayjs } from 'dayjs';
import { Database } from 'sqlite';
import SpaceXApi from '../chain';
import IpfsApi from '../ipfs';
import StoragerApi from '../storager';
import { SealCoordinatorApi } from './seal-coordinator';
import { NormalizedConfig } from './sdatamanager-config';

export interface NodeInfo {
  nodeCount: number;
}
export interface GroupInfo {
  groupAccount: string;
  totalMembers: number;
  nodeIndex: number;
}

export interface AppContext {
  startTime: Dayjs;
  config: NormalizedConfig;
  api: SpaceXApi;
  database: Database;
  ipfsApi: IpfsApi;
  storagerApi: StoragerApi;
  nodeInfo: NodeInfo | null;
  groupInfo: GroupInfo | null;
  sealCoordinator: SealCoordinatorApi | null;
  cancelationTokens: { [cid: string]: AbortController };
}
