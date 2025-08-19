// Configurazione per la modalità bridgeless di React Native
module.exports = {
  // Disabilita la modalità bridgeless per risolvere il problema di avvio
  useBridgeless: false,
  
  // Configurazioni aggiuntive per la modalità bridgeless quando sarà abilitata
  bridgelessConfig: {
    // Queste configurazioni verranno utilizzate quando useBridgeless sarà impostato su true
    enableSurfacesForBridgeless: false,
    enableAppRegistryForBridgeless: false,
  }
};