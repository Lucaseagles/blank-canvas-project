import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRubiInterestLabel, rankRubiOffersByInterests } from "./rubi-unified-interest-ranking.ts";
const offers=[
 {productId:"a",category:"Casa e Organização"},
 {productId:"b",category:"Beleza"},
 {productId:"c",category:"Eletrônicos"},
 {productId:"d",category:"Casa e Organização"}
];
test("category names and slugs normalize consistently without guessing intimate attributes",()=>{
 assert.equal(normalizeRubiInterestLabel(" Eletrônicos "), "eletronicos");
 assert.equal(normalizeRubiInterestLabel("Casa e Organização"),"casa-e-organizacao");
});
test("user interest score prioritizes matching approved product categories",()=>{
 const result=rankRubiOffersByInterests(offers,[{name:"Beleza",slug:"beleza",score:8},{name:"Casa e Organização",slug:"casa-e-organizacao",score:4}],4);
 assert.deepEqual(result.map(x=>x.productId),["b","a","d","c"]);
});
test("anonymous and unknown interests preserve diverse editorial order",()=>{
 assert.deepEqual(rankRubiOffersByInterests(offers,[],3).map(x=>x.productId),["a","b","c"]);
 assert.deepEqual(rankRubiOffersByInterests(offers,[{name:"Esportes",slug:"esportes",score:9}],2).map(x=>x.productId),["a","b"]);
});
test("unknown, negative and invalid signals never create positive interest ranking",()=>{
 const invalid=[{name:"Eletrônicos",slug:"eletronicos",score:Number.NaN},{name:"Beleza",slug:"beleza",score:-99}];
 assert.deepEqual(rankRubiOffersByInterests(offers,invalid,4).map(x=>x.productId),["a","b","c","d"]);
});

test("ranking removes repeated SKUs without erasing distinct discovery",()=>{
 const repeated=[offers[1],offers[1],offers[0],offers[2]];
 const ranked=rankRubiOffersByInterests(repeated,[{name:"Beleza",slug:"beleza",score:9}],3);
 assert.deepEqual(ranked.map(x=>x.productId),["b","a","c"]);
});
test("ranking rejects unlimited and invalid shelf sizes safely",()=>{
 assert.deepEqual(rankRubiOffersByInterests(offers,[],0),[]);
 assert.deepEqual(rankRubiOffersByInterests(offers,[],Number.NaN).map(x=>x.productId),["a","b","c","d"]);
 assert.deepEqual(rankRubiOffersByInterests(offers,[],Number.POSITIVE_INFINITY).map(x=>x.productId),["a","b","c","d"]);
});
test("out-of-range interest scores cannot defeat the finite ranking cap",()=>{
 const rows=rankRubiOffersByInterests(offers,[{name:"Eletrônicos",slug:"eletronicos",score:Number.POSITIVE_INFINITY},{name:"Casa e Organização",slug:"casa-e-organizacao",score:1e18}],4);
 assert.deepEqual(rows.map(x=>x.productId),["a","d","b","c"]);
});
