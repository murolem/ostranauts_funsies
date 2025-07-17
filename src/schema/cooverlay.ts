import { z } from "zod";

export const cooverlaySchema = z.object({
  strName: z.string(),
  strNameFriendly: z.string(),
  strDesc: z.string().optional(),
  strImg: z.string().optional(),
  strImgNorm: z.string().optional(),
  strPortraitImg: z.string().optional(),
  strCOBase: z.string(),
  strCondLoot: z.null(),
  mapModeSwitches: z.array(z.any()).optional(),
  type: z.any(),
  mapSlotEffects: z.array(z.any()).optional(),
  strImgDamaged: z.string().optional(),
  strNameShort: z.string().optional(),
  aInteractionsReplace: z.array(z.any()).optional(),
  mapGUIPropMaps: z.array(z.any()).optional(),
});
export type CooverlaySchema = z.infer<typeof cooverlaySchema>;
