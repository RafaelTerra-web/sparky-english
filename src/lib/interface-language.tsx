"use client";
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
type Locale = 'pt-BR' | 'en';
let locale:Locale='pt-BR';
let dictionary:Record<string,string>={};
let loaded=false;
const listeners=new Set<()=>void>();
const cache=new Map<string,string>();
let templates:{pattern:RegExp;target:string}[]=[];
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
const escape=(text:string)=>text.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
export function translate(text:string):string {
 if(locale!=='en')return text;
 const normalized=text.replace(/\s+/g,' ').trim();
 const pad=(value:string)=> (text.startsWith(" ")?" ":"")+value+(text.endsWith(" ")?" ":"");
 const cached=cache.get(normalized);if(cached)return pad(cached);
 let result=dictionary[normalized];
 if(!result){for(const {pattern,target} of templates){const match=pattern.exec(normalized);if(match){result=target.replace(/\{(\d+)\}/g,(_,i)=>dictionary[match[Number(i)+1]]??match[Number(i)+1]);break;}}}
 result=result??normalized;
 if(cache.size>10000)cache.clear();cache.set(normalized,result);
 return pad(result);
}
export function t<T extends ReactNode>(value:T):T {return (typeof value==='string'?(value.trim() ? ' '+translate(value).trim()+' ' : value):Array.isArray(value)?value.map(v=>t(v)):value) as T;}
export function localizeAttribute<T extends string|undefined>(value:T):T {return localizeAttributeValue(value) as T;}
function localizeAttributeValue(value:string|undefined){return value===undefined?undefined:translate(value);}
export async function setInterfaceLanguage(next:Locale,userId?:string){
 if(next==='en'&&!loaded){const response=await fetch('/locales/en.json');if(!response.ok)throw new Error('Não foi possível carregar o inglês. Tente novamente.');dictionary=await response.json();loaded=true;
 templates=Object.entries(dictionary).filter(([key])=>/\{\d+\}/.test(key) && key.replace(/\{\d+\}/g,'').trim().length > 3).sort(([a],[b])=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(([key,target])=>({pattern:new RegExp('^'+key.split(/\{\d+\}/).map(escape).join('(.+?)')+'$'),target}));}
 locale=next;cache.clear();document.documentElement.lang=next;
 try{localStorage.setItem(userId?'sparky-language:'+userId:'sparky-interface-language',next);localStorage.setItem('sparky-interface-language',next);}catch{}
 listeners.forEach(listener=>listener());
}
export const getInterfaceLocale = () => locale;
export const useCurrentInterfaceLanguage = () => useSyncExternalStore(subscribe,()=>locale,()=> "pt-BR" as Locale);
export function useInterfaceLanguage(userId?:string){
 const current=useSyncExternalStore(subscribe,()=>locale,()=> 'pt-BR' as Locale);
 useEffect(()=>{let saved:string|null=null;try{saved=localStorage.getItem(userId?'sparky-language:'+userId:'sparky-interface-language');}catch{}void setInterfaceLanguage(saved==='en'?'en':'pt-BR',userId).catch(()=>{});},[userId]);
 return current;
}
