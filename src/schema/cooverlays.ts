import { z } from "zod";

export const cooverlaysSchema = z.array(
  z.object({
    strName: z.string(),
    strNameFriendly: z.string().optional(),
    strDesc: z.string().optional(),
    strImg: z.string().optional(),
    strImgNorm: z.string().optional(),
    strPortraitImg: z.string().optional(),
    strCOBase: z.string(),
    strCondLoot: z.union([z.null(), z.string()]),
    mapModeSwitches: z.array(z.string()).optional(),
    mapSlotEffects: z.array(z.string()).optional(),
    strImgDamaged: z.string().optional(),
    strNameShort: z.string().optional(),
    aInteractionsReplace: z.array(z.string()).optional(),
    mapGUIPropMaps: z.array(z.string()).optional(),
    strItemDef: z.string().optional(),
    strDmgColor: z.string().optional(),
    aDestSwaps: z.array(z.string()).optional(),
  }),
);
export type CooverlaysSchema = z.infer<typeof cooverlaysSchema>;
