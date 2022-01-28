import { Logger } from 'winston';
import { AppContext } from '../types/context';
import { SimpleTask } from '../types/tasks';
import { formatError } from '../utils';
import { makeIntervalTask } from './task-utils';

async function handleUpdate(context: AppContext, logger: Logger) {
  const { api } = context;
  try {
    const storageIdentity = await api.storageIdentity();
    if (!storageIdentity) {
      logger.warn('⚠️ no storage identity');
      return;
    }
    const groupOwner = storageIdentity.group;
    if (!groupOwner) {
      logger.warn('⚠️ Wait for the node to join group');
      context.groupInfo = null;
      return;
    }
    if (api.getChainAccount() === groupOwner) {
      logger.error("💥 Can't use owner account to configure isolation/member");
      context.groupInfo = null;
      return;
    }

    // Get group members
    const members = await api.groupMembers(groupOwner);
    members.sort();
    const nodeIndex = members.indexOf(api.getChainAccount());
    context.groupInfo = {
      groupAccount: groupOwner,
      totalMembers: members.length,
      nodeIndex,
    };
  } catch (e) {
    logger.error('failed updating group info: %s', formatError(e));
    context.groupInfo = null;
  }
}

export async function createGroupInfoUpdateTask(
  context: AppContext,
  loggerParent: Logger,
): Promise<SimpleTask> {
  const updateInterval = 1 * 60 * 1000; // update group info every minute
  return makeIntervalTask(
    30 * 1000,
    updateInterval,
    'group-info',
    context,
    loggerParent,
    handleUpdate,
    false,
  );
}
