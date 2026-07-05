import { type FieldValues, type ResolverOptions, type ResolverResult } from "react-hook-form";
import { type ZodType, type ZodError } from "zod";

type ZodV4Resolver = <T extends FieldValues>(
  schema: ZodType<T>
) => (values: T, _context: undefined, options: ResolverOptions<T>) => ResolverResult<T>;

export const zodV4Resolver: ZodV4Resolver = (schema) => (values) => {
  const result = schema.safeParse(values);

  if (result.success) {
    return { values: result.data as never, errors: {} as never };
  }

  const fieldErrors: Record<string, { type: string; message: string }> = {};
  for (const issue of (result.error as ZodError).issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : issue.code;
    if (!fieldErrors[path]) {
      fieldErrors[path] = { type: issue.code, message: issue.message };
    }
  }

  return { values: {} as never, errors: fieldErrors as never };
};
