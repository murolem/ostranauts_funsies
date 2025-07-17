import { z } from "zod";

export const installablesSchema = z.array(
  z.object({
    strName: z.string(),
    strActionCO: z.string(),
    strActionGroup: z.string(),
    strTooltip: z.string(),
    strInteractionTemplate: z.string(),
    CTThem: z.string(),
    aInputs: z.array(z.string()),
    fTargetPointRange: z.number(),
    fDuration: z.number(),
    bSparks: z.boolean().optional(),
    aToolCTsUse: z.array(z.string()).optional(),
    aLootCOs: z.array(z.string()).optional(),
    strStartInstall: z.string().optional(),
    strBuildType: z.string().optional(),
    strJobType: z.string(),
    bNoJobMenu: z.boolean().optional(),
    strAllowLootCTsUs: z.string(),
    strAllowLootCTsThem: z.string(),
    strProgressStat: z.string(),
    strCTThemMultCondTools: z.string().optional(),
    strCTThemMultCondUs: z.string(),
    bHeadless: z.boolean().optional(),
    aInverse: z.array(z.any()).optional(),
    strLootOut: z.string().optional(),
    CTTestUs: z.string().optional(),
  }),
);
export type InstallablesSchema = z.infer<typeof installablesSchema>;
