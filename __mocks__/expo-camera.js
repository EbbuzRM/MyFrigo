// Mock for expo-camera native module
// Jest cannot load native modules, so we provide a JavaScript mock

module.exports = {
  CameraView: 'CameraView',
  
  useCameraPermissions: jest.fn(() => [
    { 
      granted: true, 
      status: 'granted',
      canAskAgain: true,
      expires: 'never'
    },
    jest.fn().mockResolvedValue({ granted: true, status: 'granted' }), // requestPermission
    jest.fn() // getPermissionsAsync
  ]),
  
  Camera: {
    Constants: {
      Type: { 
        back: 0, 
        front: 1 
      }
    }
  },
  
  BarCodeScanner: {
    Constants: {
      BarCodeType: {
        qr: 'qr',
        ean13: 'ean13',
        ean8: 'ean8',
        upc_e: 'upc_e',
        code128: 'code128',
        code39: 'code39',
        code93: 'code93',
        codabar: 'codabar',
        pdf417: 'pdf417',
        aztec: 'aztec',
        datamatrix: 'datamatrix'
      }
    }
  },
  
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  }
};
