import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

// Carrega variáveis do arquivo .env (use na raiz ou em backend/.env se for o caso)
dotenv.config({ path: "./backend/.env" });

const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  throw new Error("OPENAI_API_KEY não definido. Adicione em backend/.env ou use variável de ambiente.");
}

const client = new OpenAI({ apiKey: openaiKey });

const prompts = [
  {
    nome: "beleza",
    text: `Flat lay editorial de produtos skincare — sérum, protetor solar e hidratante — dispostos de forma assimétrica sobre superfície de mármore branco, com uma folha verde compondo a cena, luz natural lateral suave, atmosfera clean e sofisticada, paleta em tons creme e verde musgo, estética premium de editorial de beleza, composição minimalista, alta definição, proporção 16:9, sem texto. sem pessoas, sem marcas visíveis, sem logotipos, sem embalagem com texto legível, composição limpa, foco nítido, qualidade fotográfica editorial`,
  },
  {
    nome: "saude",
    text: `Composição minimalista com termômetro digital e frasco de vitaminas sobre fundo azul-aço muito suave, sombras longas e nítidas produzidas por luz de estúdio, visual limpo, clínica premium, organização precisa dos objetos, aparência moderna e confiável, estilo editorial farmacêutico sofisticado, alta definição, proporção 16:9, sem texto. sem pessoas, sem marcas visíveis, sem logotipos, sem embalagem com texto legível, composição limpa, foco nítido, qualidade fotográfica editorial`,
  },
  {
    nome: "casa",
    text: `Interior aconchegante com air fryer e plantas sobre bancada de cozinha, luz dourada de fim de tarde entrando pela janela, ambiente acolhedor em tons terracota e bege, estilo editorial de revista de decoração, composição elegante e realista, sensação de casa organizada e charmosa, alta definição, proporção 16:9, sem texto. sem pessoas, sem marcas visíveis, sem logotipos, sem embalagem com texto legível, composição limpa, foco nítido, qualidade fotográfica editorial`,
  },
];

async function gerar() {
  fs.mkdirSync("public/images/blog", { recursive: true });

  for (const p of prompts) {
    console.log(`Gerando banner: ${p.nome}`);

    const resp = await client.images.generate({
      model: "gpt-image-1",
      prompt: p.text,
      size: "1920x1080",
    });

    const b64 = resp.data[0].b64_json;
    const buffer = Buffer.from(b64, "base64");
    const output = `public/images/blog/banner-${p.nome}.png`;

    fs.writeFileSync(output, buffer);
    console.log("Gerado:", output);
  }
}

gerar().catch((e) => {
  console.error("Erro ao gerar banners:", e);
  process.exit(1);
});

