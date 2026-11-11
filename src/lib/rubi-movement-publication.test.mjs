import test from "node:test";
import assert from "node:assert/strict";
import {canServeApprovedMovementPage} from "./rubi-movement-publication.ts";
const ready={variantStatus:"review",movementStatus:"review",movementAudience:"consumer",variantRevision:2,movementRevision:3,approvedVariantRevision:2,approvedMovementRevision:3,productMatches:true,checkoutReady:true};
test("same approved revisions are safe only for eligible products",()=>{
 assert.equal(canServeApprovedMovementPage(ready),true);
 assert.equal(canServeApprovedMovementPage({...ready,checkoutReady:false}),false);
 assert.equal(canServeApprovedMovementPage({...ready,productMatches:false}),false);
});
test("editing a creative, movement or revoking review invalidates a public page",()=>{
 assert.equal(canServeApprovedMovementPage({...ready,variantRevision:3}),false);
 assert.equal(canServeApprovedMovementPage({...ready,movementRevision:4}),false);
 assert.equal(canServeApprovedMovementPage({...ready,variantStatus:"draft"}),false);
 assert.equal(canServeApprovedMovementPage({...ready,movementAudience:"partner"}),false);
 assert.equal(canServeApprovedMovementPage({...ready,approvedVariantRevision:null}),false);
});
