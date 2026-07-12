import { z } from 'zod';

export const runSkillScriptSchema = z.object({
  skillName: z
    .string()
    .min(1)
    .describe('Exact name of the skill whose script to run (e.g. "contract-review")'),
  filename: z
    .string()
    .min(1)
    .describe('Script filename within the skill (e.g. "scripts/validate.py")'),
  specializationId: z
    .string()
    .optional()
    .describe(
      "Override specializationId. If omitted, the calling agent's specializationId is used.",
    ),
  input: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('JSON-serializable input passed to the script via input.json'),
  env: z
    .record(z.string(), z.string())
    .optional()
    .describe('Optional allowlisted environment variables for the script'),
  args: z
    .array(z.string().max(256))
    .max(10)
    .optional()
    .describe('Optional CLI arguments passed to the script'),
});
