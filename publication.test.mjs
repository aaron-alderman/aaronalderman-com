import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sourceReceipts} from './retained/source-receipts.js';
const root=new URL('./dist/retained/',import.meta.url);
test('all bundled research sources preserve their recorded bytes',async()=>{
 for(const receipt of Object.values(sourceReceipts)){
  const bytes=await fs.readFile(new URL(receipt.href,root));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),receipt.sha256);assert.equal(bytes.length,receipt.bytes);
 }
});
async function walk(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
test('static entry points and module imports remain relative to their publication path',async()=>{
 for(const file of await walk(fileURLToPath(root))){
  if(!/\.(html|css|js)$/.test(file)||file.includes(path.sep+'sources'+path.sep))continue;
  const text=await fs.readFile(file,'utf8');
  const documentPath=path.relative(path.resolve(fileURLToPath(new URL('./dist/',import.meta.url))),file).replaceAll('\\','/');
  const documentURL=new URL(documentPath,'https://publication.invalid/'),baseURL=new URL(text.match(/<base\s+href="([^"]+)"/)?.[1]??'./',documentURL);
  const refs=file.endsWith('.html')?[...text.replace(/<base\b[^>]*>/g,'').matchAll(/(?:src|href)="([^"$]+)"/g)].map(m=>m[1]):file.endsWith('.css')?[...text.matchAll(/url\(['"]?([^)'"$]+)['"]?\)/g)].map(m=>m[1]):[...text.matchAll(/(?:from\s*|import\s*\(|new URL\(|fetch\()\s*['"](\.[^'"$]+)['"]/g)].map(m=>m[1]);
  for(const ref of refs){if(/^(?:[a-z]+:|#|\{)/i.test(decodeURIComponent(ref))||ref.includes('<'))continue;assert.ok(!ref.startsWith('/'),file+': '+ref);const url=new URL(ref,baseURL),target=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)),'.'+url.pathname);const info=await fs.stat(target);assert.ok(info.isFile()||(info.isDirectory()&&(await fs.stat(path.join(target,'index.html'))).isFile()),file+': '+ref);}
 }
});
