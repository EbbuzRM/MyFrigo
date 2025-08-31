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
