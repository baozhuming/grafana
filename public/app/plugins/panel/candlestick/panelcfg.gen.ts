// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     TSTypesJenny
//     PluginTSTypesJenny
//
// Run 'make gen-cue' from repository root to regenerate.

import * as common from '@grafana/schema';

export const PanelCfgModelVersion = Object.freeze([0, 0]);

/**
 * TODO docs
 */
export enum VizDisplayMode {
  Candles = 'candles',
  CandlesVolume = 'candles+volume',
  Volume = 'volume',
}

/**
 * TODO docs
 */
export enum CandleStyle {
  Candles = 'candles',
  OHLCBars = 'ohlcbars',
}

/**
 * TODO docs
 * "open-close":  up/down color depends on current close vs current open
 * filled always
 * "close-close": up/down color depends on current close vs prior close
 * filled/hollow depends on current close vs current open
 */
export enum ColorStrategy {
  CloseClose = 'close-close',
  OpenClose = 'open-close',
}

/**
 * TODO docs
 */
export interface CandlestickFieldMap {
  close?: string;
  high?: string;
  low?: string;
  open?: string;
  volume?: string;
}

/**
 * TODO docs
 */
export interface CandlestickColors {
  down: string;
  flat: string;
  up: string;
}

export const defaultCandlestickColors: Partial<CandlestickColors> = {
  down: 'red',
  flat: 'gray',
  up: 'green',
};

export interface PanelOptions extends common.OptionsWithLegend {
  /**
   * TODO docs
   */
  candleStyle: CandleStyle;
  /**
   * TODO docs
   */
  colorStrategy: ColorStrategy;
  /**
   * TODO docs
   */
  colors: CandlestickColors;
  /**
   * TODO docs
   */
  fields: CandlestickFieldMap;
  /**
   * When enabled, all fields will be sent to the graph
   */
  includeAllFields?: boolean;
  /**
   * TODO docs
   */
  mode: VizDisplayMode;
}

export const defaultPanelOptions: Partial<PanelOptions> = {
  candleStyle: CandleStyle.Candles,
  colorStrategy: ColorStrategy.OpenClose,
  fields: {},
  includeAllFields: false,
  mode: VizDisplayMode.CandlesVolume,
};

export interface PanelFieldConfig extends common.GraphFieldConfig {}
