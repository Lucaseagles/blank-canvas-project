import test from "node:test";
import assert from "node:assert/strict";
import {parseDeploymentOrigin,publicIp,assertPublicDns,probeRoute,runSmoke} from "../../scripts/rubi-live-storefront-smoke.mjs";

test("Only bare HTTPS public origins are accepted",()=>{
 assert.equal(parseDeploymentOrigin("https://loja.example.com/"),"https://loja.example.com");
 for(const bad of ["http://loja.example.com","https://localhost","https://127.0.0.1","https://loja.example.com:8443","https://loja.example.com/secret","https://u:p@loja.example.com","https://loja.example.com?token=x"]){
  assert.throws(()=>parseDeploymentOrigin(bad));
 }
});
test("IP checks deny private, loopback, reserved and allow normal public addresses",()=>{
 for(const ip of ["127.0.0.1","10.0.0.1","172.20.1.2","192.168.1.1","169.254.1.1","203.0.113.1","::1","fe80::1"]){
  assert.equal(publicIp(ip),false,ip);
 }
 assert.equal(publicIp("8.8.8.8"),true);
 assert.equal(publicIp("2606:4700:4700::1111"),true);
});
test("DNS must resolve only public addresses",async()=>{
 await assert.rejects(()=>assertPublicDns("https://loja.example.com",async()=>[{address:"10.0.0.1"}]));
 assert.equal(await assertPublicDns("https://loja.example.com",async()=>[{address:"8.8.8.8"}]),1);
});
test("Public routes reject login redirects and external destinations",async()=>{
 const resp=(status,location,body="x".repeat(120),ct="text/html")=>({status,headers:new Headers({"content-type":ct,...(location?{"location":location}:{})}),text:async()=>body});
 assert.equal((await probeRoute("https://loja.example.com","/hub-shop",async()=>resp(302,"/auth"))).ok,false);
 assert.equal((await probeRoute("https://loja.example.com","/hub-shop",async()=>resp(302,"https://example.org"))).ok,false);
 assert.equal((await probeRoute("https://loja.example.com","/hub-shop",async()=>resp(200,null))).ok,true);
 assert.equal((await probeRoute("https://loja.example.com","/hub-shop",async()=>resp(404,null))).ok,false);
});
test("Smoke labels profile checks as HTTP only, never as login-tested",async()=>{
 const report=await runSmoke("https://loja.example.com",{
  dns:async()=>[{address:"8.8.8.8"}],
  fetchImpl:async()=>({status:200,headers:new Headers({"content-type":"text/html"}),text:async()=>"<html>"+"x".repeat(140)+"</html>"})
 });
 assert.equal(report.public_success,true);
 assert.equal(report.profile_route_responses.length,4);
 assert.match(report.excluded.join(" "),/autenticação real/);
});
