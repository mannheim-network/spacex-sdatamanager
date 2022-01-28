import axios, { AxiosInstance } from 'axios';
import qs from 'querystring';
import {
  QuerySealInfoResult,
  SealInfoMap,
  SealInfoResp,
  WorkloadInfo,
} from '../types/storage';
import { parseObj } from '../utils';

export default class StorageApi {
  private readonly storage: AxiosInstance;

  constructor(storageAddr: string, to: number) {
    this.storage = axios.create({
      baseURL: storageAddr + '/api/v0',
      timeout: to,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /// WRITE methods
  /**
   * End file by cid
   * @param cid ipfs cid
   * @returns End success or failed
   * @throws storage api error | timeout
   */
  async sealEnd(cid: string): Promise<boolean> {
    try {
      const res = await this.storage.post(
        '/storage/seal_end',
        JSON.stringify({ cid: cid }),
      );

      return res.status === 200;
    } catch (e) {
      return false;
    }
  }

  async getSealInfo(cid: string): Promise<SealInfoResp | null> {
    try {
      const searchParams = qs.stringify({
        cid,
      });
      const res = await this.storage.get<QuerySealInfoResult>(
        `/file/info?${searchParams}`,
      );

      if (res.status !== 200) {
        return null;
      }
      return res.data[cid];
    } catch (e) {
      if (e.response && e.response.status === 404) {
        return null;
      }
      throw e;
    }
  }

  /**
   * Delete file by cid
   * @param cid ipfs cid
   * @returns delete success or failed
   * @throws storage api error | timeout
   */
  async delete(cid: string): Promise<boolean> {
    try {
      const res = await this.storage.post(
        '/storage/delete',
        JSON.stringify({ cid: cid }),
      );

      return res.status === 200;
    } catch (e) {
      return false;
    }
  }

  async workload(): Promise<WorkloadInfo> {
    const res = await this.storage.get('/workload');
    if (!res || res.status !== 200) {
      throw new Error(`invalid storage response: ${res}`);
    }
    return parseObj(res.data);
  }

  /// READ methods
  /**
   * Query local free storage size
   * @returns (free space size(GB), system free space(GB))
   * @throws storage api error | timeout
   */
  async free(): Promise<[number, number]> {
    const workload = await this.workload();
    return [
      Number(workload.srd.srd_complete) + Number(workload.srd.disk_available),
      Number(workload.srd.sys_disk_available),
    ];
  }

  /// READ methods
  /**
   * Query pendings information
   * @returns pendings json
   */
  // eslint-disable-next-line
  async pendings(): Promise<SealInfoMap> {
    const res = await this.storage.get('/file/info_by_type?type=pending');
    if (res && res.status === 200) {
      return parseObj(res.data);
    }
    throw new Error(`storage request failed with status: ${res.status}`);
  }
}
