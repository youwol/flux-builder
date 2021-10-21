/** @format */

export enum Level {
  DEBUG,
  INFO,
  NOTICE,
  WARNING,
  ERROR,
  FATAL,
  ALERT,
  MUTED,
}

export interface Logger {
  debug(message: string, cbPlaceholder?: CbsPlacesHolder): void

  info(message: string, cbPlaceholder?: CbsPlacesHolder): void

  notice(message: string, cbPlaceholder?: CbsPlacesHolder): void

  warning(message: string, cbPlaceholder?: CbsPlacesHolder): void

  error(message: string, cbPlaceholder?: CbsPlacesHolder): void

  fatal(message: string, cbPlaceholder?: CbsPlacesHolder): void

  alert(message: string, cbPlaceholder?: CbsPlacesHolder): void

  factory(subPath: string): Logger
}

type LogFn = (
  level: Level,
  message: string,
  cbPlacesHolder: CbsPlacesHolder,
  context: { name: string },
) => void

export type Backend = {
  id: string
  logFn: LogFn
}

export type PlaceHolderValue = {
  original: unknown
  asString: () => string
}

export type CbPlaceHolder = () => PlaceHolderValue

export type CbsPlacesHolder = CbPlaceHolder[] | CbPlaceHolder
