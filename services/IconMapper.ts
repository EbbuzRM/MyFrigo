import { IconData } from './IconLoader';

export const IconMapper = {
  mapIconToCategory(iconData: IconData[], categoryId: string): IconData | null {
    return iconData.find(icon => icon.categoryId === categoryId) || null;
  },

  validateIconUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const urlRegex = /^(https?:\/\/|data:image\/)/;
    return urlRegex.test(url) && url.length < 500;
  },

  enhanceIconWithDefaults(icon: IconData): IconData {
    if (!this.validateIconUrl(icon.url)) {
      icon.url = 'default-icon-url';
    }
    return icon;
  },
};
