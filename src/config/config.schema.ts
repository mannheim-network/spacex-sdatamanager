import Joi = require('joi');
import { SDataManagerConfig } from '../types/sdatamanager-config';
import { createChildLogger } from '../utils/logger';

const chainConfigSchema = Joi.object().keys({
  account: Joi.string().required(),
  endPoint: Joi.string().required(),
});

const storageConfigSchema = Joi.object().keys({
  endPoint: Joi.string().required(),
});

const ipfsConfigSchema = Joi.object().keys({
  endPoint: Joi.string().required(),
});

const nodeConfigSchema = Joi.object().keys({
  role: Joi.string().allow('member', 'isolation'),
});

const telemetryConfigSchema = Joi.object().keys({
  endPoint: Joi.string().required(),
});

const strategyWeightsSchema = Joi.object().keys({
  existedFilesWeight: Joi.number().default(0),
  dbFilesWeight: Joi.number().default(0),
  newFilesWeight: Joi.number().default(100),
});

const schedulerConfig = Joi.object().keys({
  strategy: Joi.alternatives(
    'default',
    'srdFirst',
    'newFileFirst',
    strategyWeightsSchema,
  ).default('default'),
  minSrdRatio: Joi.number().min(0).max(100).default(70),
  maxPendingTasks: Joi.number().min(1).default(32),
  minFileSize: Joi.number().min(0).default(0),
  maxFileSize: Joi.number().min(0).default(0),
  minReplicas: Joi.number().min(0).default(40),
  maxReplicas: Joi.number().min(0).default(100),
});

const sealCoordinatorConfig = Joi.object().keys({
  endPoint: Joi.string().required(),
  nodeUUID: Joi.string().required(),
  authToken: Joi.string().default(''),
});

const configSchema = Joi.object()
  .keys({
    chain: chainConfigSchema.required(),
    storage: storageConfigSchema.required(),
    ipfs: ipfsConfigSchema.required(),
    node: nodeConfigSchema.required(),
    telemetry: telemetryConfigSchema.required(),
    dataDir: Joi.string().default('data').required(),
    scheduler: schedulerConfig.required(),
    sealCoordinator: sealCoordinatorConfig,
  })
  .unknown();

const logger = createChildLogger({
  moduleId: 'config',
});

export function validateConfig(config: unknown): SDataManagerConfig {
  const r = configSchema.validate(config, {
    allowUnknown: true,
  });
  if (r.error) {
    logger.error('invalid config', r.error.message);
    for (const details of r.error.details) {
      logger.error(details.message);
    }
    throw new Error('invalid config');
  }
  return r.value as SDataManagerConfig;
}
