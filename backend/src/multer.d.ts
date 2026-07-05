declare module 'multer' {
  import { Request } from 'express';
  function multer(options?: any): any;
  namespace multer {
    function diskStorage(options: {
      destination?: string | ((req: any, file: any, cb: (error: Error | null, destination: string) => void) => void);
      filename?: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => void;
    }): any;
    function memoryStorage(): any;
  }
  export = multer;
}
