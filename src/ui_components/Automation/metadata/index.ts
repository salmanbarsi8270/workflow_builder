import { gmail } from './apps/gmail';
import { sheets } from './apps/sheets';
import { drive } from './apps/drive';
import { docs } from './apps/docs';
import { github } from './apps/github';
import { outlook } from './apps/outlook';
import { onedrive } from './apps/onedrive';
import { excel } from './apps/excel';
import { word } from './apps/word';
import { logic } from './apps/logic';
import { utility } from './apps/utility';
import { schedule } from './apps/schedule';
import { http } from './apps/http';
import type { AppDefinition } from './types';

export * from './types';

export const APP_DEFINITIONS: AppDefinition[] = [
  logic,
  utility,
  schedule,
  gmail,
  sheets,
  drive,
  docs,
  github,
  outlook,
  onedrive,
  excel,
  word,
  http
];

export const getAppDefinition = (id: string) => APP_DEFINITIONS.find(app => app.id === id);
