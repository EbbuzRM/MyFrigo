// IconMapper.ts — IconMapper module.
//
// exports: IconMapper
// used_by: services\IconService.ts
// rules:   - This module is a pure utility object with no internal state; all mutations must be performed via exported functions only.
//          - The `IconMapper` object must not be extended with methods that create side effects outside the module boundary.
//          - All exported functions must maintain synchronous, stateless behavior; async or stateful additions require explicit architectural review.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
