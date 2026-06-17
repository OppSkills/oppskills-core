const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// Disable native file watcher for Node 22+ compatibility on Windows, but we MUST watch the workspaceRoot.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force polling watcher to avoid Node 22 fs.watch issues on Windows.
config.watcher = {
  useNativeDriver: false,
  usePolling: true,
  healthCheck: {
    enabled: true,
    interval: 5000,
    timeout: 5000,
    maximumWatcherInstances: 200,
  },
};

// Keep React and React Native singletons to avoid invalid hook call crashes.
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

module.exports = config;

