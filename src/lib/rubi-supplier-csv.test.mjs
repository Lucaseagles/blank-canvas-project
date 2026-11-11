import test from "node:test";
import assert from "node:assert/strict";
import {parseRubiSupplierCsv,parseRubiCsvMatrix,RUBI_CSV_TEMPLATE} from "./rubi-supplier-csv.ts";
test("Valid UTF8 CSV rows import as drafts without supplier checkout approval",()=>{
 const csv=RUBI_CSV_TEMPLATE+'"Produto Exemplo","Descrição, com vírgula",Categoria,SKU1,49.90,20.10,\n';
 const v=parseRubiSupplierCsv(csv);
 assert.equal(v.headerErrors.length,0);assert.equal(v.rows.length,1);
 assert.equal(v.rows[0].draft?.title,"Produto Exemplo");
 assert.equal(v.rows[0].draft?.description,"Descrição, com vírgula");
 assert.equal(Object.hasOwn(v.rows[0].draft,"checkout_verified"),false);
 assert.equal(Object.hasOwn(v.rows[0].draft,"checkout_url"),false);
});
test("Reject duplicate SKUs, ambiguous currency, fake columns and invalid URLs",()=>{
 const h=RUBI_CSV_TEMPLATE;
 assert.equal(parseRubiSupplierCsv(h+"Produto A,x,,ABC,49.90,20.00,\nProduto B,x,,abc,20.00,5.00,\n").rows[1].draft,null);
 assert.equal(parseRubiSupplierCsv(h+"Produto A,x,,ABC,\"1.299,00\",20.00,\n").rows[0].draft,null);
 assert.equal(parseRubiSupplierCsv(h+"Produto A,x,,ABC,49.90,20.00,http://bad.example.com/a.jpg\n").rows[0].draft,null);
 assert.equal(parseRubiSupplierCsv("title,secret,retail_price,supplier_cost\nX,evil,20.00,1.00").headerErrors.length,1);
});
test("Quoted new lines and escaped quotation marks are parsed correctly",()=>{
 const m=parseRubiCsvMatrix('title,description\n"Produto A","Texto ""explicativo""\ncontinua"');
 assert.equal(m.length,2);
 assert.match(m[1][1],/explicativo/);
});
test("Hard cap prevents oversized bulk operations",()=>{
 assert.throws(()=>parseRubiSupplierCsv(RUBI_CSV_TEMPLATE+"Produto X,x,,X,10.00,3.00,\n".repeat(51)),/50 produtos/);
});
