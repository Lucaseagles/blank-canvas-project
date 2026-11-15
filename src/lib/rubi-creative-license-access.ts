/** Select only a currently licensed, product-bound creative from a fresh server response.
 * The server must independently enforce the partner's profile, grants and license.
 */
export type RubiLicensedAssetRef={id:string;productId:string;channel:string;validUntil:string};
export function selectFreshRubiLicensedAsset<T extends RubiLicensedAssetRef>(
 items:readonly T[],variantId:string,productId:string,channel:string,now=Date.now()
):T|null{
 if(!Number.isFinite(now))return null;
 return items.find(item=>item.id===variantId&&item.productId===productId&&item.channel===channel
  &&Number.isFinite(Date.parse(item.validUntil))&&Date.parse(item.validUntil)>now)??null;
}
