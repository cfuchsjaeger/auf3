// Varianten der App. Standard: die echte App aus app.json.
// APP_VARIANT=lokal: Testbuild für das kostenlose Apple-Konto per Xcode. Eigene Bundle-ID und
// eigener Name, damit die saubere ID com.cfuchsjaeger.auf3 für die spätere Store-Version frei bleibt.
module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'lokal') return config;
  return {
    ...config,
    name: 'Auf 3 Test',
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}.lokal` },
    android: { ...config.android, package: `${config.android.package}.lokal` },
  };
};
