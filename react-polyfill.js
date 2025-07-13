// Polyfill per React 19 compatibility
import React from 'react';

// Assicuriamoci che useEffect sia disponibile globalmente
if (typeof global !== 'undefined') {
  global.React = React;
  global.useEffect = React.useEffect;
  global.useState = React.useState;
  global.useCallback = React.useCallback;
  global.useMemo = React.useMemo;
  global.useRef = React.useRef;
  global.useContext = React.useContext;
}

export default React;
