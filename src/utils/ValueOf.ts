export type ValueOf<T extends {}> = T[Extract<keyof T, string>];
