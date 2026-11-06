const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Ensure watchFolders covers monorepo dependencies and apps/mobile, but NOT apps/web
config.watchFolders = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'packages/shared'),
  projectRoot,
];

// 2. Node module resolution paths
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Block apps/web to prevent Metro from slow crawling or colliding with web packages
const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];

config.resolver.blockList = [
  new RegExp(path.resolve(monorepoRoot, 'apps/web').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  ...existingBlockList,
];

// 4. In a monorepo where serverRoot is repo root, redirect standard entry requests (like /index.bundle)
// to /apps/mobile/index.bundle
const originalRewriteRequestUrl = config.server.rewriteRequestUrl;
config.server.rewriteRequestUrl = (url) => {
  let modifiedUrl = originalRewriteRequestUrl ? originalRewriteRequestUrl(url) : url;
  if (modifiedUrl.startsWith('/index.bundle?') || modifiedUrl === '/index.bundle') {
    modifiedUrl = '/apps/mobile' + modifiedUrl;
  }
  return modifiedUrl;
};

module.exports = config;
