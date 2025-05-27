declare module 'editorjs-parser' {
  import type { OutputData } from '@editorjs/editorjs';

  export default class EditorJSParser {
    constructor();
    parse(data: OutputData): string;
  }
} 