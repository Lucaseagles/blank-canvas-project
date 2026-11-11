import test from "node:test";
import assert from "node:assert/strict";
import {requiresSupplierCheckoutReverification,mayChangeSupplierCheckoutHost} from "./rubi-supplier-host-safety.ts";

test("Supplier checkout hostname changes cannot silently retain verified products",()=>{
 assert.equal(requiresSupplierCheckoutReverification("pay.example.com","pay.other.com"),true);
 assert.equal(mayChangeSupplierCheckoutHost("pay.example.com","pay.other.com",1),false);
 assert.equal(mayChangeSupplierCheckoutHost("pay.example.com",null,1),false);
 assert.equal(mayChangeSupplierCheckoutHost("pay.example.com","pay.other.com",0),true);
});
test("Same hostname, including case/whitespace normalization, does not require reapproval",()=>{
 assert.equal(requiresSupplierCheckoutReverification("Pay.Example.com"," pay.example.com "),false);
 assert.equal(mayChangeSupplierCheckoutHost("Pay.Example.com"," pay.example.com ",5),true);
});
test("An empty supplier can receive its first checkout domain",()=>{
 assert.equal(mayChangeSupplierCheckoutHost(null,"pay.example.com",0),true);
});
