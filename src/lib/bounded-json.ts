export async function readBoundedJson(request: Request, limit = 4096): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw new Error('Dados muito grandes.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Dados inválidos.');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if(done) break;
      length += value.byteLength;
      if(length > limit){await reader.cancel();throw new Error('Dados muito grandes.');}
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(length);let offset=0;
  for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));}catch{throw new Error('Dados inválidos.');}
  if(!body||Array.isArray(body)||typeof body!=='object')throw new Error('Dados inválidos.');
  return body;
}
