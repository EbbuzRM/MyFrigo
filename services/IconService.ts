import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';


const PEXELS_API_KEY = Constants.expoConfig?.extra?.pexelsApiKey;
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

const iconDir = FileSystem.documentDirectory + 'category-icons/';

// Assicura che la directory per le icone esista
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(iconDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(iconDir, { intermediates: true });
  }
}

// Cerca un'icona su Pexels e la scarica, restituendo solo l'URI locale.
async function fetchIconForCategory(categoryName: string): Promise<string | null> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
    console.warn('Pexels API key not configured in app.json. Skipping icon download.');
    return null;
  }

  console.log(`[IconService] Attempting to fetch icon with API Key: "${PEXELS_API_KEY}"`);

  try {
    const searchQuery = `${categoryName} food object`;
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=1&size=small&orientation=square`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Pexels API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      const imageUrl = photo.src.small;
      const fileUri = iconDir + `${categoryName.replace(/\s+/g, '_')}_${photo.id}.jpg`;

      await ensureDirExists();
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (downloadResult.status === 200) {
        console.log(`Icon for '${categoryName}' downloaded to: ${downloadResult.uri}`);
        return downloadResult.uri;
      }
    }
    return null;
  } catch (error) {
    console.error('Error downloading icon:', error);
    return null;
  }
}

export const IconService = {
  fetchIconForCategory,
};
