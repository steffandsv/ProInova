/**
 * ZIP mínimo, sem compressão (método "store"): os PDFs já vêm comprimidos,
 * então compactar de novo quase não reduz o tamanho. Nomes em UTF-8.
 */

const CRC_TABLE = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(dados: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < dados.length; i++) crc = CRC_TABLE[(crc ^ dados[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dataDos(data: Date) {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | Math.floor(data.getSeconds() / 2);
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate();
  return { hora, dia };
}

export function criarZip(arquivos: { nome: string; dados: Buffer }[]): Buffer {
  const partes: Buffer[] = [];
  const central: Buffer[] = [];
  const { hora, dia } = dataDos(new Date());
  let offset = 0;

  for (const arquivo of arquivos) {
    const nome = Buffer.from(arquivo.nome, "utf8");
    const crc = crc32(arquivo.dados);
    const tamanho = arquivo.dados.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // assinatura do cabeçalho local
    local.writeUInt16LE(20, 4); // versão necessária
    local.writeUInt16LE(0x0800, 6); // bit 11: nome em UTF-8
    local.writeUInt16LE(0, 8); // sem compressão
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(dia, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(tamanho, 18);
    local.writeUInt32LE(tamanho, 22);
    local.writeUInt16LE(nome.length, 26);
    local.writeUInt16LE(0, 28);
    partes.push(local, nome, arquivo.dados);

    const entrada = Buffer.alloc(46);
    entrada.writeUInt32LE(0x02014b50, 0); // assinatura do diretório central
    entrada.writeUInt16LE(20, 4);
    entrada.writeUInt16LE(20, 6);
    entrada.writeUInt16LE(0x0800, 8);
    entrada.writeUInt16LE(0, 10);
    entrada.writeUInt16LE(hora, 12);
    entrada.writeUInt16LE(dia, 14);
    entrada.writeUInt32LE(crc, 16);
    entrada.writeUInt32LE(tamanho, 20);
    entrada.writeUInt32LE(tamanho, 24);
    entrada.writeUInt16LE(nome.length, 28);
    entrada.writeUInt32LE(offset, 42);
    central.push(entrada, nome);

    offset += local.length + nome.length + tamanho;
  }

  const diretorio = Buffer.concat(central);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0); // fim do diretório central
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(diretorio.length, 12);
  fim.writeUInt32LE(offset, 16);

  return Buffer.concat([...partes, diretorio, fim]);
}
