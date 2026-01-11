/**
 * Data Module
 * Input parsing and data handling
 */

export {
  detectInputFormat,
  detectDataSource,
  parseDelimitedData,
  parseMarkdownTable,
  parseKeywordInput,
  parseScreenshotDescription,
  assessDataConfidence,
  type InputFormat,
  type ParsedTable,
} from './input-parser';
