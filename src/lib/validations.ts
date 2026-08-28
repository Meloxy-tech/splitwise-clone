import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  memberEmails: z.array(z.string().email()).default([]),
});

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(200),
    amount: z.number().positive("Amount must be greater than 0"),
    paidById: z.string().min(1),
    splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE"]).default("EQUAL"),
    date: z.string().optional(),
    notes: z.string().max(500).optional(),
    // Required when splitType is EXACT or PERCENTAGE. Ignored for EQUAL
    // (equal shares are computed server-side from the group's members).
    splits: z
      .array(
        z.object({
          userId: z.string().min(1),
          value: z.number(), // dollars for EXACT, 0-100 for PERCENTAGE
        })
      )
      .optional(),
  })
  .refine(
    (data) => data.splitType === "EQUAL" || (data.splits && data.splits.length > 0),
    { message: "Splits are required for EXACT or PERCENTAGE split types", path: ["splits"] }
  );

export const settleSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().positive(),
});
