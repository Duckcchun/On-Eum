/// <reference types="react-native" />

// Module declarations for packages without types
declare module 'react-native-fs' {
  export const DocumentDirectoryPath: string;
  export function writeFile(path: string, content: string, encoding?: string): Promise<void>;
  export function readFile(path: string, encoding?: string): Promise<string>;
  export function exists(path: string): Promise<boolean>;
  export function unlink(path: string): Promise<void>;
}
