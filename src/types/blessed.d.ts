declare module 'neo-blessed' {
  import * as blessed from 'blessed';
  export = blessed;
}

declare module 'blessed-contrib' {
  export function gauge(options: any): any;
  export function line(options: any): any;
  export function bar(options: any): any;
  export function table(options: any): any;
}