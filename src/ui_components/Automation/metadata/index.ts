export * from './types';

// Static definitions are removed in favor of dynamic backend fetching.
export const APP_DEFINITIONS: any[] = [];
export const getAppDefinition = (_id: string) => undefined;
