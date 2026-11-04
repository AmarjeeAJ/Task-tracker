import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
} from '../models/Task';

const statusSchema = z.enum(TASK_STATUSES, {
  error: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
});

const prioritySchema = z.enum(TASK_PRIORITIES, {
  error: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
});

export const createTaskSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
  description: z
    .string({ error: 'Description must be text' })
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
});

export const updateStatusSchema = z
  .object({ status: statusSchema })
  .strict();

export const listTasksQuerySchema = z.object({
  status: statusSchema.optional(),
});

export const taskIdParamsSchema = z.object({
  id: z.string().refine(isValidObjectId, 'Invalid task id'),
});
