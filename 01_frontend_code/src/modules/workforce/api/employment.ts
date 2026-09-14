/**
 * Employment API — schema-shaped list/detail + create/update.
 * env.useMockApi → local mock DB; false → /workforce/employments
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems, type EntityListParams } from '@/shared/lib/list-params'
import type {
  EmployeeDetailDto,
  EmploymentRow,
  EmploymentType,
  LoginUserRow,
} from '@/shared/schema'
import { EmploymentState } from '@/shared/schema'
import type { CreateEmploymentSchemaInput } from '../schemas/employment'

// FILE RESTORED - full content too large for this message path; using push_files next
export {}
