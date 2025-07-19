import { itemIdSchema } from '$schema/items';
import { z } from "zod";

export const shipItemSchema = z.object({
  strName: itemIdSchema,
  /** Signed float X position. */
  fX: z.number(),
  /** Signed float Y position. */
  fY: z.number(),
  /** rotation in degrees */
  fRotation: z.number().int(),
  /** UUID of some kind.  */
  strID: z.string(),
  bForceLoad: z.boolean().optional(),
  aGPMSettings: z
    .array(
      z.object({
        strName: z.string(),
        dictGUIPropMap: z.array(z.union([z.null(), z.string()])),
      }),
    )
    .optional(),
  strParentID: z.string().optional(),
  strSlotParentID: z.string().optional(),
});

export const shipZoneSchema = z.object({
  strName: itemIdSchema,
  strRegID: z.string(),
  bTriggerOnOwner: z.boolean(),
  aTiles: z.array(z.number().int()),
  aTileConds: z.array(z.string()),
  categoryConds: z.array(z.string()).optional(),
  strPersonSpec: z.string(),
  zoneColor: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
    a: z.number().int(),
  }),
  strTargetPSpec: z.string().optional(),
});

/** situ = "in the place" (latin) = initial position data */
export const shipInitialPositionSchema = z.object({
  boPORShip: z.string(),
  vPosx: z.number(),
  vPosy: z.number(),
  vBOOffsetx: z.number().int(),
  vBOOffsety: z.number().int(),
  vVelX: z.number(),
  vVelY: z.number(),
  vAccIn: z.object({ x: z.number().int(), y: z.number().int() }),
  vAccRCS: z.object({ x: z.number().int(), y: z.number().int() }),
  vAccEx: z.object({ x: z.number().int(), y: z.number().int() }),
  fRot: z.number().int(),
  fW: z.number().int(),
  fA: z.number().int(),
  bBOLocked: z.boolean(),
  bIsBO: z.boolean(),
  bIsRegion: z.boolean(),
  bIsNoFees: z.boolean(),
  size: z.number().int(),
  fPathLastEpoch: z.number().int().optional(),
  aPathRecentT: z.array(z.number()).optional(),
  aPathRecentX: z.array(z.number()).optional(),
  aPathRecentY: z.array(z.number()).optional(),
  vAccLift: z
    .object({ x: z.number().int(), y: z.number().int() })
    .optional(),
  vAccDrag: z
    .object({ x: z.number().int(), y: z.number().int() })
    .optional(),
  bOrbitLocked: z.boolean().optional(),
  bIgnoreGrav: z.boolean().optional(),
});

export const shipRoomSchema = z.object({
  strID: z.string(),
  bVoid: z.boolean(),
  aTiles: z.array(z.number().int()),
  roomSpec: z.string(),
  roomValue: z.number(),
});

export const shipCondownerSchema = z.object({
  strID: z.string(),
  strCODef: z.string(),
  bAlive: z.boolean(),
  aConds: z.array(z.string()),
  strCondID: z.string(),
  inventoryX: z.number().int(),
  inventoryY: z.number().int(),
  fDGasTemp: z.number().int(),
  fLastICOUpdate: z.number(),
  nDestTile: z.number().int(),
  strIdleAnim: z.string(),
  strFriendlyName: z.string(),
  strRegIDLast: z.string(),
  aMyShips: z.array(z.string()).optional(),
  fMSRedamageAmount: z.number().int().optional(),
});

export const shipConstructionTemplateSchema = z.object({
  nProgress: z.number().int(),
  fConstructionTime: z.number().int().optional(),
  aItems: z.array(
    shipItemSchema
  ),
  aShallowPSpecs: z.array(
    shipItemSchema
  ),
});

export const shipSchema = z.object({
  strName: itemIdSchema,
  strRegID: z.string(),
  nCurrentWaypoint: z.number().int(),
  fTimeEngaged: z.number(),
  fWearManeuver: z.number().int(),
  fWearAccrued: z.number().int(),
  aItems: z.array(
    shipItemSchema
  ),
  vShipPos: z.object({ x: z.number().int(), y: z.number().int() }),
  objSS: shipInitialPositionSchema,
  aRooms: z.array(
    shipRoomSchema
  ),
  DMGStatus: z.number().int(),
  fLastVisit: z.number().int(),
  fAIDockingTimer: z.number().int().optional(),
  fAIPauseTimer: z.number().int(),
  bPrefill: z.boolean(),
  bNoCollisions: z.boolean(),
  dLastScanTime: z.number().int(),
  bLocalAuthority: z.boolean(),
  bAIShip: z.boolean(),
  make: z.string(),
  model: z.string(),
  year: z.string(),
  origin: z.string(),
  description: z.string(),
  designation: z.string(),
  publicName: z.string(),
  dimensions: z.string(),
  fShallowMass: z.number(),
  fShallowRCSRemass: z.number(),
  fShallowRCSRemassMax: z.number(),
  fShallowFusionRemain: z.number(),
  fBreakInMultiplier: z.number().int(),
  nRCSCount: z.number().int(),
  nRCSDistroCount: z.number().int(),
  nDockCount: z.number().int(),
  bFusionTorch: z.boolean(),
  bXPDRAntenna: z.boolean(),
  bShipHidden: z.boolean(),
  nO2PumpCount: z.number().int(),
  shipCO: shipCondownerSchema.optional(),
  fAIDockingExpire: z.number().int().optional(),
  fLastQuotedPrice: z.number().int().optional(),
  commData: z.object({
    dClearanceRequestTime: z.number().int(),
    dClearanceIssueTimestamp: z.number().int(),
    bClearanceSquawkID: z.boolean(),
  }).optional(),
  aShallowPSpecs: z.array(
    shipItemSchema
  ).optional(),
  fFirstVisit: z.number().int().optional(),
  bBreakInUsed: z.boolean().optional(),
  fFusionThrustMax: z.number().optional(),
  fFusionPelletMax: z.number().int().optional(),
  fEpochNextGrav: z.number().optional(),
  fShallowRotorStrength: z.number().int().optional(),
  fAeroCoefficient: z.number().int().optional(),
  bIsUnderConstruction: z.boolean().optional(),
  ShipType: z.number().int().optional(),
  nConstructionProgress: z.number().int().optional(),
  nInitConstructionProgress: z.number().int().optional(),
  strXPDR: z.string().optional(),
  aZones: z.array(
    shipZoneSchema
  ).optional(),
  aConstructionTemplates: z.array(
    shipConstructionTemplateSchema
  ).optional(),
  strTemplateName: z.string().optional(),
  aMarketConfigs: z.record(z.string(), itemIdSchema).optional(),
  aBGXs: z.array(z.array(z.number())).optional(),
  aBGYs: z.array(z.array(z.number())).optional(),
  aBGNames: z.array(z.string()).optional(),
  strLaw: z.string().optional(),
});
export type ShipSchema = z.infer<typeof shipSchema>;
