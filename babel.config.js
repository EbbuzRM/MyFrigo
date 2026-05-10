// babel.config.js — babel.config module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

module.exports = function(api) {
  api.cache(true);

  // Definiamo un alias di base
  const baseAliases = {
    '@': './',
  };

  // Se siamo in ambiente di test, aggiungiamo l'alias per mockare supabaseClient
  if (process.env.NODE_ENV === 'test') {
    baseAliases['@/services/supabaseClient'] = './services/supabaseClient.test';
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: baseAliases,
        },
      ],
    ],
  };
};
