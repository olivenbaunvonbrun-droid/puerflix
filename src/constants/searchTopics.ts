import { NationalityOption, SearchTopicCategory } from '../types';

export const NATIONALITY_OPTIONS: NationalityOption[] = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', language: 'Português (Brasil)', hl: 'pt-BR', gl: 'BR' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', language: 'Português (Portugal)', hl: 'pt-PT', gl: 'PT' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', language: 'Inglês (EUA)', hl: 'en-US', gl: 'US' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', language: 'Inglês (UK)', hl: 'en-GB', gl: 'GB' },
  { code: 'ES', name: 'Espanha / América Latina', flag: '🇪🇸', language: 'Espanhol', hl: 'es-ES', gl: 'ES' },
  { code: 'FR', name: 'França', flag: '🇫🇷', language: 'Francês', hl: 'fr-FR', gl: 'FR' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', language: 'Italiano', hl: 'it-IT', gl: 'IT' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', language: 'Alemão', hl: 'de-DE', gl: 'DE' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵', language: 'Japonês', hl: 'ja-JP', gl: 'JP' },
  { code: 'ALL', name: 'Global (Qualquer País)', flag: '🌍', language: 'Todos os idiomas', hl: 'pt-BR' },
];

export const CURATED_SEARCH_TOPICS: SearchTopicCategory[] = [
  {
    categoryName: 'Desenhos & Animações',
    icon: '🎨',
    topics: [
      { label: 'Desenhos Educativos', query: 'desenhos educativos infantil', icon: '🎨' },
      { label: 'Animações Clássicas', query: 'desenhos classicos infantis', icon: '📺' },
      { label: 'Bebês & Primeiros Anos', query: 'desenhos para bebes estimulacao', icon: '👶' },
      { label: 'Desenhos Bíblicos', query: 'desenhos biblicos infantis', icon: '🕊️' },
      { label: 'Aventuras Infantis', query: 'desenhos infantis aventura', icon: '🚀' },
      { label: 'Super-Heróis Infantis', query: 'desenhos super herois infantil', icon: '🦸' },
    ],
  },
  {
    categoryName: 'Músicas & Dança',
    icon: '🎵',
    topics: [
      { label: 'Cantigas de Roda', query: 'cantigas de roda infantil', icon: '🎶' },
      { label: 'Músicas para Bebês', query: 'musicas para bebes ninar', icon: '🍼' },
      { label: 'Canções Educativas', query: 'cancoes educativas infantis', icon: '🔤' },
      { label: 'Dança Infantil', query: 'coreografias e dancas infantis', icon: '💃' },
      { label: 'Cantigas para Dormir', query: 'cancoes de ninar calmas bebes', icon: '🌙' },
      { label: 'Músicas em Família', query: 'musicas infantis para cantar junto', icon: '👨‍👩‍👧' },
    ],
  },
  {
    categoryName: 'Ciência & Natureza',
    icon: '🔬',
    topics: [
      { label: 'Experimentos Infantis', query: 'experimentos cientificos criancas', icon: '🧪' },
      { label: 'Dinossauros & Fósseis', query: 'dinossauros para criancas curiosidades', icon: '🦖' },
      { label: 'Mundo Animal', query: 'animais da floresta infantil documentario', icon: '🦁' },
      { label: 'Astronomia & Planetas', query: 'planetas e sistema solar para criancas', icon: '🪐' },
      { label: 'Como as Coisas Funcionam', query: 'como funciona explicacoes simples criancas', icon: '⚙️' },
      { label: 'Corpo Humano', query: 'corpo humano para criancas explicativo', icon: '🫀' },
    ],
  },
  {
    categoryName: 'Histórias & Leitura',
    icon: '📚',
    topics: [
      { label: 'Contação de Histórias', query: 'contacao de historias infantil', icon: '📖' },
      { label: 'Fábulas & Contos de Fadas', query: 'fabulas e contos de fadas infantis', icon: '🏰' },
      { label: 'Histórias para Dormir', query: 'historias para dormir calmas infantil', icon: '🛌' },
      { label: 'Livros Infantis Narrados', query: 'livros infantis narrados ilustrados', icon: '📕' },
      { label: 'Alfabetização & Sílabas', query: 'aprender o alfabeto e ler infantil', icon: '✏️' },
      { label: 'Poesias Infantis', query: 'poesias e rimas infantis', icon: '📝' },
    ],
  },
  {
    categoryName: 'Artes & Brincadeiras',
    icon: '✂️',
    topics: [
      { label: 'Aprender a Desenhar', query: 'aprender a desenhar passo a passo infantil', icon: '🖍️' },
      { label: 'Artesanato & DIY', query: 'artesanato com papel e sucatas criancas', icon: '📦' },
      { label: 'Origami Fácil', query: 'origami facil papel para criancas', icon: '🦢' },
      { label: 'Massinha & Modelagem', query: 'brincadeiras com massinha de modelar', icon: '🧁' },
      { label: 'Culinária Divertida', query: 'receitas faceis para fazer com criancas', icon: '🍪' },
      { label: 'Jogos Educativos', query: 'brincadeiras e jogos educativos em casa', icon: '🎲' },
    ],
  },
  {
    categoryName: 'Idiomas Infantis',
    icon: '🌍',
    topics: [
      { label: 'Inglês para Crianças', query: 'english for kids songs learning cartoon', icon: '🇬🇧' },
      { label: 'Espanhol Infantil', query: 'espanol para ninos canciones dibujos', icon: '🇪🇸' },
      { label: 'Francês Infantil', query: 'francais pour enfants comptines', icon: '🇫🇷' },
      { label: 'Alemão Infantil', query: 'deutsch fur kinder lieder', icon: '🇩🇪' },
      { label: 'Japonês Infantil', query: 'nihongo for kids songs anime', icon: '🇯🇵' },
    ],
  },
];

export function getNationalityByCode(code?: string): NationalityOption {
  if (!code) return NATIONALITY_OPTIONS[0]; // BR
  const found = NATIONALITY_OPTIONS.find(n => n.code.toUpperCase() === code.toUpperCase());
  return found || NATIONALITY_OPTIONS[0];
}
