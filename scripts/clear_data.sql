UPDATE "InventoryLedger" SET "donorProviderId" = NULL, "recipientFamilyId" = NULL, "recipientProviderId" = NULL;
DELETE FROM "AffectedFamily";
DELETE FROM "BroadcastAlert";
DELETE FROM "HelpProviderIncident";
