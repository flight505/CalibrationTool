import { z } from 'zod';
import type {
  Phase1LLMResult,
  Phase2LLMResult
} from './doeTypes';

export type StrictJsonSchema = Record<string, unknown>;

const levelArraySchema = z
  .array(z.number().finite())
  .min(3, 'Provide at least three levels')
  .max(3, 'Provide exactly three levels');

export const phase1ResultSchema = z
  .object({
    selectedArray: z.enum(['L9', 'L18', 'L27']),
    factorPlans: z
      .array(
        z.object({
          parameter: z.string().min(1),
          name: z.string().min(1).optional(),
          levels: levelArraySchema,
          unit: z.string().min(1),
          rationale: z.string().min(1),
          slicerSetting: z.string().min(1).optional(),
          citations: z
            .array(z.string().url('Citations must be valid URLs'))
            .min(1)
            .optional()
        })
      )
      .min(1),
    testParts: z.array(z.string().min(1)).min(1),
    printInstructions: z.string().min(1).optional(),
    sourceSummary: z
      .array(
        z.object({
          title: z.string().min(1),
          url: z.string().url(),
          snippet: z.string().min(1).optional()
        })
      )
      .optional(),
    reasoningSummary: z.string().min(1).optional()
  })
  .strict();

export const phase2ResultSchema = z
  .object({
    optimalLevels: z.record(z.union([z.number().finite(), z.string().min(1)])),
    snr: z
      .array(
        z.object({
          factor: z.string().min(1),
          delta: z.number(),
          interpretation: z.string().min(1).optional()
        })
      )
      .min(1),
    mainEffects: z
      .array(
        z.object({
          factor: z.string().min(1),
          trend: z.array(z.number()).min(1),
          notes: z.string().min(1).optional()
        })
      )
      .min(1),
    confirmationRun: z
      .object({
        recommended: z.boolean(),
        settings: z.record(z.union([z.number().finite(), z.string().min(1)])),
        expectedQualityGain: z.number().optional(),
        notes: z.string().min(1).optional()
      })
      .optional(),
    notes: z.string().min(1).optional()
  })
  .strict();

export const phase1JsonSchema: StrictJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['selectedArray', 'factorPlans', 'testParts'],
  properties: {
    selectedArray: {
      type: 'string',
      enum: ['L9', 'L18', 'L27']
    },
    factorPlans: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['parameter', 'levels', 'unit', 'rationale'],
        properties: {
          parameter: { type: 'string' },
          name: { type: 'string' },
          levels: {
            type: 'array',
            items: { type: 'number' },
            minItems: 3,
            maxItems: 3
          },
          unit: { type: 'string' },
          rationale: { type: 'string' },
          slicerSetting: { type: 'string' },
          citations: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      }
    },
    testParts: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' }
    },
    printInstructions: { type: 'string' },
    sourceSummary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'url'],
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          snippet: { type: 'string' }
        }
      }
    },
    reasoningSummary: { type: 'string' }
  }
};

export const phase2JsonSchema: StrictJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['optimalLevels', 'snr', 'mainEffects'],
  properties: {
    optimalLevels: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'number' },
          { type: 'string' }
        ]
      }
    },
    snr: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['factor', 'delta'],
        properties: {
          factor: { type: 'string' },
          delta: { type: 'number' },
          interpretation: { type: 'string' }
        }
      }
    },
    mainEffects: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['factor', 'trend'],
        properties: {
          factor: { type: 'string' },
          trend: {
            type: 'array',
            items: { type: 'number' },
            minItems: 1
          },
          notes: { type: 'string' }
        }
      }
    },
    confirmationRun: {
      type: 'object',
      additionalProperties: false,
      required: ['recommended', 'settings'],
      properties: {
        recommended: { type: 'boolean' },
        settings: {
          type: 'object',
          additionalProperties: {
            anyOf: [
              { type: 'number' },
              { type: 'string' }
            ]
          }
        },
        expectedQualityGain: { type: 'number' },
        notes: { type: 'string' }
      }
    },
    notes: { type: 'string' }
  }
};

export function validatePhase1Result(payload: unknown): Phase1LLMResult {
  return phase1ResultSchema.parse(payload) as Phase1LLMResult;
}

export function validatePhase2Result(payload: unknown): Phase2LLMResult {
  return phase2ResultSchema.parse(payload) as Phase2LLMResult;
}
