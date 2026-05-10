// bridgeless.config.js — bridgeless.config module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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