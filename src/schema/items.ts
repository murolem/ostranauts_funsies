import { z } from "zod";

export const itemsSchema = z.array(
  z.object({
    strName: z.string(),
    strImg: z.string(),
    strImgNorm: z.string(),
    strImgDamaged: z.string().optional(),
    strDmgColor: z.string().optional(),
    nDmgMode: z.number().int().optional(),
    fDmgCut: z.number().optional(),
    fDmgTrim: z.number().optional(),
    fDmgIntensity: z.number().optional(),
    fDmgComplexity: z.number().int().optional(),
    bLerp: z.boolean().optional(),
    bSinew: z.boolean().optional(),
    nCols: z.number().int(),
    aSocketAdds: z.array(z.string()),
    aSocketForbids: z.array(z.string()),
    aSocketReqs: z.array(z.string()),
    fZScale: z.number().optional(),
    aShadowBoxes: z.array(z.string()).optional(),
    aLights: z.array(z.string()).optional(),
    bHasSpriteSheet: z.boolean().optional(),
    ctSpriteSheet: z.string().optional(),
  }),
);
export type ItemsSchema = z.infer<typeof itemsSchema>;
export type ItemSchema = ItemsSchema[number];