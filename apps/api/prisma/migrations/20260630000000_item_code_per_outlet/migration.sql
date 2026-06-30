-- Item codes are unique per outlet, not globally. This lets each branch number
-- its own categories independently (e.g. PAS0001 can exist in two outlets)
-- instead of the second branch continuing the first branch's sequence.
DROP INDEX "ornaments_itemCode_key";

CREATE UNIQUE INDEX "ornaments_outletId_itemCode_key" ON "ornaments"("outletId", "itemCode");
