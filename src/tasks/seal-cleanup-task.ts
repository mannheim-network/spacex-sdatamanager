import _ from 'lodash';
import { Logger } from 'winston';
import { createConfigOps } from '../db/configs';
import { createPinRecordOperator } from '../db/pin-record';
import { AppContext } from '../types/context';
import { SimpleTask } from '../types/tasks';
import { Dayjs } from '../utils/datetime';
import { makeIntervalTask } from './task-utils';

const KeyLastSealTaskCleanupTime = 'seal-cleanup:LastCleanupTime';
const CleanupInterval = Dayjs.duration({
  days: 2,
}).asSeconds();

/**
 * task to cleanup seal tasks from unknow source
 * a task is from unknown source if it's in storage's sealing queue
 * but there is no pending pin record for it.
 */
async function handleTick(context: AppContext, logger: Logger) {
  const { database, storageApi } = context;
  const configOps = createConfigOps(database);
  const lastCleanupTime = await configOps.readTime(KeyLastSealTaskCleanupTime);
  if (!lastCleanupTime) {
    logger.info(
      'first time run, there is no last cleanup time record in database',
    );
    await configOps.saveTime(KeyLastSealTaskCleanupTime, Dayjs());
    return;
  }
  const cleanupDuration = Dayjs.duration(Dayjs().diff(lastCleanupTime));
  if (cleanupDuration.asSeconds() < CleanupInterval) {
    logger.info(
      'skip cleanup, last cleanup: %s',
      cleanupDuration.humanize(true),
    );
    return;
  }
  const pinRecordOps = createPinRecordOperator(database);
  const pendingFiles = await storageApi.pendings();
  const pendingPins = await pinRecordOps.getSealingRecords();
  const pendingPinMap = _.keyBy(pendingPins, (p) => p.cid);
  const unknownPins = _.chain(pendingFiles)
    .keys()
    .filter((cid) => {
      return !_.has(pendingPinMap, cid);
    })
    .value();
  for (const cid of unknownPins) {
    logger.info('removing "%s" from storage', cid);
    await storageApi.sealEnd(cid);
  }
  logger.info(
    "%d seal tasks are removed from storage's sealing queue",
    _.size(unknownPins),
  );
  await configOps.saveTime(KeyLastSealTaskCleanupTime, Dayjs());
}

export async function createSealCleanupTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const cleanupInterval = Dayjs.duration({
    hours: 1,
  }).asMilliseconds();
  return makeIntervalTask(
    60 * 1000,
    cleanupInterval,
    'seal-cleanup',
    context,
    loggerParent,
    handleTick,
  );
}
